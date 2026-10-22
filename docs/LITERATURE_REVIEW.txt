# Research review and improvement proposal — 2026-10-22

Status: **PROPOSAL.** Nothing here is `CONFIRMED`, no code or config was changed, and `docs/RESEARCH.md` was not
touched. Everything in §3–§5 needs a team decision (PLAN.md open question 10). Evidence labels: **[read]** = I read
the paper's text this session; **[abstract]** = only the abstract/search snippet; **[memory]** = from my own
knowledge, not re-checked this session (verify before citing); **[ours]** = from our own docs, all GPU-verified explore
or paper runs.

Timing: per the user's decision of 2026-10-22, the presentation goes ahead with the current paper results; the plan in
§5 is **for after the presentation and the professors' input**. No pipeline change or GPU work is started by this document.

---

## 1. What our own results say (the starting point)

1. Training on generated data gives big gains on generated probes (0.6B: long problems 18% → 54–71%; 1.7B: 41% → 86–89%).
2. **Every trained model loses 14–24 points on real GSM8K/GSM-Symbolic**, including `real_only` (RUNNING.md §10: −0.225,
   same as targeted). So the loss is not caused by synthetic data. It is caused by SFT on terse solution text: trained
   answers are ~2.4x shorter (≈300 vs 748 chars) and the model drops its own step-by-step reasoning.
3. Targeted ≈ matched control on real tests; targeted is *below* matched control/untargeted on probes (it learned less
   multiplication/division). The 1.7B probes are saturated (86–89%), so arms cannot be separated there.
4. Style fixes tried (§11–13): self-distillation trades the loss against the gain (85% model-written text: −0.08 on
   GSM8K dev, probe gain no longer significant); rigid "steps" template was worse (model loops).
5. Settings tried (§10): lr 5e-5…2e-4, 1–2 epochs, ratio 1–3. **Never tried:** lr ≤ 2e-5, lower rank, bf16 (non-QLoRA) training,
   adapter down-scaling, any on-policy/RL method, preference methods.

The sharpest question for the paper: *a method that makes the model 15–20 points worse on the real benchmark is hard to
sell, whatever the targeted-vs-control result is.* Most of the proposal below attacks that cost.

## 2. What the inspiration papers actually do (and what they don't)

| Paper | What I could verify | What it implies for us |
|---|---|---|
| **CRAFT** (2607.16122, Scale AI) **[read]** | Rubric criteria → capability tree (6 levels, 20,443 pairs) → score model per node → pick weak nodes **dynamically at any depth** → 40 prompts/node → **teacher LLM writes responses** → SFT, 1,000 examples per method. Qwen3-4B/8B, Gemma-3-4B, Llama-3.1-8B; finance/legal. Beats Random and EvalTree (e.g. Qwen3-4B finance 37.6 → 46.0). | Hyperparameters (LoRA vs full, lr, epochs) **not reported**; **no forgetting/general-benchmark check**; benchmark-level results are mixed (Qwen3-8B FinanceBench 12.7 vs Random 21.8). Dynamic granularity beat fixed levels by up to 10 points. Its responses are natural teacher text — the opposite of our terse code text. |
| **KITE** (2607.17043, Luo et al.) **[read]** | Actually a *model-collapse* paper (iterative self-training). DINA on LLM-tagged Q-matrix (slip/guess fixed 0.1) → weak skills (≥0.30) → noisy generation → KBU filter keeps candidates in the 0.2–0.8 quantile band of semantic uncertainty. **LoRA r=8, lr 1e-5, 1 epoch**, 500 labeled items per iteration, trained from base on *human seed + all synthetic*, 5 iterations, 3 seeds, answers verified by gpt-5-mini. Qwen3-1.7B average 59.54 → 60.70 (human only) → 61.52 (KITE). | Gains over human-only are **~1 point average**, not big. Ablation (Llama-3-8B): without weakness profiling 43.2 vs full 45.2, without KBU (token entropy) 43.9. **Their learning rate is 20x lower than ours.** Human data is always kept in the mix. |
| **SwS** (2506.08989, Microsoft) **[read]** | Weakness = problems the model never gets >50% during RL. Synthesize problems from failed-problem *concepts*, filter, **keep only problems the model solves 25–75% of the time**, **budget per category ∝ failure rate**. 7B: 46.7 → 56.7; 3B only +2.5. Weakness-driven > random. | Closest to us in spirit, and it is RL, not SFT. Uses *measured* model pass rate for difficulty (we predict it with the LLTM). Multi-category budget. Note it also controls difficulty (25–75% band), so "targeted vs random" is not entirely confounded in this line of work — our novelty claim in RESEARCH.md §1 should be worded carefully. |
| **Self-Error-Instruct** (ACL 2025) **[abstract]** | Cluster the model's own error types, synthesize per type. | Our error classifier already labels errors (slip/plan/distractor/format) but we do not use the labels for training. |
| **Failure-inducing exploration** (2410.16736) **[abstract]** | Search for inputs that make the model fail, train on them. | Same idea; our factorial probes are a cleaner version. |
| **DART-Math** (2407.13690) **[abstract]** | Rejection tuning is biased to easy queries; sample **more tries for hard queries**, keep k correct answers each. 7B open model only, no GPT-4. | Exactly the selection bias we saw in §11 (hard synthetic items kept the terse text). |
| **Programmatic arithmetic data** (Gangwar et al., LREC 2026, 2502.12855) **[abstract]** | Programmatic arithmetic data helps small models, either as *intermediate fine-tuning before the reasoning set* or *mixed into the instruction mixture*. | Two-stage "synthetic first, natural last" is an untried recipe for us. |
| **SA-SFT / "Talking to Yourself"** (2602.20162) **[read]** | Mix the model's own self-generated data 1:1 with the task data. LLaMA3-8B LoRA GSM8K: base 75.8, task-only 65.6, self-augmented 74.2. Removing all math from the self-data barely changed it (73.7) → benefit is **style matching**, not math replay. | Strongest direct evidence for our exact failure (GSM8K drops after narrow SFT, ~10 points with LoRA) and a cheap fix. |
| **RL's Razor** (2509.04259, ICLR 2026) **[abstract]** | Forgetting tracks KL drift from the base model; on-policy RL finds the KL-closest solution, SFT can drift far. | Argues for RL (or on-policy data) over SFT on external text. |
| **LoRA Learns Less and Forgets Less** (2405.09673) **[abstract]** | LoRA forgets less but learns less; most sensitive to lr, then target modules, then rank. | Supports lowering lr/rank; our §10 range was too high to test it. |
| O'Grady & Ramlan (2607.18266) | **I could not find it either** (second search this session). | Still unverified — remove or fix before submission (WORK.md next-step 5). |

