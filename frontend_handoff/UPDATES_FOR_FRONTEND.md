# UPDATES_FOR_FRONTEND — backend changes the frontend must follow

Give this file (plus a fresh copy of the other files in this folder) to the frontend AI whenever the backend
has changed since the frontend was last built. **Newest entry first.** Every backend change that the frontend
can see (routes, request or response fields, enums, defaults, behaviour, new results or run kinds, new
models/benchmarks/prompts, changes to what a screen should show) gets an entry here **in the same commit** as
the backend change. Changes the frontend cannot see (internal refactors, tests) are not listed.

How to use it: find the contract version your frontend was built against, then apply every entry above it,
from the oldest unapplied one to the newest. The full truth is always `API_CONTRACT.md` and `openapi.json`
in this folder; this file says *what changed and what to do about it*.

## Entry template (copy for each change)

```
### <date> — <short title> — contract <old> → <new>   [BREAKING | non-breaking]
**Why:** one or two plain-words sentences on what changed in the backend and why.
**What changed (backend):**
- Endpoints: added / removed / renamed / changed (method + path)
- Request fields: added / removed / changed (name, type, default, allowed values)
- Response fields: added / removed / changed (name, type, nullable?, example value)
- Enums: new or removed strings (exact spelling)
- Behaviour: status codes, warnings, validation, ordering, defaults, limits
- Data: new run kinds, models, benchmarks, prompt versions, arms, metrics
**What the frontend must do:**
- Screen by screen: what to add, change or remove (labels, columns, badges, filters)
- Types to update (name them as in contract §7); mock fixtures to update
**How to check it:** which endpoint/field to look at, or the example response to compare with.
**Files to refresh:** API_CONTRACT.md, openapi.json, (others if changed)
```

---

### 2026-11-10 — Second multi-weakness results (Qwen3-1.7B) — contract 0.3.0 (unchanged)   [non-breaking]
**Why:** the 1.7B multi-weakness paper run `4e6b61903c00` finished (paper-eligible); a second 6-arm results page.
**What changed (backend):**
- Data only: `GET /pipelines?mode=paper` lists `4e6b61903c00` (`resolved.protocol: "multi_weakness"`,
  `resolved.reference_job: "409305f3e2f2"`). 4 targets (`steps`, `n_div`, `n_mul`, `n_distractors`), so
  `weakness_slices` has 4 features here (5 for 0.6B) — do not hard-code the feature list.
- Its step 16 shows one failed attempt in the log (CUDA out-of-memory) before succeeding; final status `done`.
- `primary`: GSM8K +0.007 [−0.020, +0.033], not significant.
**What the frontend must do:** results screen: check it renders 4 target weights and 4 weakness-slice columns for this
run; nothing else.
**How to check it:** `GET /api/v1/pipelines/4e6b61903c00/results`; numbers in `docs/RUNNING.md` §18.
**Files to refresh:** none (contract unchanged).

### 2026-11-10 — First multi-weakness results (Qwen3-0.6B) — contract 0.3.0 (unchanged)   [non-breaking]
**Why:** the 0.6B multi-weakness paper run `76f2c9af5ea9` finished; it is the first results page with 6 arms.
**What changed (backend):**
- Data only: `GET /pipelines?mode=paper` now lists `76f2c9af5ea9` (status `done`, `paper_eligible: true`,
  `resolved.protocol: "multi_weakness"`, `resolved.reference_job: "80b37628b193"`). No route, field or enum changed.
- Its `/results` has 6 arms: 4 with `source_job: "80b37628b193"`, 2 (`multi_*`) with `source_job: "76f2c9af5ea9"`;
  `target.strategy: "multi"` with 5 `targets`; `weakness_slices` filled for every arm; `primary.a/b` =
  `multi_targeted` / `multi_matched_control` (GSM8K −0.023 [−0.051, +0.006], not significant).
- The report has a per-weakness table and a warning naming the reference run's commit.
**What the frontend must do:**
- Results screen: check it renders 6 arms, shows "trained in run 80b37628b193" for the 4 reused arms, the 5-target
  header (feature + weight), and a per-weakness slice table from `weakness_slices`.
- Nothing else; the 1.7B run (`4e6b61903c00`) will add a second such page (~2026-11-11).
**How to check it:** `GET /api/v1/pipelines/76f2c9af5ea9/results` against the screen; numbers in `docs/RUNNING.md` §16.
**Files to refresh:** none (contract unchanged).

### 2026-11-09 — Multi-weakness paper protocol — contract 0.2.2 → 0.3.0   [non-breaking for requests; results may show 6 arms]
**Why:** the single-weakness paper runs found no targeting benefit, so the user decided (2026-11-09) to train each model on
**all** its significant weaknesses at once (0.6B: 5, 1.7B: 4), from the base model, against an equally hard control.
Only the 2 new arms are trained; the 4 old arms are taken from the finished single-weakness paper run of the same model
(not retrained), so one results page shows 6 arms. Details: `PLAN.md` §16 / D17.
**What changed (backend):**
- Request fields: `POST /pipelines` paper body accepts `protocol: "single_weakness" | "multi_weakness"` (optional,
  default `"single_weakness"` = the old protocol, unchanged). Unknown protocol → 422 `validation_error`. Other extra
  fields still → 422 `paper_mode_locked`.
