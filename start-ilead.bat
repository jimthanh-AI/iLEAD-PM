@echo off
title iLEAD Dashboard
echo.
echo  ============================
echo   i-LEAD Dashboard - Dev Server
echo  ============================
echo.
cd /d "%~dp0"
echo  Starting server at http://localhost:5173
echo  Press Ctrl+C to stop.
echo.
start "" "http://localhost:5173"
npm run dev
pause
