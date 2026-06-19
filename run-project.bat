@echo off
REM Hospital Management System - Auto Startup Script

echo.
echo ========================================
echo   Hospital Management System
echo   Starting Backend and Frontend...
echo ========================================
echo.

REM Start Backend Server in a new window
echo [1/2] Starting Backend Server (Port 5000)...
start "Hospital Backend" cmd /k "cd /d "%~dp0server" && npm run dev"

REM Wait 3 seconds before starting frontend
timeout /t 3 /nobreak >nul

REM Start Frontend Server in a new window
echo [2/2] Starting Frontend Server (Port 5173)...
start "Hospital Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo ========================================
echo   Servers are starting...
echo ========================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo.
echo   Close the server windows to stop them.
echo ========================================
echo.

pause
