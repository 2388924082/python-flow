@echo off
chcp 65001 >nul

set "ScriptDir=%~dp0"
set "BackendDir=%ScriptDir%backend"
set "FrontendDir=%ScriptDir%frontend"
set "RootDir=%ScriptDir%"

echo [Starting Backend] FastAPI on http://127.0.0.1:8000
start powershell -NoExit -Command "cd '%BackendDir%'; $env:PYTHONPATH='%RootDir%'; python main.py"

timeout /t 2 /nobreak >nul

echo [Starting Frontend] Vite on http://localhost:5173
start powershell -NoExit -Command "cd '%FrontendDir%'; npm run dev"

echo.
echo =====================================
echo   Services started:
echo   Backend: http://127.0.0.1:8000
echo   Frontend: http://localhost:5173
echo =====================================

pause