Honest framing: CRAFT and KITE are *LLM-in-the-loop, natural-text* methods with modest, benchmark-dependent gains.
Our setup differs in two ways that matter: (a) code-written terse text, (b) narrow single-factor targeting.

## 3. Where we missed out (ranked by expected payoff)

1. **Training-text mismatch is the main loss** (§1.2). CRAFT/KITE/SA-SFT/SwS all train on text that is natural, model-like,
   or on-policy. Ours is the least model-like text possible.
2. **Learning rate and recipe never reached the regime others use.** KITE: 1e-5, r=8, 1 epoch. We stopped at 5e-5.
   Also: we train QLoRA (NF4 base) but evaluate on a bf16 base (adapter merged). That train/eval quantization mismatch is a
   *hypothesis only* — never tested — but is cheap to test.
3. **Single-factor targeting.** Diagnosis found steps, division, multiplication, distractors (and big numbers for 0.6B)
   all significant; we trained on `steps > 4` only. The control arm taught division/multiplication better and won on
   probes. SwS allocates budget ∝ failure rate; CRAFT selects several nodes. This is already PLAN.md question 10.
4. **Difficulty is predicted, not measured.** SwS/KITE/DART filter by the *model's actual pass rate or uncertainty*; we use
   LLTM-predicted p̂ ∈ [0.3, 0.7]. After the first training round the prediction drifts (the model changed).
5. **Probes are generated like the training data**, so part of the gain may be format learning (our §13 note 3), and 1.7B
   saturates. We never test the *transfer to real hard problems*: the real-test result is one number averaged over easy
   and hard items.
6. **Error labels are unused for training** (slip vs plan vs distractor).
7. **Evaluation power.** 300 GSM8K + 200 GSM-Symbolic problems gives a paired-diff CI of about ±3 points (our own
   numbers: −3.9…+1.4). A true 1–2 point targeting effect cannot be seen. Inference is cheap after adapter merge
   (1.84x faster), so the final evaluation could use all 1,319.
8. **Only SFT was explored**; no RL, no preference method, no weight-space fix.

## 4. Training methods compared (for a 0.6B/1.7B model, 8 GB, native Windows)

