# 🔄 Detailed API Request Flow

## Exact API Calls Made During Paper Fetching

### When `updatePapers()` is called:

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Semantic Scholar Primary Fetch                    │
│  Function: fetchLatestPapersFromSemanticScholar(100, 2024)│
└─────────────────────────────────────────────────────────────┘

For each of 8 AI topics (sequential, with delays):

Topic 1: "artificial intelligence"
├─ API Call #1
│  GET https://api.semanticscholar.org/graph/v1/paper/search
│  Query: "artificial intelligence"
│  Year: "2024,2025"
│  Limit: 13 papers
│  Fields: paperId,title,authors,year,abstract,citationCount...
│  Headers: x-api-key: [YOUR_KEY or empty]
│  ⏱️ Wait: 200ms
│
Topic 2: "machine learning"
├─ API Call #2
│  GET https://api.semanticscholar.org/graph/v1/paper/search
│  Query: "machine learning"
│  ⏱️ Wait: 200ms
│
Topic 3: "deep learning"
├─ API Call #3
│  ⏱️ Wait: 200ms
│
Topic 4: "neural networks"
├─ API Call #4
│  ⏱️ Wait: 200ms
│
Topic 5: "computer vision"
├─ API Call #5
│  ⏱️ Wait: 200ms
│
Topic 6: "natural language processing"
├─ API Call #6
│  ⏱️ Wait: 200ms
│
Topic 7: "large language models"
├─ API Call #7
│  ⏱️ Wait: 200ms
│
Topic 8: "reinforcement learning"
└─ API Call #8
   ⏱️ Total time: ~1.6 seconds (8 calls × 200ms)

Result: ~100 papers collected
```

### If < 50 papers found, fallback to arXiv:

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: arXiv Fallback                                      │
│  Function: fetchArXivPapers(50, 7)                          │
└─────────────────────────────────────────────────────────────┘

├─ API Call #9
│  GET http://export.arxiv.org/api/query
│  Search: AI categories (cs.AI, cs.LG, cs.CV, etc.)
│  Max Results: 50
│  Days Back: 7
│
│  Result: 50 arXiv papers
│
└─ Enrich first 30 with Semantic Scholar citations:
   │
   For each of 30 papers (sequential):
   ├─ API Call #10
   │  GET https://api.semanticscholar.org/graph/v1/paper/arXiv:2311.12345
   │  ⏱️ Wait: 100ms
   │
   ├─ API Call #11
   │  GET https://api.semanticscholar.org/graph/v1/paper/arXiv:2311.12346
   │  ⏱️ Wait: 100ms
   │
   └─ ... (30 calls total)
      ⏱️ Total time: ~3 seconds (30 calls × 100ms)
```

---

## 📊 Total API Calls Summary

### Best Case (Semantic Scholar returns 100+ papers):
- **8 calls** to Semantic Scholar search API
- **Total time**: ~1.6 seconds
- **Rate limit impact**: 8 requests used

### Worst Case (Semantic Scholar returns < 50 papers):
- **8 calls** to Semantic Scholar search API
- **1 call** to arXiv API
- **30 calls** to Semantic Scholar paper detail API (for enrichment)
- **Total time**: ~4.6 seconds
- **Rate limit impact**: 38 requests used

---

## ⏱️ Timing Breakdown

### Single Update Cycle:

```
0.0s  → Start updatePapers()
0.1s  → Call #1: "artificial intelligence"
0.3s  → Call #2: "machine learning"
0.5s  → Call #3: "deep learning"
0.7s  → Call #4: "neural networks"
0.9s  → Call #5: "computer vision"
1.1s  → Call #6: "natural language processing"
1.3s  → Call #7: "large language models"
1.5s  → Call #8: "reinforcement learning"
1.6s  → All Semantic Scholar searches complete
1.7s  → Transform papers to internal format
1.8s  → Remove duplicates
1.9s  → Categorize by industry
2.0s  → Save to cache and JSON
2.1s  → Done!
```

