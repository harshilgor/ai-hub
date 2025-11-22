# 🔬 Semantic Scholar API Integration - Complete Explanation

## 📋 Table of Contents
1. [API Key Setup](#api-key-setup)
2. [How Papers Are Fetched](#how-papers-are-fetched)
3. [Timing & Frequency](#timing--frequency)
4. [Complete Architecture Flow](#complete-architecture-flow)
5. [API Request Details](#api-request-details)

---

## 🔑 API Key Setup

### Do I Have the API Key?
**No, you need to provide it!** The system is designed to work **WITH or WITHOUT** an API key:

- **Without API Key**: Limited to 100 requests per 5 minutes (free tier)
- **With API Key**: Higher rate limits, more reliable access

### How to Get Your API Key:

1. **Visit**: https://www.semanticscholar.org/product/api
2. **Sign up** for free API access
3. **Get your API key** from the dashboard
4. **Create** `backend/.env` file:
   ```env
   PORT=3001
   SEMANTIC_SCHOLAR_API_KEY=your_actual_key_here
   REFRESH_INTERVAL_HOURS=6
   ```

### Current Status:
The code reads the API key from environment variables:
```javascript
headers: {
  'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || ''
}
```

If no key is provided, it uses an empty string (still works, but with rate limits).

---

## 📥 How Papers Are Fetched

### Two-Strategy Approach:

#### **Strategy 1: Semantic Scholar (Primary)**
```javascript
fetchLatestPapersFromSemanticScholar(100, currentYear)
```

**What it does:**
1. Searches 8 AI-related topics:
   - "artificial intelligence"
   - "machine learning"
   - "deep learning"
   - "neural networks"
   - "computer vision"
   - "natural language processing"
   - "large language models"
   - "reinforcement learning"

2. For each topic:
   - Makes API call to: `https://api.semanticscholar.org/graph/v1/paper/search`
   - Filters by year: `year: "2024,2025"` (current year + next)
   - Requests ~12-13 papers per topic (100 total / 8 topics)
   - Waits 200ms between requests (rate limiting)

3. Combines all results:
   - Removes duplicates by `paperId`
   - Sorts by publication date (newest first)
   - Returns top 100 papers

#### **Strategy 2: arXiv (Fallback)**
If Semantic Scholar returns < 50 papers:
1. Fetches 50 papers from arXiv (last 7 days)
2. Enriches first 30 with Semantic Scholar citation data
3. Adds remaining 20 without enrichment

---

## ⏰ Timing & Frequency

### Automatic Updates:

#### **Initial Fetch:**
- When server starts, if cache is empty OR older than 6 hours
- Runs immediately on startup

#### **Scheduled Updates:**
```javascript
cron.schedule('0 */6 * * *', () => {
  updatePapers();
});
```
- **Frequency**: Every 6 hours
- **Cron Pattern**: `0 */6 * * *` = At minute 0, every 6 hours
- **Times**: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM

#### **Manual Refresh:**
- User clicks "Refresh" button → `POST /api/papers/refresh`
- Triggers immediate update (runs in background)

### Rate Limiting Between Requests:

| Operation | Delay |
|-----------|-------|
| Between Semantic Scholar searches | 200ms |
| Between arXiv enrichment calls | 100ms |
| Between batch API calls | 300ms |

**Why?** To respect API rate limits:
- Without API key: 100 requests/5 minutes
- With API key: Higher limits (varies by tier)

---

## 🏗️ Complete Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER STARTUP                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Load papers from JSON database   │
        │  (backend/data/papers.json)        │
        └────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Check: Cache empty or >6 hours?   │
        └────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                   YES              NO
                    │               │
                    ▼               ▼
        ┌──────────────────┐   ┌──────────────┐
        │  Fetch Papers    │   │ Use Cache    │
        └──────────────────┘   └──────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              updatePapers() FUNCTION                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  STRATEGY 1: Semantic Scholar      │
        │  fetchLatestPapersFromSemantic... │
        └────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
            ┌───────▼───────┐   ┌───▼──────────────┐
            │  For each of 8    │  Wait 200ms      │
            │  AI topics:       │  (rate limit)    │
            │                   └──────────────────┘
            │  • Search API      │
            │  • Filter by year │
            │  • Get ~12 papers │
            └───────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Transform papers to our format   │
        │  transformSemanticScholarPaper()   │
        └────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Check: Got < 50 papers?          │
        └────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                   YES              NO
                    │               │
                    ▼               │
        ┌──────────────────┐        │
        │  STRATEGY 2:     │        │
        │  Fetch from arXiv│        │
        └──────────────────┘        │
                    │               │
                    ▼               │
        ┌──────────────────┐        │
        │  Enrich first 30 │        │
        │  with citations  │        │
        └──────────────────┘        │
                    │               │
                    └───────┬───────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Remove duplicates                │
        │  removeDuplicatePapers()          │
        └────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Categorize by industry            │
        │  categorizePapersByIndustry()     │
        └────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Save to:                          │
        │  • In-memory cache (papersCache)    │
        │  • JSON file (papers.json)         │
        └────────────────────────────────────┘
                            │
                            ▼
        ┌────────────────────────────────────┐
        │  Serve to frontend via API         │
        │  GET /api/papers                   │
        └────────────────────────────────────┘
```

---

## 🔌 API Request Details

### 1. Semantic Scholar Search API

**Endpoint:**
```
GET https://api.semanticscholar.org/graph/v1/paper/search
```

**Request Example:**
```javascript
axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
  params: {
    query: 'machine learning',
    year: '2024,2025',
    limit: 13,
    fields: 'paperId,title,authors,year,abstract,citationCount,influentialCitationCount,venue,externalIds,openAccessPdf,publicationDate,fieldsOfStudy'
  },
  headers: {
    'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || ''
  }
})
```

**Response:**
```json
{
  "data": [
    {
      "paperId": "649def34f8be52c8b66281af98ae884c09aef38b",
      "title": "Paper Title",
      "authors": [{"name": "Author Name"}],
      "year": 2024,
      "abstract": "Paper abstract...",
      "citationCount": 42,
      "venue": "Conference Name",
      "externalIds": {"ArXiv": "2311.12345"},
      "openAccessPdf": {"url": "https://..."},
      "fieldsOfStudy": ["Computer Science", "Machine Learning"]
    }
  ]
}
```

### 2. Batch API (for fetching multiple papers)

**Endpoint:**
```
POST https://api.semanticscholar.org/graph/v1/paper/batch
```

**Request Example:**
```javascript
axios.post(
  'https://api.semanticscholar.org/graph/v1/paper/batch',
  { ids: ["paperId1", "paperId2", "ARXIV:2106.15928"] },
  {
    params: {
      fields: 'title,authors,year,abstract,citationCount...'
    },
    headers: {
      'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || '',
      'Content-Type': 'application/json'
    }
  }
)
```

### 3. Autocomplete API

**Endpoint:**
```
GET https://api.semanticscholar.org/graph/v1/paper/autocomplete?query=machine
```

**Request Example:**
```javascript
axios.get('https://api.semanticscholar.org/graph/v1/paper/autocomplete', {
  params: { query: 'machine' },
  headers: { 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || '' }
})
```

---

## 📊 Data Flow Timeline

### Example: Server starts at 2:00 PM

```
2:00:00 PM  → Server starts
2:00:01 PM  → Load papers from JSON (if exists)
2:00:02 PM  → Check: Cache empty? YES
2:00:03 PM  → Start updatePapers()
2:00:04 PM  → Fetch from Semantic Scholar
             ├─ Search "artificial intelligence" (200ms wait)
             ├─ Search "machine learning" (200ms wait)
             ├─ Search "deep learning" (200ms wait)
             └─ ... (8 searches total)
2:00:10 PM  → Transform papers
2:00:11 PM  → Remove duplicates
2:00:12 PM  → Categorize by industry
2:00:13 PM  → Save to cache + JSON file
2:00:14 PM  → Ready to serve papers!

6:00:00 PM  → Scheduled update (cron job)
8:00:00 PM  → Next scheduled update
... (every 6 hours)
```

---

## 🎯 Key Points Summary

1. **API Key**: You need to provide it (optional but recommended)
2. **Primary Source**: Semantic Scholar (8 topic searches)
3. **Fallback**: arXiv if Semantic Scholar returns < 50 papers
4. **Update Frequency**: Every 6 hours automatically
5. **Rate Limiting**: 200ms between Semantic Scholar requests
6. **Storage**: In-memory cache + JSON file (persists across restarts)
7. **Deduplication**: Removes duplicates by paperId
8. **Transformation**: Converts Semantic Scholar format to our internal format

---

## 🧪 Testing the Integration

### Check if API key is loaded:
```bash
cd backend
node -e "require('dotenv').config(); console.log('API Key:', process.env.SEMANTIC_SCHOLAR_API_KEY ? 'SET' : 'NOT SET')"
```

### Test Semantic Scholar API directly:
```bash
curl "https://api.semanticscholar.org/graph/v1/paper/search?query=machine%20learning&limit=5"
```

### Check backend logs:
When you start the backend, you'll see:
```
🔍 Fetching from Semantic Scholar...
✅ Found 100 papers from Semantic Scholar
📝 Removed 15 duplicates
✅ Updated 85 papers
```

---

## 📝 Next Steps

1. **Get your API key** from Semantic Scholar
2. **Create** `backend/.env` file with your key
3. **Restart** the backend server
4. **Check logs** to see papers being fetched
5. **Test** the frontend to see papers displayed

The system will work without an API key, but you'll have rate limits!

