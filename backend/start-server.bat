@echo off
echo ========================================
echo   AI Hub Backend Server Startup
echo ========================================
echo.
echo Starting server with auto-reload...
echo Press Ctrl+C to stop the server
echo.
cd /d %~dp0
npm run dev

