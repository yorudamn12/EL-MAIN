---
description: Start the DreamMachine API and dashboard and open it in the browser
---

Run `Start-DreamMachine.bat` at the repo root (it starts the API with `--no-worker` and the Vite dashboard,
skipping whichever is already running, then opens http://localhost:5173). Use PowerShell:
`Start-Process -FilePath "Start-DreamMachine.bat" -WorkingDirectory (Get-Location)`.
Then check `http://127.0.0.1:8000/api/v1/health` and `http://localhost:5173` both answer, and tell the user the
dashboard is open (or what failed). Do not start the GPU worker unless the user asks.
