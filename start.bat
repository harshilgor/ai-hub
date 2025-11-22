@echo off
echo 🚀 Starting AI Hub with Real-Time Research Papers
echo.

REM Check if backend dependencies are installed
if not exist "backend\node_modules\" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Start backend in new window
echo 🔧 Starting backend server...
start "AI Hub Backend" cmd /k "cd backend && npm start"

REM Wait for backend to start
echo ⏳ Waiting for backend to initialize (10 seconds)...
timeout /t 10 /nobreak > nul

REM Start frontend
echo 🎨 Starting frontend...
npm run dev