**If fallback needed:**
```
2.0s  → Check: < 50 papers? YES
2.1s  → Call arXiv API
2.5s  → Get 50 arXiv papers
2.6s  → Start enriching with Semantic Scholar
2.7s  → Enrich paper #1 (100ms wait)
2.8s  → Enrich paper #2 (100ms wait)
...
5.6s  → Enrich paper #30 (last one)
5.7s  → Transform, deduplicate, categorize
5.8s  → Save to cache and JSON
5.9s  → Done!
```

---

## 🔢 Rate Limit Calculations

### Without API Key:
- **Limit**: 100 requests per 5 minutes
- **Our usage**: 8-38 requests per update
- **Updates**: Every 6 hours
- **Safety margin**: ✅ Plenty of room

### With API Key:
- **Limit**: Higher (varies by tier, typically 500-5000/5min)
- **Our usage**: 8-38 requests per update
- **Updates**: Every 6 hours
- **Safety margin**: ✅ Very safe

### Rate Limit Headroom:
```
100 requests / 5 minutes = 20 requests per minute
Our max usage: 38 requests per update
Time between updates: 6 hours = 360 minutes

Requests per hour: 38 / 6 = ~6.3 requests/hour
Requests per 5 minutes: 6.3 / 12 = ~0.5 requests/5min

✅ We use < 1% of rate limit capacity!
```

---

## 🎯 Real-World Example

### What happens when you click "Refresh":

```
User clicks "Refresh" button
    ↓
Frontend: POST /api/papers/refresh
    ↓
Backend: updatePapers() starts (background)
    ↓
Console logs:
  "🔄 Fetching new papers..."
  "🔍 Fetching from Semantic Scholar..."
    ↓
8 API calls to Semantic Scholar (with 200ms delays)
    ↓
Console logs:
  "✅ Found 100 papers from Semantic Scholar"
    ↓
Transform papers
    ↓
Console logs:
  "📝 Removed 15 duplicates"
    ↓
Categorize by industry
    ↓
Save to database
    ↓
Console logs:
  "✅ Updated 85 papers"
  "📊 Industry stats: { 'Machine Learning': 25, ... }"
    ↓
Frontend polls /api/papers and sees new papers!
```

---

## 🔍 Monitoring API Usage

### Check how many requests you've made:

The backend doesn't track this automatically, but you can:

1. **Check Semantic Scholar dashboard** (if you have API key)
2. **Monitor backend logs** for API errors
3. **Add custom logging**:

```javascript
// In semanticScholarService.js
let requestCount = 0;

// Before each API call:
requestCount++;
console.log(`📡 API Request #${requestCount} to Semantic Scholar`);
```

---

## 🚨 Error Handling

### What happens if API fails?

1. **Semantic Scholar search fails for one topic:**
   - ✅ Continues with other topics
   - ✅ Logs error but doesn't stop

2. **All Semantic Scholar searches fail:**
   - ✅ Falls back to arXiv
   - ✅ Still gets papers (just without citations)

3. **Rate limit exceeded:**
   - ❌ API returns 429 error
   - ✅ Code catches error, logs it
   - ✅ Returns empty array, falls back to arXiv

4. **Network timeout:**
   - ✅ 30-second default timeout
   - ✅ Catches error, continues with other sources

---

## 💡 Optimization Opportunities

### Current approach is safe but could be faster:

1. **Parallel requests** (instead of sequential):
   - Could make all 8 searches at once
   - ⚠️ But might hit rate limits faster

2. **Batch API for enrichment**:
   - Instead of 30 individual calls, use batch API
   - ✅ Already implemented in `fetchPapersBatch()`
   - Could be used for arXiv enrichment

3. **Caching strategy**:
   - Cache individual paper details
   - Avoid re-fetching same papers

---

## 📝 Summary

**Total API calls per update:**
- Minimum: 8 (Semantic Scholar only)
- Maximum: 39 (Semantic Scholar + arXiv + enrichment)

**Total time per update:**
- Minimum: ~2 seconds
- Maximum: ~6 seconds

**Update frequency:**
- Automatic: Every 6 hours
- Manual: On-demand via refresh button

**Rate limit safety:**
- ✅ Very safe (uses < 1% of free tier limit)

