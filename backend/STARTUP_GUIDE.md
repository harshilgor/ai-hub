# 🚀 AI Hub Backend - Startup Guide

## ✅ What's Been Set Up

The server now has **automatic port conflict handling** - it will automatically kill any process using port 3001 before starting, so you'll never see the `EADDRINUSE` error again!

## 🎯 How to Start the Server

### Option 1: Using npm (Recommended for Development)
```bash
cd backend
npm run dev
```
- ✅ Auto-reloads when you change code
- ✅ Shows all logs in the terminal
- ✅ Press `Ctrl+C` to stop

### Option 2: Using Startup Scripts

**For foreground (see logs):**
```bash
# Double-click or run:
backend/start-server.bat
```

**For background (minimized window):**
```bash
# Double-click or run:
backend/start-server-background.bat
```

## 🔄 Automatic Features

Once the server is running, it will:

1. **Auto-fetch papers every 10 minutes** - No manual intervention needed!
2. **Auto-reload on code changes** - When using `npm run dev` or nodemon
3. **Auto-handle port conflicts** - Kills old processes automatically
4. **Build comprehensive database** - Fetches papers from all domains (AI, Math, Physics, Economics, Biology, etc.)

## 📊 What Happens Automatically

- ✅ Fetches papers from arXiv (all domains)
- ✅ Fetches papers from Semantic Scholar
- ✅ Enriches papers with citation data
- ✅ Categorizes papers by domain
- ✅ Saves to database (`backend/data/papers.json`)
- ✅ Updates every 10 minutes

## 🛠️ Troubleshooting

### Port Still in Use?
The server now automatically handles this, but if you need to manually kill a process:
```powershell
# Find the process
netstat -ano | findstr :3001

# Kill it (replace <PID> with the number from above)
taskkill /F /PID <PID>
```

### Server Not Starting?
1. Make sure you're in the `backend` directory
2. Check that Node.js is installed: `node --version`
3. Install dependencies: `npm install`
4. Check `.env` file exists with your API key

## 💡 Tips

- **Development**: Use `npm run dev` for auto-reload
- **Production**: Use `npm start` for stable running
- **Background**: Use the `.bat` scripts to run in background
- The server will keep running and fetching papers automatically!

---

**No more manual `npm start` needed!** The server handles everything automatically. 🎉