| Method | Fixes the style loss? | Keeps "data made by code"? | Cost / risk on our machine | Verdict |
|---|---|---|---|---|
| **A. SFT on code text** (today) | No (−14…−24) | Yes | Cheap | Baseline; keep as the paper's controlled protocol |
| **B. Same, lower lr (1e-5…2e-5), r=8, 1 epoch, bf16 LoRA** | Maybe partly | Yes | Cheap (~15–30 min per dev variant, §10) | **Try first** |
| **C. Adapter down-scaling / weight interpolation** (scale LoRA by 0.3–0.7 at merge; WiSE-FT idea **[memory]**) | Often trades some gain for much less loss | Yes | Almost free: eval only, ~10 min per point on dev | **Try first** |
| **D. Self-augmented replay (SA-SFT)**: add the model's own outputs (on real GSM8K-train *questions*) 1:1 | Evidence says yes (style matching) **[read]** | Training text partly model-written → needs your OK (D2) | Generation ~1 h per ~700 rows (§11) | Strong candidate |
| **E. Difficulty-aware rationalization (DART + STaR idea)**: for hard generated items, give the model the code-made DAG steps/gold answer as a hint, let it write the solution in its own style, accept only if every equation checks | Yes (own style) and no selection bias toward easy items | Items, gold, features from code; text model-written → needs OK (D2, §11 a3) | Cost ≈ §13 (137 min for 700 rows); more tries on hard items | **Best fix for the §13 trade-off** |
| **F. RLVR / GRPO with the code generator as the reward** (answer check is exact, no LLM) | Yes in principle: no target text, on-policy, less drift (RL's Razor) | **Yes — fully**, and the "targeted vs matched control" comparison becomes "which *prompt pool*" | Needs `trl` (new dependency → ask). Windows has no vLLM, so rollouts use slow HF `generate`. A public report claims a full GRPO Qwen3-0.6B GSM8K 0.4754 → 0.7089 **[abstract/secondary, unverified]**; another LoRA-GRPO study on Gemma3-1B saw mostly format-reward gains. Feasibility on 8 GB must be piloted; I have no time estimate. | **Highest-upside research bet**, run as a pilot |
| **G. Preference learning (DPO / step-DPO) on error pairs**: chosen = verified correct solution, rejected = the model's own wrong one; label the rejection with our error classifier **[memory for method names]** | Probably less drift than SFT; unverified for us | Pairs from model samples (needs OK) | Reference model in memory; 0.6B fits | Second bet, after F/E |
| **H. Two-stage "synthetic first, natural last"** (Gangwar-style intermediate FT **[abstract]**): stage 1 synthetic, stage 2 short pass on the model's own verified real-question solutions | Plausible | Mixed | Two short runs | Combine with D/E |
| **I. Larger real share / real replay** | §10: ratio 1 regressed least (−0.20 vs −0.225, within noise) | Yes | Cheap | Only helps if the real text is *model-style* (see D) |
| **J. Teacher-LLM text (CRAFT/KITE style)** | Yes (natural text) | **No** — forbidden by CLAUDE.md | — | **Not proposed** unless you reverse that rule |

Theory note (not specific to math): mixing-ratio theory for synthetic/real data favours keeping a large real/fresh share
(optimal real weight ≈ 0.5–0.62 in the regression setting) **[abstract, regression only]**. Our 3:1 and 9:1 synthetic:real
ratios are far from that, though §10 saw no measurable benefit from ratio 1 on GSM8K dev.

## 5. Proposed plan (cheapest evidence first; every step is a gate for the next)

All runs below are **explore** until a protocol is locked. Use the 200-problem GSM8K-train dev set and 100 held-out
probes like §10–13, 0.6B first. Report **GPU-verified** only for what is actually run. Each phase ends with a decision for you.

**Phase 0 — free checks, no training (≤ 1 day).**
- 0a. If the paper adapters still exist in `runs/`, re-evaluate a few with the adapter scaled by 1.0 / 0.7 / 0.5 / 0.3 (C).
  Success = GSM8K dev loss halves while the probe gain keeps ≥ 60%.
- 0b. Evaluate one adapter on the NF4 base it was trained on versus the bf16 base (tests the quantization-mismatch hypothesis, §3.2).
- 0c. Re-slice existing real-test results by number of calculator annotations (`<<…>>`, i.e. reference steps): do targeted
  models do better on real >4-step problems than matched control? This is the transfer test we never reported.
  The first two checks need no code change beyond an eval script; 0c is a pure re-analysis of stored per-answer rows.

**Phase 1 — recipe (≈ 4–6 dev variants, §10 cost).**
lr 1e-5 and 2e-5, r=8, 1 epoch, bf16 LoRA vs QLoRA (B). Pick the point with the best (probe gain) − (GSM8K loss) on dev.
Stop rule: if no variant gets within −0.08 of base, the recipe is not the lever; go on.

**Phase 2 — fix the text without losing the gain (E + D + H).**
- Items still made by code (problem, gold, DAG, features). Use code's DAG steps as a *hint*, model writes solution,
  verified step by step. Allocate tries by difficulty: keep sampling until k verified solutions per item or a cap
  (DART). This removes the §11 selection bias.
- Keep an item only if the model's measured pass rate is in a band (e.g. 10–70%) (SwS/KITE) so training data is never trivial.
- Add 1:1 self-generated solutions for real GSM8K-train questions (SA-SFT) as the replay part.
- Compare at equal token budget: today's terse, E only, E + D, and two-stage H. Needs your explicit OK for model-written
  text (CLAUDE.md rule; PLAN D2); the generator, gold answers and features stay code-made.

**Phase 3 — RL pilot (F).** Ask first: adding `trl` is a new dependency. Pilot on 0.6B: LoRA GRPO, reward = exact answer
(+ small format reward, because Phase-F literature shows format reward can dominate), prompts drawn from the generator.
Arms keep your design: targeted pool vs matched-control pool vs untargeted pool vs real-only pool, same number of rollouts.
First measure time per step on the 4060; if one pilot would take more than ~1 day, shrink or drop it.
This is the only path that keeps **100% code-made data and no terse target text**.

**Phase 4 — targeting design (answers PLAN question 10).**
Multi-weakness allocation: budget per factor ∝ E_k (range-normalised effect) over significant factors, instead of only
`steps`. Re-verify matching on the combined target. Add a second, harder probe family (more steps/digits than the natural
range) so 1.7B does not saturate, and keep the real-slice report from 0c as a headline secondary result.

**Phase 5 — lock a new protocol and rerun.** Whatever wins Phases 1–4 becomes `configs/main_v2.yaml`:
3 seeds × both models, **full GSM8K test (1,319)** and full GSM-Symbolic main for final evaluation, and report the old
protocol's numbers as the "naive SFT" row. A changed rule is a new protocol, so PLAN.md, `docs/PLAN_CHANGES.md` and the
API/frontend docs (CLAUDE.md rules) are updated only then.

## 6. Paper framing suggestions (for the team, not applied)

- Lead with the controlled finding that is already solid: **format/style drift, not data quality, explains most real-test
  loss** (`real_only` = same drop), and what repairs it (whichever of Phases 0–3 works).
- Re-word the novelty line: SwS-style methods already keep difficulty partly controlled by a pass-rate band; our claim is
  *an exactly matched, causally controlled* comparison, not that nobody controls difficulty.
- State CRAFT/KITE gains as modest and benchmark-dependent (KITE ≈ +1 point average over human-only).
- Fix or remove the O'Grady & Ramlan citation.

## 7. What I did not verify

- CRAFT/KITE/SwS/SA-SFT details above come from their HTML text; I did not read their appendices (KITE HTML was cut at
  100k of 126k characters; the missing part was the theory appendix).
- DART-Math, RL's Razor, LoRA-Learns-Less, Self-Error-Instruct, 2410.16736, Gangwar et al.: abstracts/snippets only.
- WiSE-FT, Step-DPO, LEMA, STaR, RFT (Yuan et al. 2023): cited from memory.
- The Qwen3-0.6B GRPO numbers are from a model card seen in search results, not checked.
- No experiment was run for this review; nothing here is CPU- or GPU-verified evidence about DreamMachine.

## Sources

CRAFT <https://arxiv.org/abs/2607.16122> · KITE <https://arxiv.org/abs/2607.17043> · SwS <https://arxiv.org/abs/2506.08989> ·
SA-SFT <https://arxiv.org/abs/2602.20162> · RL's Razor <https://arxiv.org/abs/2509.04259> ·
LoRA Learns Less <https://arxiv.org/abs/2405.09673> · DART-Math <https://arxiv.org/abs/2407.13690> ·
Self-Error-Instruct <https://aclanthology.org/2025.acl-long.417> · Failure-inducing exploration <https://arxiv.org/abs/2410.16736> ·
Programmatic arithmetic data <https://arxiv.org/abs/2502.12855> · RFT vs RL <https://arxiv.org/abs/2504.11343> ·
Golden-ratio mixing <https://arxiv.org/abs/2509.22341>
