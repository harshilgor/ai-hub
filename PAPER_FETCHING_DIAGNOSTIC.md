# Research Paper Fetching System - Complete Flow Explanation

## 🔄 How the System Works

### 1. **Backend Server Initialization** (`backend/server.js`)

When the server starts:
1. Loads existing papers from `backend/data/papers.json`
2. Sets `lastPaperDate` to the newest paper's date (or 7 days ago if too old)
3. Schedules cron jobs:
   - **Every 10 minutes**: `updatePapers()` runs automatically
   - **Daily at midnight**: Resets date threshold to last 7 days

### 2. **Paper Fetching Process** (`updatePapers()` function)

**Step 1: Calculate Date Threshold**
```javascript
// Always fetch from at least last 48 hours
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

// If we have a lastPaperDate, use it (minus 1 day) or 2 days ago, whichever is newer
dateThreshold = oneDayAfterNewest > twoDaysAgo ? oneDayAfterNewest : twoDaysAgo;
```

**Step 2: Fetch from APIs (with retry logic)**
- Tries up to 3 times with expanding date windows:
  - Attempt 1: From `dateThreshold` (usually last 2 days)
  - Attempt 2: If no new papers, expand to last 14 days
  - Attempt 3: If still no new papers, expand to last 30 days

**Step 3: Fetch from Both Sources**
```javascript
Promise.allSettled([
  fetchLatestPapersFromSemanticScholar(100, currentYear, dateThreshold),
  fetchArXivLatest(100, dateThreshold)
])
```

**Step 4: Remove Duplicates**
- First removes duplicates within the new batch
- Then checks against existing cache using:
  - arXiv ID
  - Semantic Scholar ID
  - Normalized title (lowercase, no punctuation)

**Step 5: Merge with Cache**
- Adds truly new papers to the front of the cache
- Sorts by published date (newest first)
- Limits to 1000 most recent papers
- Updates `lastPaperDate` to newest paper's date

**Step 6: Save to Database**
- Saves to `backend/data/papers.json`
- Updates `lastFetchTime` timestamp

### 3. **API Endpoints**

**GET `/api/papers`**
- Returns papers from `papersCache` array
- Applies filters (category, venue, search, source)
- Sorts by published date (newest first)
- Returns paginated results

**GET `/api/papers/stats`**
- Calculates industry stats from cached papers
- Filters by time period (month/quarter/year)

**POST `/api/papers/refresh?force=true`**
- Manually triggers `updatePapers()`
- If `force=true`, resets date threshold to 7 days ago

### 4. **Frontend Display** (`src/pages/ResearchPapers.tsx`)

**On Component Mount:**
- Calls `loadPapers()` which fetches from `/api/papers`
- Calls `loadStats()` which fetches from `/api/papers/stats`

**Auto-Refresh:**
- Every 2 minutes, automatically calls `loadPapers()` and `loadStats()`

**Manual Refresh:**
- "Refresh" button calls `refreshPapers()` API, then reloads

## 🔍 Common Issues & How to Debug

### Issue 1: No New Papers Being Fetched

**Check:**
1. Is the backend server running? (`netstat -ano | findstr :3001`)
2. Are cron jobs executing? (Check server logs for "⏰ Scheduled update triggered")
3. Are API calls succeeding? (Check for "✅ Found X papers from..." in logs)
4. Are all papers duplicates? (Check for "🆕 Found 0 truly new papers")

**Debug Steps:**
```bash
# Check server logs
# Look for these messages:
# - "🔄 Fetching new papers from all sources..."
# - "✅ Found X papers from Semantic Scholar"
# - "✅ Found X papers from arXiv"
# - "🆕 Found X truly new papers"
```

### Issue 2: Papers Fetched But Not Displayed

**Check:**
1. Is `papersCache` being updated? (Check `backend/data/papers.json`)
2. Is `lastFetchTime` updating? (Should change every 10 minutes)
3. Is frontend calling the API? (Check browser Network tab)
4. Is browser caching responses? (Check for cache headers)

**Debug Steps:**
```bash
# Check papers.json file
cat backend/data/papers.json | grep -A 5 "lastFetchTime"

# Check API directly
curl http://localhost:3001/api/papers?limit=5

# Check browser console for errors
# Open DevTools → Network tab → Look for /api/papers requests
```

