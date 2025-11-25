@echo off
echo Starting Insider Info Backend Server in background...
cd /d %~dp0
start "Insider Info Backend" /min cmd /c "npm run dev"
echo Server started in background window.
echo Check the "Insider Info Backend" window for server status.
pause

