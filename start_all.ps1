$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$FrontendDir = Join-Path $ScriptDir "frontend"
$RootDir = $ScriptDir

Write-Host "[Starting Backend] FastAPI on http://127.0.0.1:8000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; `$env:PYTHONPATH='$RootDir'; python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

Write-Host "[Starting Frontend] Vite on http://localhost:5173" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; npm run dev"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "  Services started:"
Write-Host "  Backend: http://127.0.0.1:8000"
Write-Host "  Frontend: http://localhost:5173"
Write-Host "=====================================" -ForegroundColor Yellow
