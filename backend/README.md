# Insider Info Backend

Real-time research paper aggregator fetching from arXiv and Semantic Scholar.

## Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` and add your Semantic Scholar API key (optional but recommended):
- Get API key from: https://www.semanticscholar.org/product/api

3. **Start the server:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### GET `/api/papers`
Fetch papers with optional filters.

Query parameters:
- `category` - Filter by category (e.g., "Machine Learning", "Computer Vision")
- `venue` - Filter by venue (e.g., "arXiv", "NeurIPS")
- `search` - Search in title and summary
- `limit` - Number of papers to return (default: 50)
- `offset` - Pagination offset (default: 0)

Example:
```
GET /api/papers?category=Computer Vision&limit=20
```

Response:
```json
{
  "papers": [...],
  "total": 145,
  "lastUpdate": "2025-11-21T10:30:00.000Z",
  "hasMore": true
}
```

### GET `/api/papers/stats`
Get paper statistics by industry.

Response:
```json
{
  "industryStats": {
    "Healthcare AI": 15,
    "Computer Vision": 32,
    "NLP": 28,
    ...
  },
  "totalPapers": 100,
  "lastUpdate": "2025-11-21T10:30:00.000Z"
}
```

### GET `/api/papers/:id`
Get a specific paper by arXiv ID.

### POST `/api/papers/refresh`
Manually trigger a refresh of papers from arXiv.

### GET `/api/health`
Health check endpoint.

## Features

- ✅ **Auto-refresh**: Papers update every 6 hours automatically
- ✅ **arXiv Integration**: Fetches latest AI papers from 7 categories
- ✅ **Semantic Scholar Enrichment**: Adds citation counts and additional metadata
- ✅ **Industry Categorization**: Automatically categorizes papers by industry
- ✅ **Persistent Storage**: Saves papers to JSON database
- ✅ **Real-time Stats**: Tracks which industries have most research activity
- ✅ **Rate Limiting**: Built-in delays to respect API limits

## Data Sources

1. **arXiv API** (Primary source)
   - No authentication required
   - Updates every 6 hours
   - Categories: cs.AI, cs.LG, cs.CV, cs.CL, cs.NE, cs.RO, stat.ML

2. **Semantic Scholar** (Enrichment)
   - Optional API key
   - Adds citation counts
   - Provides influential citation metrics

## Automatic Updates

The server automatically fetches new papers every 6 hours using cron jobs. You can customize the interval in `server.js`.

## Manual Refresh

To manually trigger a refresh:
```bash
curl -X POST http://localhost:3001/api/papers/refresh
```

## Database

Papers are stored in `backend/data/papers.json`. This file is created automatically on first run.

## Port Configuration

Default port: 3001

Change in `.env`:
```
PORT=3001
```