### Issue 3: Date Threshold Too Strict

**Symptoms:**
- `lastPaperDate` stuck on old date
- Logs show "Found 0 truly new papers" repeatedly
- Papers in cache are all from same date

**Fix:**
- The code now expands date window automatically
- But you can manually reset: `POST /api/papers/refresh?force=true`

### Issue 4: API Rate Limiting

**Symptoms:**
- Logs show "⚠️ Error searching for... Request failed with status code 429"
- Semantic Scholar returns empty results

**Fix:**
- Rate limiter is in place (1 req/sec)
- Check if API key is set in `.env` file
- Wait for rate limit to reset

## 🛠️ Manual Debugging Commands

### Check Server Status
```bash
# Is server running?
netstat -ano | findstr :3001

# Check server process
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

### Check Papers Cache
```bash
# Count papers in cache
(Get-Content backend/data/papers.json | ConvertFrom-Json).papers.Count

# Check last fetch time
(Get-Content backend/data/papers.json | ConvertFrom-Json).lastFetchTime

# Check newest paper date
(Get-Content backend/data/papers.json | ConvertFrom-Json).lastPaperDate
```

### Test API Endpoints
```bash
# Get papers
Invoke-WebRequest -Uri "http://localhost:3001/api/papers?limit=5" | Select-Object -ExpandProperty Content

# Get stats
Invoke-WebRequest -Uri "http://localhost:3001/api/papers/stats" | Select-Object -ExpandProperty Content

# Force refresh
Invoke-WebRequest -Uri "http://localhost:3001/api/papers/refresh?force=true" -Method POST
```

### Check Server Logs
The server logs should show:
- `⏰ Scheduled update triggered (every 10 minutes)` - Cron job running
- `🔄 Fetching new papers from all sources...` - Update started
- `📅 Fetching papers from: [date]` - Date threshold used
- `✅ Found X papers from Semantic Scholar` - API success
- `✅ Found X papers from arXiv` - API success
- `🆕 Found X truly new papers` - New papers found
- `✅ Updated X papers (Y new)` - Cache updated

## 🔧 Manual Fixes

### Fix 1: Reset Date Threshold
```bash
# Stop server, edit backend/data/papers.json
# Change "lastPaperDate" to 7 days ago:
# "lastPaperDate": "2025-11-15T00:00:00.000Z"
# Restart server
```

### Fix 2: Clear Cache and Start Fresh
```bash
# Backup current cache
cp backend/data/papers.json backend/data/papers.json.backup

# Delete cache (server will create new one)
rm backend/data/papers.json

# Restart server - it will fetch fresh papers
```

### Fix 3: Force Immediate Refresh
```bash
# Trigger manual refresh
Invoke-WebRequest -Uri "http://localhost:3001/api/papers/refresh?force=true" -Method POST

# Wait 2-3 minutes for rate-limited API calls to complete
# Check papers.json again
```

## 📊 Expected Behavior

**Every 10 Minutes:**
1. Cron job triggers `updatePapers()`
2. Fetches from last 48 hours (minimum)
3. If no new papers, expands to 14 days, then 30 days
4. Merges new papers into cache
5. Saves to `papers.json`
6. Updates `lastFetchTime`

**Frontend:**
1. Auto-refreshes every 2 minutes
2. Calls `/api/papers` with cache-busting
3. Displays newest papers first

**What You Should See:**
- Papers from last 2-7 days appearing
- `lastFetchTime` updating every 10 minutes
- New papers appearing in feed (sorted by date, newest first)
- Industry stats updating with new counts

## 🚨 If Still Not Working

1. **Check server is actually running** - Look for "✅ Server running on http://localhost:3001"
2. **Check cron jobs are executing** - Look for "⏰ Scheduled update triggered" every 10 min
3. **Check API calls are succeeding** - Look for "✅ Found X papers" messages
4. **Check papers are being saved** - Verify `papers.json` file is updating
5. **Check frontend is calling API** - Browser DevTools → Network tab
6. **Check for errors** - Look for "❌ Error" or "⚠️" messages in server logs

