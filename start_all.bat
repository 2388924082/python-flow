@echo off
chcp 65001 >nul

set "ScriptDir=%~dp0"
set "BackendDir=%ScriptDir%backend"
set "FrontendDir=%ScriptDir%frontend-vue"
set "RootDir=%ScriptDir%"

set API_PORT=8766

echo [Starting Backend] FastAPI on http://127.0.0.1:%API_PORT%
start powershell -NoExit -Command "cd '%BackendDir%'; $env:PYTHONPATH='%RootDir%'; $env:API_PORT='%API_PORT%'; python -m uvicorn main:app --reload --port %API_PORT%"

timeout /t 2 /nobreak >nul

echo [Starting Frontend] Vite on http://localhost:5173
start powershell -NoExit -Command "cd '%FrontendDir%'; npm run dev"

echo.
echo =====================================
echo   API Port: %API_PORT%
echo   Frontend: http://localhost:5173
echo =====================================
pause