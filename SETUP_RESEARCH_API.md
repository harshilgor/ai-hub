# 🚀 Real-Time Research Papers Setup Guide

Insider Info now fetches real research papers from arXiv and Semantic Scholar in real-time!

## 📋 Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start the Backend Server

```bash
npm start
```

The server will:
- Start on `http://localhost:3001`
- Fetch latest papers from arXiv (takes ~2 minutes first time)
- Auto-refresh every 6 hours
- Store papers in `backend/data/papers.json`

### 3. Start the Frontend

In a **new terminal**:

```bash
cd ..  # back to project root
npm run dev
```

### 4. View Live Papers

Open `http://localhost:5173` and navigate to **Research** tab!

## 🎯 What You Get

### ✅ Real-Time Features

1. **Live Paper Feed**
   - Latest AI papers from arXiv (100+ papers)
   - Updates automatically every 6 hours
   - Categories: AI, ML, Computer Vision, NLP, Robotics, Neural Networks

2. **Rich Metadata**
   - Citation counts from Semantic Scholar
   - Author information
   - PDF links
   - arXiv categories

3. **Industry Insights**
   - Automatic categorization by industry
   - Real-time stats showing which industries have most research
   - Trends in Healthcare AI, Robotics, NLP, etc.

4. **Search & Filter**
   - Search by title/author
   - Filter by category
   - Filter by venue
   - Real-time filtering

5. **Manual Refresh**
   - Click "Refresh" button to fetch latest papers immediately
   - Auto-updates every 6 hours in background

## 🔧 Configuration

### Optional: Semantic Scholar API Key

For better citation data and metadata:

1. Get API key: https://www.semanticscholar.org/product/api
2. Create `backend/.env`:

```bash
PORT=3001
SEMANTIC_SCHOLAR_API_KEY=your_key_here
REFRESH_INTERVAL_HOURS=6
```

**Note:** API key is optional. The system works without it, but with limited citation data.

## 📊 API Endpoints

Your backend exposes these endpoints:

- `GET /api/papers` - Get all papers (with filters)
- `GET /api/papers/stats` - Get industry statistics
- `GET /api/papers/:id` - Get specific paper
- `POST /api/papers/refresh` - Manually trigger refresh
- `GET /api/health` - Health check

## 🔄 How It Works

```
┌─────────────┐
│   arXiv API │  ← Fetches 100 latest AI papers
└──────┬──────┘
       │
       ├─ Categories: cs.AI, cs.LG, cs.CV, cs.CL, cs.NE, cs.RO, stat.ML
       │
       ▼
┌──────────────────┐
│  Your Backend    │  ← Processes and categorizes
│  (Node.js/Express)│
└────────┬─────────┘
         │
         ├─ Enriches with Semantic Scholar (citations)
         ├─ Categorizes by industry
         ├─ Stores in JSON database
         │
         ▼
┌──────────────────┐
│  Frontend        │  ← Displays in real-time
│  (React)         │
└──────────────────┘
         │
         └─ Auto-refresh every 6 hours via cron
```

## 🎨 Features in Action

### Research Activity by Industry
Shows which AI fields are most active based on paper count:
- Healthcare AI
- Computer Vision  
- NLP
- Machine Learning
- Robotics
- And more...

### Latest Papers Feed
- Real titles and authors
- Actual research summaries
- Live citation counts
- Working PDF links

## 🐛 Troubleshooting

### Backend not starting?
```bash
cd backend
npm install  # Make sure dependencies are installed
npm start
```

### Papers not loading?
1. Check backend is running: `http://localhost:3001/api/health`
2. Check browser console for errors
3. Try manual refresh button

### Want more papers?
Edit `backend/server.js`:
```javascript
await fetchArXivPapers(200, 14);  // 200 papers, 14 days back
```

## 📈 Customization

### Change Update Frequency

In `backend/server.js`, find:
```javascript
cron.schedule('0 */6 * * *', ...);  // Every 6 hours
```

Change to:
- `'0 * * * *'` - Every hour
- `'0 */12 * * *'` - Every 12 hours  
- `'0 0 * * *'` - Daily at midnight

### Add More Categories

In `backend/services/arxivService.js`, add to `AI_CATEGORIES`:
```javascript
const AI_CATEGORIES = [
  'cs.AI',
  'cs.LG',
  'cs.SE',  // Software Engineering
  'cs.DB',  // Databases
  // ... add more
];
```

## 🚀 Production Deployment

### Backend
- Deploy to Heroku, Railway, or any Node.js host
- Set environment variable: `SEMANTIC_SCHOLAR_API_KEY`
- Enable scheduled tasks for auto-refresh

### Frontend
- Update `VITE_API_URL` in `.env`:
```
VITE_API_URL=https://your-backend-url.com/api
```

## 📚 Data Sources

1. **arXiv API**
   - Free, no authentication
   - 100,000+ AI papers
   - Updated daily

2. **Semantic Scholar**
   - Citation data
   - Free API with key
   - 200M+ papers indexed

## 🎉 You're Done!

Your research feed is now live with real papers from arXiv!

Navigate to the **Research** tab and see the latest AI research papers updating automatically. 🔬

