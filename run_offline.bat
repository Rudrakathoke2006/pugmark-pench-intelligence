@echo off
TITLE Pugmark Tiger Intelligence System - Offline Launcher
echo =================================================================
echo PUGMARK TIGER INTELLIGENCE SYSTEM — PENCH TIGER RESERVE
echo Starting Offline Backend API & Frontend Dashboard...
echo =================================================================

cd /d "C:\Users\ACER\Desktop\viksitbharat"

echo Starting Backend FastAPI Server on http://127.0.0.1:8000 ...
start "Pugmark Backend Server" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

timeout /t 3 >nul

echo Starting Frontend Web Dashboard on http://localhost:3000 ...
cd /d "C:\Users\ACER\Desktop\viksitbharat\frontend"
start "Pugmark Frontend Dashboard" cmd /k "npm run dev"

timeout /t 2 >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo =================================================================
echo Pugmark System is ONLINE!
echo Access UI Dashboard: http://localhost:3000
echo Access API Documentation: http://127.0.0.1:8000/docs
echo =================================================================
pause
