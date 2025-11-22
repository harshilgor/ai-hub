@echo off
echo Starting AI Hub Backend Server in background...
cd /d %~dp0
start "AI Hub Backend" /min cmd /c "npm run dev"
echo Server started in background window.
echo Check the "AI Hub Backend" window for server status.
pause

