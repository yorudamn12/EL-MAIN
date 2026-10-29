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
