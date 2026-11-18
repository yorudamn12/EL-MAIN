# What changes when the paper goes to a different journal

The draft in `main.tex` is written for a general journal. Before sending it to a specific one, check each
item below against that journal's "Guide for authors" and change only what the journal asks for.
The science (numbers, tables, claims) never changes between journals.

| # | Item | Where in `main.tex` | Now (general) | What journals vary on |
|---|---|---|---|---|
| 1 | Template / class | `\documentclass{article}` + packages | plain article, 11 pt, 1 in margins | Elsevier `elsarticle`, Springer `sn-jnl`, IEEE `IEEEtran`, ACM `acmart`, MDPI/PLOS Word or LaTeX templates; single vs. two columns |
| 2 | Reference style | `\bibliographystyle{plainnat}`, `natbib` | author–year names, numbered | numbered [1] (IEEE, Springer basic), author–year (Elsevier Harvard, APA); some need DOIs on every entry |
| 3 | Abstract | `abstract` env | ~220 words, one paragraph | word limit (150–300); structured abstract (Background / Methods / Results / Conclusions) at some journals |
| 4 | Keywords | after the abstract (6, added v0.5) | 6 keywords | most journals want 4–6 keywords after the abstract |
| 5 | Highlights / graphical abstract | not present | — | Elsevier asks for 3–5 highlights (≤85 characters each); some ask for a graphical abstract |
| 6 | Length | ~6,500 words, 7 tables, 2 figures (v0.5) | — | page or word limits (letters ~4 pages, full papers 8–30 pages); move details to an appendix or supplement if needed |
| 7 | Authors and affiliations | `\author{...}` | 4 names, RV College of Engineering; corresponding author + e-mail still TODO | format of affiliations, ORCID iDs, corresponding-author marker |
| 8 | Author contributions | `\paragraph{Author contributions.}` | one general sentence | CRediT roles per author (Conceptualization, Software, …) at Elsevier/Springer/PLOS; some journals have none |
| 9 | Funding | `\paragraph{Funding.}` | "no specific grant" | exact wording; grant numbers if any |
| 10 | Competing interests | `\paragraph{Competing interests.}` | "none" | heading name ("Declaration of competing interest", "Conflict of interest") |
| 11 | AI-use statement | `\paragraph{Use of AI tools.}` | names the assistant and what it did | Elsevier wants a "Declaration of generative AI…" section before the references; Springer puts it in Methods; some ban AI-written text — read the policy first |
| 12 | Data and code availability | `\paragraph{Data and code availability.}` | GitHub link + run IDs | some want a DOI (Zenodo copy of the repo), a "Data availability statement" heading, or code in a supplement |
| 13 | Anonymity | author block, repo URL, AI-use statement | names visible | double-blind journals/conferences: remove names, anonymise the repo link (e.g. anonymous.4open.science) |
| 14 | Figures and tables | tables in text; figures are TikZ in `figures/*.tex` | inline tables and 2 vector figures | some want tables/figures at the end or as separate files; figure format/DPI rules |
| 15 | Cover letter, suggested reviewers | not written | — | most journals ask for both at submission |

Also check per journal: whether a preprint (arXiv) is allowed, the licence (open access fee or not), and
whether the language is US or UK English.

---

# Holes in the paper and the plan to make it journal-level (self-review, 2026-11-19)

Written after three verification passes of draft v0.5 against `paper_runs/` and `runs/`. Part A lists what a hostile
reviewer would attack, most serious first, and what the draft already does about it. Part B is the plan. Nothing in
Part B changes the four finished paper runs; items that need new runs are new paper-mode runs from a clean repo
(CLAUDE.md rules), and anything that changes the pipeline, configs or scorer needs the team's OK first.

## A. Holes, most serious first

