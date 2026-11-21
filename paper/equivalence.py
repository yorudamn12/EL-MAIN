"""Equivalence test (TOST) for the four targeted - control comparisons, from the stored per-answer files.

Usage (from the repo root):  python paper/equivalence.py [--margin 0.03]
Writes paper/equivalence.json; docs/RESULTS.md and the paper read it.

Method. For each comparison and benchmark, the correctness of each problem is averaged over the three seeds of an arm,
and the per-problem differences are resampled 10,000 times (same paired bootstrap and random seed as the pipeline,
dreammachine/experiments/pipeline.py::paired_bootstrap, so the 95% intervals reproduce the stored ones exactly).
Two one-sided tests at alpha = 0.05 (TOST) declare the arms equivalent within +/-margin when the 90% interval lies
inside (-margin, +margin). `bound` is the smallest margin that the comparison would pass, so a reader can apply any
other margin. Uses only numpy and the files in paper_runs/; no GPU, no model.
"""

from __future__ import annotations

import argparse
import gzip
import json
from collections import defaultdict
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
COMPARISONS = [  # (job, label, arm a, arm b)
    ("80b37628b193", "Single weakness, 0.6B", "targeted_r3", "matched_control_r3"),
    ("409305f3e2f2", "Single weakness, 1.7B", "targeted_r3", "matched_control_r3"),
    ("76f2c9af5ea9", "Multi-weakness, 0.6B", "multi_targeted_r3", "multi_matched_control_r3"),
    ("4e6b61903c00", "Multi-weakness, 1.7B", "multi_targeted_r3", "multi_matched_control_r3"),
]
BENCH = ["gsm8k", "gsm_symbolic:main", "probes_heldout_families"]
N_BOOT, SEED = 10_000, 0


def arm_items(job: str, arm: str) -> dict[str, dict[str, float]]:
    """{benchmark: {example_id: correctness averaged over the arm's seeds}}."""
    acc: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    files = sorted((ROOT / "paper_runs" / job / "responses").glob(f"{arm}_s*.jsonl.gz"))
    if len(files) != 3:
        raise FileNotFoundError(f"{job}/{arm}: expected 3 seed files, found {len(files)}")
    for f in files:
        with gzip.open(f, "rt", encoding="utf-8") as fh:
            for line in fh:
                r = json.loads(line)
                acc[r["source"]][r["example_id"]].append(float(r["correct"] in (True, "True", 1)))
    return {b: {i: float(np.mean(v)) for i, v in d.items()} for b, d in acc.items()}


def arm_seed_items(job: str, arm: str) -> dict[str, dict[str, list[float]]]:
    """{benchmark: {example_id: [correctness per seed, in seed order]}}."""
    acc: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    for f in sorted((ROOT / "paper_runs" / job / "responses").glob(f"{arm}_s*.jsonl.gz")):
        with gzip.open(f, "rt", encoding="utf-8") as fh:
            for line in fh:
                r = json.loads(line)
                acc[r["source"]][r["example_id"]].append(float(r["correct"] in (True, "True", 1)))
    return acc


def seed_problem_ci(a: np.ndarray, b: np.ndarray) -> list[float]:
    """Sensitivity check: 95% CI from a two-level bootstrap that resamples the three training seeds of each arm
    (with replacement, independently) and then the problems, so seed-to-seed training variance is included.
    a, b: arrays of shape (n_problems, n_seeds)."""
    rng = np.random.default_rng(SEED)
    n, k = a.shape
    out = np.empty(N_BOOT)
    for t in range(N_BOOT):
        sa, sb = rng.integers(0, k, k), rng.integers(0, b.shape[1], b.shape[1])
        items = rng.integers(0, n, n)
        out[t] = a[items][:, sa].mean() - b[items][:, sb].mean()
    return [float(np.percentile(out, 2.5)), float(np.percentile(out, 97.5))]


def tost(diff: np.ndarray, margin: float) -> dict:
    rng = np.random.default_rng(SEED)
    idx = rng.integers(0, len(diff), (N_BOOT, len(diff)))
    boots = diff[idx].mean(axis=1)
    lo90, hi90 = np.percentile(boots, [5, 95])
    lo95, hi95 = np.percentile(boots, [2.5, 97.5])
    p_tost = max(float((boots <= -margin).mean()), float((boots >= margin).mean()))
    return {"mean_diff": float(diff.mean()), "ci95": [float(lo95), float(hi95)], "ci90": [float(lo90), float(hi90)],
            "bound": float(max(-lo90, hi90)), "p_tost": p_tost, "equivalent": bool(-margin < lo90 and hi90 < margin),
            "n": int(len(diff))}


def run(margin: float = 0.03) -> dict:
    rows = []
    for job, label, a, b in COMPARISONS:
        xa, xb = arm_items(job, a), arm_items(job, b)
        sa_, sb_ = arm_seed_items(job, a), arm_seed_items(job, b)
        stored = {(c["benchmark"]): c for c in json.loads((ROOT / "paper_runs" / job / "results.json")
                                                          .read_text(encoding="utf-8"))["comparisons"]
                  if c["a"] == a.rsplit("_r", 1)[0] and c["b"] == b.rsplit("_r", 1)[0]}
        for bench in BENCH:
            ids = sorted(set(xa[bench]) & set(xb[bench]))
            res = tost(np.array([xa[bench][i] - xb[bench][i] for i in ids]), margin)
            s = stored.get(bench)
            if s and (abs(s["ci_low"] - res["ci95"][0]) > 1e-9 or abs(s["ci_high"] - res["ci95"][1]) > 1e-9):
                raise RuntimeError(f"{job} {bench}: recomputed 95% CI {res['ci95']} != stored "
                                   f"[{s['ci_low']}, {s['ci_high']}]")
            res["ci95_seed_problem"] = seed_problem_ci(np.array([sa_[bench][i] for i in ids]),
                                                       np.array([sb_[bench][i] for i in ids]))
            rows.append({"job": job, "label": label, "a": a.rsplit("_r", 1)[0], "b": b.rsplit("_r", 1)[0],
                         "benchmark": bench, **res})
    out = {"margin": margin, "alpha": 0.05, "n_boot": N_BOOT, "seed": SEED, "rows": rows}
    (ROOT / "paper" / "equivalence.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--margin", type=float, default=0.03, help="smallest effect of interest (accuracy, default 0.03)")
    res = run(ap.parse_args().margin)
    for r in res["rows"]:
        print(f"{r['label']:24s} {r['benchmark']:24s} {r['mean_diff']:+.3f}  90% [{r['ci90'][0]:+.3f}, "
              f"{r['ci90'][1]:+.3f}]  bound {r['bound']:.3f}  p_TOST {r['p_tost']:.3f}  "
              f"{'EQUIVALENT' if r['equivalent'] else 'not shown'}  | seed+problem 95% [{r['ci95_seed_problem'][0]:+.3f}, "
              f"{r['ci95_seed_problem'][1]:+.3f}]")
    print("wrote paper/equivalence.json (margin", res["margin"], ")")
