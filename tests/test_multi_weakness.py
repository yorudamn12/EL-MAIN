"""Multi-weakness protocol (PLAN.md §16, decided 2026-11-09). CPU only: the simulated model and the tiny random Llama
of tests/test_jobs.py.

- configs/main_multi.yaml equals configs/main.yaml except the data section (so its arms can be compared with an
  earlier single-weakness paper run without retraining those);
- the selection: weights from the diagnosis, quotas, a difficulty-matched control;
- a multi-weakness paper job end to end, compared with a finished single-weakness paper job;
- power-off safety: a finished training or evaluation is reused, not redone.
"""

import json
from dataclasses import asdict
from pathlib import Path

import pytest

from dreammachine.experiments import pipeline as P
from dreammachine.diagnosis.targeting import _quotas, multi_targets
from dreammachine.jobs import JobError, create_job_from_request, execute_step, run_job
from dreammachine.jobs.control import resume_job
from test_jobs import env  # noqa: F401  (fixture)

ROOT = Path(__file__).resolve().parents[1]


def test_main_multi_differs_from_main_only_in_data():
    main, multi = P.Config.load(ROOT / "configs/main.yaml"), P.Config.load(ROOT / "configs/main_multi.yaml")
    a, b = asdict(main), asdict(multi)
    for k in a:
        if k not in ("name", "output_dir", "data"):
            assert a[k] == b[k], k
    assert {k: v for k, v in main.data.items() if k != "ratios"} == \
        {k: v for k, v in multi.data.items() if k not in ("ratios", "arms", "target_strategy")}
    assert multi.data["arms"] == ["multi_targeted", "multi_matched_control"]
    assert multi.data["target_strategy"] == "multi" and multi.data["ratios"] == [main.data["main_ratio"]]


def test_multi_targets_weights_and_quotas():
    ws = [{"feature": "steps", "eta": .6, "effect": 3.0, "ci_low": .5, "ci_high": .7, "significant": True},
          {"feature": "n_div", "eta": 1.2, "effect": 1.0, "ci_low": .9, "ci_high": 1.4, "significant": True},
          {"feature": "n_carry", "eta": -.04, "effect": -.2, "ci_low": -.1, "ci_high": .02, "significant": False}]
    t = multi_targets(ws, {"steps": 4.0, "n_div": 0.0, "n_carry": 2.0})
    assert [x["feature"] for x in t] == ["steps", "n_div"]          # only significant, largest weight first
    assert [round(x["weight"], 3) for x in t] == [0.75, 0.25] and t[0]["threshold"] == 4.0
    assert sum(_quotas([.49, .2, .13, .12, .06], 1001)) == 1001
    assert _quotas([.75, .25], 10) == [8, 2]


def _paper_presets(presets, tmp):
    one = P.Config(**{**asdict(presets["paper"]), "seeds": [0], "data": {**presets["paper"].data, "ratios": [3]}})
    multi = P.Config(**{**asdict(one), "data": {**one.data, "arms": ["multi_targeted", "multi_matched_control"],
                                                "target_strategy": "multi"}})
    return {**presets, "paper": one, "paper_multi": multi}


