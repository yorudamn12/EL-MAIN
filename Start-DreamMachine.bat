@echo off
REM One click: start the DreamMachine API (127.0.0.1:8000, no GPU worker) and the dashboard
REM (localhost:5173), then open the dashboard in the browser. Close the two windows to stop.
setlocal
cd /d "%~dp0"

powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/v1/health -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo Starting the API...
  start "DreamMachine API" cmd /k ""%~dp0.venv\Scripts\python.exe" -m dreammachine.serve --no-worker"
) else (
  echo API already running.
)

powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:5173 -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo Starting the dashboard...
  start "DreamMachine UI" cmd /k "cd /d "%~dp0frontend" && npm run dev"
) else (
  echo Dashboard already running.
)

echo Waiting for both to answer...
powershell -NoProfile -Command "foreach ($u in 'http://127.0.0.1:8000/api/v1/health','http://localhost:5173') { for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -UseBasicParsing $u -TimeoutSec 2 | Out-Null; break } catch { Start-Sleep 1 } } }"
start "" http://localhost:5173
endlocal
