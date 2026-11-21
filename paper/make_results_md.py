"""Write docs/RESULTS.md: every number of the four paper runs, read straight from paper_runs/<job>/*.json.

Usage (from the repo root):  python paper/make_results_md.py
Nothing is typed by hand, so the document always matches the stored outputs.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNS = [
    ("80b37628b193", "Single weakness, Qwen3-0.6B", "docs/RUNNING.md §14"),
    ("409305f3e2f2", "Single weakness, Qwen3-1.7B", "docs/RUNNING.md §15"),
    ("76f2c9af5ea9", "Multi-weakness, Qwen3-0.6B", "docs/RUNNING.md §16–17"),
    ("4e6b61903c00", "Multi-weakness, Qwen3-1.7B", "docs/RUNNING.md §18"),
]
BENCH = ["gsm8k", "gsm_symbolic:main", "probes_train_families", "probes_heldout_families"]
SHORT = {"gsm8k": "GSM8K", "gsm_symbolic:main": "GSM-Sym", "probes_train_families": "Probes (train fam.)",
         "probes_heldout_families": "Probes (held-out fam.)"}


def load(job: str, name: str):
    p = ROOT / "paper_runs" / job / name
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def f3(x) -> str:
    return "—" if x is None else f"{x:.3f}"


def sd(x) -> str:
    return "—" if x is None else f"{x:+.3f}"


def ci(d: dict) -> str:
    return f"{sd(d['mean_diff'])} [{sd(d['ci_low'])}, {sd(d['ci_high'])}]"


def arm_name(a: dict) -> str:
    return f"{a['arm']} (r{a['ratio']:g})" if a["arm"].startswith("targeted") else a["arm"]


def run_section(job: str, title: str, pointer: str) -> list[str]:
    r, dg, pv = load(job, "results.json"), load(job, "diagnosis.json"), load(job, "provenance.json")
    L = [f"## {title} — job `{job}`", ""]
    L += [f"- Model: `{r['model']}` (revision `{pv.get('model_revision')}`), prompt `{pv.get('prompt_version')}`, "
          f"seeds {pv.get('seeds')}",
          f"- Code commit at the start: `{pv['git']['commit'][:7]}` (repo clean: {not pv['git']['dirty']}); "
          f"GPU: {pv.get('gpu')}; torch {pv['packages'].get('torch')}, transformers {pv['packages'].get('transformers')}",
          f"- Mode `{r['mode']}`, complete: {r['complete']}, paper-eligible: {r['paper_eligible']}"
          + (f"; arms real_only/untargeted/matched_control/targeted reused from `{r['reference_job']}`"
             if r.get("reference_job") else ""),
          f"- Write-up: {pointer}. Raw files: `paper_runs/{job}/`.", ""]
    for w in r.get("warnings") or []:
        L += [f"> Warning stored with the run: {w}", ""]

    if dg:
        s = dg["summary"]
        L += ["### Diagnosis of the untrained model (LLTM on generated probes)", "",
              f"{s['n_examples']} problems × {s['n_responses'] // max(s['n_examples'], 1)} samples = {s['n_responses']} answers; "
              f"accuracy {f3(s['accuracy'])}.", "",
              "| Feature | η (logit per unit) | 95% CI | Range (p10–p90) | Effect E = η·range | Significant |",
              "|---|---|---|---|---|---|"]
        for w in dg["weaknesses"]:
            L.append(f"| `{w['feature']}` | {w['eta']:+.3f} | [{w['ci_low']:+.3f}, {w['ci_high']:+.3f}] | "
                     f"{w['range']:g} | {w['effect']:+.3f} | {'yes' if w['significant'] else 'no'} |")
        ed = s.get("error_distribution", {})
        L += ["", "Error types of the wrong answers (original classifier): "
              + ", ".join(f"{k} {v:.1%}" for k, v in sorted(ed.items(), key=lambda kv: -kv[1])), ""]

    t = r["target"]
    if t["strategy"] == "multi":
        L += ["### Targets (multi-weakness)", "", "| Feature | Threshold | Weight |", "|---|---|---|"]
        L += [f"| `{x['feature']}` | > {x['threshold']:g} | {x['weight']:.3f} |" for x in t["targets"]]
    else:
        L += ["### Target", "", f"Strategy `{t['strategy']}`: feature `{t['feature']}` > {t['threshold']:g}."]
    L += ["", "### Untrained model (baseline)", "", "| Benchmark | Accuracy | n |", "|---|---|---|"]
    L += [f"| {SHORT.get(b, b)} | {f3(v['accuracy'])} | {v['n']} |" for b, v in r["baseline"].items()]

    L += ["", "### Every arm: accuracy (mean of 3 seeds ± SD) and change vs the untrained model [95% CI]", "",
          "| Arm | trained in | " + " | ".join(SHORT[b] for b in BENCH) + " |",
          "|---|---|" + "---|" * len(BENCH)]
    for a in r["arms"]:
        cells = []
        for b in BENCH:
            m = a["benchmarks"].get(b)
            cells.append("—" if not m else f"{m['accuracy_mean']:.3f} ± {m['accuracy_sd']:.3f}<br>{ci(m['vs_base'])}")
        L.append(f"| {arm_name(a)} | `{a.get('source_job') or job}` | " + " | ".join(cells) + " |")

    p = r["primary"]
    L += ["", f"### Primary question: {p['question']} (`{p['a']}` − `{p['b']}`)", "",
          "| Benchmark | Difference [95% CI] | p | n | Significant |", "|---|---|---|---|---|"]
    L += [f"| {SHORT.get(x['benchmark'], x['benchmark'])} | {ci(x)} | {x['p_value']:.3f} | {x['n']} | "
          f"{'yes' if x['significant'] else 'no'} |" for x in p["results"]]

    L += ["", "### All paired comparisons (paired bootstrap over problems)", "",
          "| A − B | Benchmark | Difference [95% CI] | p | n | Significant |", "|---|---|---|---|---|---|"]
    for c in r["comparisons"]:
        L.append(f"| `{c['a']}` − `{c['b']}` (r{c['ratio']:g}) | {SHORT.get(c['benchmark'], c['benchmark'])} | {ci(c)} | "
                 f"{c['p_value']:.3f} | {c['n']} | {'yes' if c['significant'] else 'no'} |")

    slices = [a for a in r["arms"] if a.get("weakness_slices")]
    if slices:
        feats = list(slices[0]["weakness_slices"])
        L += ["", "### Per-weakness slices: held-out probes with the feature above its threshold (before → after)", "",
              "| Arm | " + " | ".join(f"`{f}`" for f in feats) + " |", "|---|" + "---|" * len(feats)]
        for a in slices:
            cells = []
            for f in feats:
                h = a["weakness_slices"].get(f, {}).get("probes_heldout_families", {}).get("above")
                cells.append("—" if not h else f"{h['before']:.2f} → {h['after']:.2f} (n {h['n']})")
            L.append(f"| {arm_name(a)} | " + " | ".join(cells) + " |")
    elif any(a.get("target_slice") for a in r["arms"]):
        L += ["", "### Target slice (problems above the target threshold): before → after", "",
              "| Arm | Benchmark | Above threshold | At or below |", "|---|---|---|---|"]
        for a in r["arms"]:
            for b, v in (a.get("target_slice") or {}).items():
                if isinstance(v, dict) and "above" in v:
                    L.append(f"| {arm_name(a)} | {SHORT.get(b, b)} | {v['above']['before']:.2f} → {v['above']['after']:.2f}"
                             f" (n {v['above']['n']}) | {v['at_or_below']['before']:.2f} → {v['at_or_below']['after']:.2f}"
                             f" (n {v['at_or_below']['n']}) |")

    eta_rows = [a for a in r["arms"] if a.get("eta_change")]
    if eta_rows:
        feats = list(eta_rows[0]["eta_change"])
        L += ["", "### Change in LLTM η after training (refit on probes; negative = the feature hurts less)", "",
              "| Arm | " + " | ".join(f"`{f}`" for f in feats) + " |", "|---|" + "---|" * len(feats)]
        for a in eta_rows:
            L.append(f"| {arm_name(a)} | " + " | ".join(sd(a["eta_change"].get(f)) for f in feats) + " |")
    L.append("")
    return L


def main() -> None:
    L = ["# RESULTS — every output of the four paper runs (GPU-verified)", "",
         "Generated by `python paper/make_results_md.py` from `paper_runs/<job>/` — do not edit by hand. All four runs",
         "were trained and evaluated on one RTX 4060 Laptop GPU (8 GB) in paper mode (clean repo, no overrides).",
         "What each number means and how it was produced: `docs/RUNNING.md` §14–19 and `paper/main.tex`.", "",
         "**Notes for readers**",
         "- Accuracies are exact-match on the final number; differences are paired bootstrap estimates over problems.",
         "- Baseline rows give the untrained model on all problems it was scored on (n column). Every comparison is paired on",
         "  the problems counted in its n column, the same problems for every arm.",
         "- Error types come from the original automatic classifier. Its check against an independent LLM annotator",
         "  (κ = 0.33; 0.39 after the 2026-11-11 parser fix) is in `paper/annotation/` and `docs/RUNNING.md` §19.",
         "- The 2026-11-11 fixes do not change any stored number; the logged values below are the paper's values.",
         "- Per-answer texts: `paper_runs/<job>/responses/<arm>.jsonl.gz` (one JSON object per answer).", ""]
    L += ["## At a glance: aiming at weaknesses vs an equally hard control", "",
          "| Run | Comparison | GSM8K | GSM-Symbolic | Held-out probes |", "|---|---|---|---|---|"]
    for job, title, _ in RUNS:
        r = load(job, "results.json"); a, b = r["primary"]["a"], r["primary"]["b"]
        row = {c["benchmark"]: c for c in r["comparisons"] if c["a"] == a and c["b"] == b}
        L.append(f"| {title} | `{a}` − `{b}` | " + " | ".join(
            ci(row[k]) + (" *" if row[k]["significant"] else "") if k in row else "—"
            for k in ["gsm8k", "gsm_symbolic:main", "probes_heldout_families"]) + " |")
    L += ["", "\\* = 95% CI excludes 0.", ""]
    eq_path = ROOT / "paper" / "equivalence.json"
    if eq_path.exists():
        eq = json.loads(eq_path.read_text(encoding="utf-8"))
        L += ["## Equivalence tests (TOST) of targeted − matched control", "",
              f"From `paper/equivalence.json` (`python paper/equivalence.py`): 90% paired bootstrap interval "
              f"({eq['n_boot']} resamples, seed {eq['seed']}), the smallest margin δ the comparison would pass, and the "
              f"TOST p-value for the margin ±{eq['margin']:g} (chosen after the main results were known). The upper end "
              "of the 90% interval is a one-sided 95% bound on the benefit of targeting. The last column is a sensitivity check: a "
              "two-level bootstrap that also resamples the 3 training seeds of each arm (all other intervals in this file "
              "resample problems only, with correctness averaged over seeds).", "",
              "| Comparison | Benchmark | Difference | 90% CI | δ passed | p (TOST) | Equivalent at margin | 95% CI, seeds + problems |",
              "|---|---|---|---|---|---|---|---|"]
        for x in eq["rows"]:
            L.append(f"| {x['label']} | {SHORT.get(x['benchmark'], x['benchmark'])} | {sd(x['mean_diff'])} | "
                     f"[{sd(x['ci90'][0])}, {sd(x['ci90'][1])}] | {x['bound']:.3f} | {x['p_tost']:.3f} | "
                     f"{'yes' if x['equivalent'] else 'no'} | "
                     + (f"[{sd(x['ci95_seed_problem'][0])}, {sd(x['ci95_seed_problem'][1])}]" if 'ci95_seed_problem' in x else "—")
                     + " |")
        L.append("")
    for job, title, pointer in RUNS:
        L += run_section(job, title, pointer)
    (ROOT / "docs" / "RESULTS.md").write_text("\n".join(L), encoding="utf-8")
    print("wrote docs/RESULTS.md,", len(L), "lines")


if __name__ == "__main__":
    main()