def test_multi_weakness_paper_run_end_to_end(env, tiny_model_dir):  # noqa: F811
    store, factory, _, presets, tmp = env
    ps = _paper_presets(presets, tmp)

    def create(**req):
        return create_job_from_request(store, "pipeline", {"mode": "paper", "model": str(tiny_model_dir), **req},
                                       presets=ps, known_models=[], runs_root=tmp / "pipelines",
                                       allow_local_models=True)

    with pytest.raises(JobError) as e:          # nothing to compare with yet
        create(protocol="multi_weakness")
    assert e.value.code == "reuse_mismatch"
    with pytest.raises(JobError):
        create(protocol="both")

    single = create()
    assert store.get_job(single)["resolved"]["protocol"] == "single_weakness"
    assert run_job(store, single, factory, log=lambda s: None) == "done"

    multi = create(protocol="multi_weakness")
    job = store.get_job(multi)
    ref = job["resolved"]["reference"]
    assert ref["job_id"] == single and len(ref["eval_run_ids"]) == 4
    assert job["resolved"]["arms"] == ["multi_targeted", "multi_matched_control"]
    keys = [s["key"] for s in store.get_steps(multi)]
    assert keys == ["preflight", "baseline", "diagnose", "choose_target", "build_data",
                    "train:multi_targeted_r3_s0", "evaluate:multi_targeted_r3_s0",
                    "train:multi_matched_control_r3_s0", "evaluate:multi_matched_control_r3_s0", "compare"]
    st = {s["key"]: s["status"] for s in store.get_steps(multi)}
    assert st["baseline"] == st["diagnose"] == "skipped"          # the single-weakness run's baseline + diagnosis
    assert run_job(store, multi, factory, log=lambda s: None) == "done"

    out = Path(job["output_dir"])
    tgt = json.loads((out / "target.json").read_text(encoding="utf-8"))
    assert tgt["strategy"] == "multi" and tgt["feature"] is None and tgt["targets"]
    assert abs(sum(t["weight"] for t in tgt["targets"]) - 1) < 1e-9
    assert sorted(p.name for p in (out / "data").glob("*.jsonl")) == ["multi_matched_control_r3_s0.jsonl",
                                                                      "multi_targeted_r3_s0.jsonl"]
    man = json.loads((out / "data" / "manifest.json").read_text(encoding="utf-8"))
    tok = {k: v["tokens"] for k, v in man["arms"].items() if not k.startswith("match_")}
    assert max(tok.values()) - min(tok.values()) < 0.05 * max(tok.values())     # equal token budget
    comp = man["multi_composition"]["s0"]
    first = tgt["targets"][0]["feature"]
    assert comp["multi_targeted"]["elevated_share"][first] >= comp["multi_matched_control"]["elevated_share"][first]

    res = json.loads((out / "results.json").read_text(encoding="utf-8"))
    arms = {a["arm"]: a for a in res["arms"]}
    assert set(arms) == {"real_only", "untargeted", "matched_control", "targeted", "multi_targeted",
                         "multi_matched_control"}
    assert arms["targeted"]["source_job"] == single and arms["multi_targeted"]["source_job"] == multi
    assert res["reference_job"] == single and res["target"]["targets"][0]["feature"] == first
    assert set(arms["multi_targeted"]["weakness_slices"]) == {t["feature"] for t in tgt["targets"]}
    assert res["primary"]["a"] == "multi_targeted" and res["primary"]["b"] == "multi_matched_control"
    pairs = {(c["a"], c["b"]) for c in res["comparisons"]}
    assert {("multi_targeted", "targeted"), ("multi_targeted", "untargeted"),
            ("multi_matched_control", "matched_control")} <= pairs
    assert all(r["arm"].startswith("multi_") for r in res["regressions"])   # reference arms report in their run
    md = (out / "report.md").read_text(encoding="utf-8")
    assert "Each targeted weakness" in md and single in md

    # a reference run with other training settings cannot be compared
    other = {**ps, "paper_multi": P.Config(**{**asdict(ps["paper_multi"]),
                                              "train": {**ps["paper_multi"].train, "learning_rate": 1e-3}})}
    with pytest.raises(JobError) as e:
        create_job_from_request(store, "pipeline", {"mode": "paper", "model": str(tiny_model_dir),
                                                    "protocol": "multi_weakness"}, presets=other, known_models=[],
                                runs_root=tmp / "pipelines", allow_local_models=True)
    assert e.value.code == "reuse_mismatch" and "train" in e.value.details["differs"]


def test_power_off_keeps_finished_training_and_evaluation(env):  # noqa: F811
    """The laptop loses power after a model was saved (or evaluated) but before its step was marked done: the
    resumed job keeps that work instead of training (or evaluating) again."""
    store, factory, create, _, _ = env
    a = create(arms=["targeted"])
    steps = store.get_steps(a)
    idx = {s["key"]: s["idx"] for s in steps}
    for i in range(idx["evaluate:targeted_r3_s0"] + 1):
        assert execute_step(store, a, i, factory, log=lambda s: None) == "done"
    first_eval = store.get_step(a, idx["evaluate:targeted_r3_s0"])["run_ids"]
    # simulate the power cut: both steps were "running" when the laptop died
    for k in ("train:targeted_r3_s0", "evaluate:targeted_r3_s0"):
        store.update_step(a, idx[k], status="failed", error={"code": "interrupted", "message": "", "details": None})
    store.update_job(a, status="failed")
    resume_job(store, a)
    assert execute_step(store, a, idx["train:targeted_r3_s0"], factory, log=lambda s: None) == "done"
    trains = [r for r in store.list_runs("train", job_id=a)]
    assert trains[0]["metrics"].get("reused_finished_adapter") is True     # newest first: the resumed step
    assert execute_step(store, a, idx["evaluate:targeted_r3_s0"], factory, log=lambda s: None) == "done"
    assert store.get_step(a, idx["evaluate:targeted_r3_s0"])["run_ids"] == first_eval
    assert store.count_runs("eval", job_id=a) == 2          # baseline + the one evaluation: nothing evaluated twice