- Enums: `Arm` gains `"multi_targeted"` and `"multi_matched_control"`; `TargetStrategy` gains `"multi"`; new
  `Protocol = "single_weakness" | "multi_weakness"`. Explore requests still accept only the 4 old arms.
- Response fields (all additive):
  - `Pipeline.resolved.protocol` (paper runs; `null` otherwise) and `Pipeline.resolved.reference_job` (multi runs: the
    paper run whose 4 arms are reused).
  - `PipelineResults.reference_job`; `PipelineResults.target.targets` = `[{feature, threshold, weight}]` when
    `target.strategy == "multi"` (then `target.feature` and `target.threshold` are `null`).
  - `ArmResult.source_job` = the job that trained that arm (in a multi run: the reference run for the 4 old arms, this
    run for `multi_*`).
  - `ArmResult.weakness_slices` = `{feature: {probe benchmark: {above, at_or_below}}}`, one per targeted weakness, for
    every arm (`{}` in single-weakness runs).
  - `primary.a/b` is `multi_targeted` / `multi_matched_control` in multi runs (question text differs too).
  - `/presets.paper.settable` = `["name", "model", "protocol"]`; `/meta.arms` lists the 2 new arms with labels.
- Behaviour: a multi run has 18 steps (5 setup, baseline + diagnose `skipped` = reused, 6 train, 6 evaluate,
  compare). Arm keys look like `multi_targeted_r3_s0`; `/data/{arm_key}/samples` and `/download` accept them.
- Data: new paper runs (one per model) will appear after the GPU runs finish; `GET /pipelines?mode=paper` will list them.
**What the frontend must do:**
- `src/api.ts`: widen `type Arm` with the 2 new values; add `Protocol`; add the optional fields above to `ResolvedConfig`,
  `PipelineResults`, `ArmResult`, `Target`.
- `App.tsx` arm maps (`ARM_LABEL`-style map at line ~21, `ARM_ICON` ~23, the pill-class map ~25): add entries for
  `multi_targeted` ("Multi-weakness targeted") and `multi_matched_control` ("Multi-weakness control"), otherwise
  those arms render without a label/icon. Labels are also served by `/meta.arms`.
- Results screen: it picks `armOf("targeted")` / `armOf("matched_control")` (~line 700) for the headline. For a run with
  `reference_job`, show the headline as `multi_targeted` vs `multi_matched_control` (use `primary.a` / `primary.b`), and
  show a note "Arms real_only / untargeted / matched_control / targeted were trained in run <reference_job>" (use
  `ArmResult.source_job` to badge those rows).
- Results screen: add a "Per-weakness" table from `weakness_slices` (rows = arms, columns = targeted weaknesses,
  cell = held-out probes `above.before → above.after`), and show the weights from `target.targets`.
- Overview/Experiments lists: show `resolved.protocol` ("Single weakness" / "Multi-weakness") on paper runs.
- New experiment form (paper): optional protocol switch; multi needs an earlier finished single-weakness paper run of
  the same model (else the API answers 422 `reuse_mismatch` with a clear message — show it).
- `runNotes.ts` has hand-written notes per arm for the two old paper runs only; nothing to change until the new runs
  are written up.
- Mock fixtures: add one multi-weakness `PipelineResults` (6 arms, `reference_job`, `weakness_slices`).
**How to check it:** `GET /api/v1/health` → `api_version: "0.3.0"`; `GET /api/v1/meta` lists 7 arms (base + 6);
`POST /api/v1/pipelines` with `{"mode": "paper", "model": "Qwen/Qwen3-0.6B", "protocol": "bogus"}` → 422.
**Files to refresh:** API_CONTRACT.md, openapi.json (run `sync.ps1`).

### 2026-10-29 — `GET /models` reports whether each model is cached — contract 0.2.1 → 0.2.2   [non-breaking]
**Why:** the New experiment form listed models that may not be on the laptop. Queuing an uncached model downloads it (or
fails for gated models), so the UI should say which is which.
**What changed (backend):**
- Response fields: every item of `GET /models` gains `cached: boolean` — a snapshot of the model is in the local Hugging
  Face cache (offline check, no network). `/health.api_version` is now `0.2.2`.
**What the frontend must do:**
- Experiments → model picker: group options into "In your local cache" and "Needs download"; default to the first cached
  model; under the picker show a status line (cached: runs offline; not cached: will download on first use; gated and
  not cached: needs licence + `huggingface-cli login`, otherwise the job fails). Do not disable uncached models.
- Types: `Model` gains `cached: boolean` (contract §7). Mock fixtures: add `cached` to every model.
**How to check it:** `GET /api/v1/models` — on the dev laptop only the two Qwen3 models have `cached: true`.
**Files to refresh:** API_CONTRACT.md, openapi.json

---

## Baseline — contract 0.2.1 (2026-10-21)

The frontend has not been built yet. Build against `API_CONTRACT.md` 0.2.1 and `openapi.json` in this folder.
Nothing to apply; entries start below this line once the backend changes after a frontend build.

**State of the backend at this baseline:** 39 endpoints under `/api/v1`; both paper runs finished
(Qwen3-0.6B and Qwen3-1.7B, prompt `qwen_boxed`); 0.2.1 added per-answer `lastline` / `format_ok` / `truncated`
and prompt versions in `/presets`.

<!-- New entries go directly above this comment's section, i.e. between the template and the Baseline. -->
