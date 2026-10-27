# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## DreamMachine: running against the backend

The UI talks to the FastAPI backend (`docs/API_CONTRACT.md`, contract 0.2.1) through `src/api.ts`.

```powershell
# terminal 1 (repo root): API on 127.0.0.1:8000 (+ the GPU worker)
.\.venv\Scripts\Activate.ps1
python -m dreammachine.serve

# terminal 2
cd frontend
npm install
npm run dev          # http://localhost:5173 (allowed by the API's CORS)
```

- `VITE_API_BASE_URL` (default `http://127.0.0.1:8000/api/v1`) and `VITE_USE_MOCK` are read from `.env.local` (see `.env.example`).
- `VITE_USE_MOCK=true` answers every request from `src/mocks/mock.ts` and shows a "MOCK DATA" badge. The Netlify build uses it,
  because a hosted page cannot reach `127.0.0.1`.
- Screens: Overview (backend/GPU/worker status, recent runs), Experiments (start an explore pipeline, live step progress,
  cancel/resume, run log), Diagnosis (weakness ranking and baseline of the selected run; "build an experiment" pre-fills the target),
  Results (baseline vs targeted vs matched control with 95% CIs, primary question, regressions).
- Not built yet: paper-mode launch, training loss curves, training-data samples, answer explorer, log viewer, benchmark-only runs.
