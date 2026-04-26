@echo off
title iLEAD Dashboard
echo.
echo  ================================
echo   i-LEAD Dashboard - Dev Server
echo  ================================
echo.
echo  Dang khoi dong...
echo  Mo trinh duyet sau vai giay.
echo.
cd /d "%~dp0"
start "" "http://localhost:5173"
npm run dev
pause