| # | Hole (reviewer's words) | Status in v0.5 | What closes it |
|---|---|---|---|
| H1 | "Your comparison happens inside a recipe that destroys the model": every arm loses 15–24 GSM8K points, so a targeting benefit could be masked. | Scoped in abstract, §5 cost section and conclusion; shared by all arms, so the comparison is fair. Still the biggest objection. | B2-1: a recipe that keeps general accuracy (teacher-written solutions filtered by the generator's exact answer, or RL with the generator as reward), then rerun targeted vs control. |
| H2 | "Underpowered null result." 300 GSM8K / 200 GSM-Symbolic problems and 3 seeds. Seed variance is as large as problem noise (arm SDs up to 3.6 points on GSM8K, 6.6 on probes). | v0.5 adds TOST (only 1 of 8 comparisons equivalent at ±3) and a seed+problem bootstrap (real-benchmark intervals about ±5–6 points; benefit > ~7 points excluded). Two probe findings (1.7B −0.047, 0.6B multi +0.052) do not survive it and are now called suggestive. | B1-1 full test sets (no retraining); B1-2 five seeds; B0-2 mixed-effects model. |
| H3 | "The equivalence margin was chosen after seeing the data." | Disclosed; the smallest passing margin is reported for every comparison. | Pre-register the margin and analysis (B0-1) before any new runs, and apply it to them. |
| H4 | "The 1.7B single-weakness control is not matched and is easier." KS 0.27–0.28; mean predicted accuracy 0.59 vs 0.53. | Disclosed with the cause (only 7,483 short problems in the band vs ~10,000 needed). The 1.7B multi-weakness comparison (KS < 0.002) agrees. | B1-3: rerun that control with a larger short-problem pool (design unchanged). |
| H5 | "Equal tokens is not equal data": the single-weakness targeted arm has 22–26% fewer distinct problems than its control. | Now a stated limitation; the multi-weakness arms are balanced and agree. | B1-4: one ablation with equal problem counts (or report token- and count-matched results side by side). |
| H6 | "Probe gains may be format learning": probes and training data come from one generator. | Caveat moved into Results; real benchmarks are the primary outcome (fixed in advance, PLAN D8). | B0-4: 100–150 human-written held-out problems with the same features; B1-5 other benchmarks (SVAMP, GSM-Plus, MAWPS). |
| H7 | "Does the diagnosed weakness exist on real data?" The LLTM is fitted on generated probes only; McFadden R² 0.25–0.28; additivity assumed. | Long-real-problem analysis (50 problems, descriptive). | B0-3: untrained accuracy vs number of calculator steps on all 1,319 GSM8K problems (stored answers, no GPU); test an interaction term (steps × div) in the LLTM; report calibration of predicted vs observed probe accuracy. |
| H8 | "Error labels validated only by an LLM, and the same LLM helped write the paper." κ 0.33 (0.39 corrected). | Fully disclosed (§5.5, AI-use statement); labels do not affect any accuracy result. | B0-5: two authors label the same 100 answers blind → human–human and human–LLM κ. |
| H9 | "One model family, thinking mode off, one task." | Stated in Limitations. | B2-2: one other family (e.g. Llama-3.2-1B, needs licence) and Qwen3-4B in 4-bit; optional thinking-mode evaluation. |
| H10 | "Many comparisons, no correction." | Primary outcome named as fixed in advance; others labelled secondary. | B0-2: Holm correction for the secondary family in the appendix. |
| H11 | "Not reproducible: adapters are not public." | Code, configs, every answer in git. | B0-6: upload the 42 adapters to Hugging Face, release tag + Zenodo DOI, LICENSE, CITATION.cff, CI. |
| H12 | "Only two targeting rules; why does multi-weakness converge to the control?" | Named finding in the Discussion (additive model ⇒ targeting all factors ≈ matching difficulty). | B2-3: arms with equal predicted difficulty that differ only in factor mix — a direct test of the finding. |

Smaller items: the per-step figure uses the diagnosis at temperature 0.7 while evaluation is greedy (state it in the
caption if a reviewer asks); `log10_max` is significant only for 0.6B; GSM-Symbolic has no error types (no step
annotations); the 1.7B baseline used 660 GSM8K problems, the 0.6B baseline 1,319 (paired comparisons are unaffected).

## B. Plan

**Phase 0 — no GPU, about one week (can start now).**
- B0-1 Write a short pre-registration (margin ±3 points, primary outcome, analysis, stopping rules) and commit it
  before any new run. Put it in `docs/` and cite its commit hash in the paper.
- B0-2 Mixed-effects logistic regression on the stored answers (arm fixed effect; problem and seed random effects);
  Holm correction for secondary comparisons. Needs `statsmodels` or similar → ask before adding the dependency.
- B0-3 Real-data validity of the diagnosis (H7) from the stored base answers in `paper_runs/*/responses/base.jsonl.gz`.
- B0-4 Write 100–150 human held-out probe problems with known features (team task; Claude can check features).
- B0-5 Human error labels on 100 answers by two authors, blind (team task).
- B0-6 Release: Hugging Face adapters, merge to `main`, tag `v1.0-paper`, Zenodo DOI, LICENSE, CITATION.cff, CI.

**Phase 1 — GPU, same protocol, about 3–4 days on the RTX 4060.**
- B1-1 Re-evaluate all 42 adapters on the full GSM8K test (1,319) and all 500 GSM-Symbolic problems (~1 day).
  Expected interval width about half of today's.
- B1-2 Add seeds 3 and 4 for the four primary arms per model (8 trainings per model, about 1.5 h each).
- B1-3 Rerun the 1.7B single-weakness control with a larger pool (~5 h).
- B1-4 Equal-problem-count ablation for the single-weakness pair, 0.6B only (~10 h).
- B1-5 Evaluate on SVAMP / GSM-Plus (download size to be checked; ask if > 1 GB) and on the human probes from B0-4.

**Phase 2 — new protocol, the step that makes it a strong journal paper (2–3 weeks).**
- B2-1 Recipe that keeps general accuracy (H1): pilot one arm, one seed on 0.6B and check the GSM8K drop is gone
  before the full design; then targeted vs matched control under the new recipe, both models, five seeds.
- B2-2 Second model family and Qwen3-4B (4-bit).
- B2-3 Factor-mix test of the convergence finding.

**Writing, in parallel.**
- Lead with the method (difficulty-matched control) as the contribution and the null result as its first
  application; add a related-work table contrasting CRAFT, CDS, KITE, SwS, Self-Error-Instruct on "control used".
- Move run details, the exploratory ablation and the label check to an appendix if the journal has a page limit.
- Cover letter: the null result, why the matched control matters, and the equivalence/seed analyses.

**Venue.** With Phase 0 + Phase 1 the paper is a solid submission to JETAI (team review's first choice) or
Computational Intelligence; TMLR judges claims rather than novelty and also fits. With Phase 2 (H1 answered) it
becomes competitive for stronger ML venues. Submit after Phase 1 and keep Phase 2 as the revision experiment or a
second paper, unless reviewers' time allows it first.
