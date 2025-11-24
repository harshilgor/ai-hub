# Fixes Applied

## Issue 1: Video Insights Not Showing

### Problem
The video endpoint was returning an error: `Invalid value at 'video_duration'`

### Root Cause
The YouTube API `videoDuration` parameter only accepts a single value ('any', 'short', 'medium', 'long'), not comma-separated values like 'medium,long'.

### Fix Applied
Changed `videoDuration: 'medium,long'` to `videoDuration: 'long'` in `backend/services/youtubeChannelService.js`

This will fetch videos longer than 20 minutes, which is appropriate for podcasts/interviews.

### Next Steps
**RESTART YOUR SERVER** to apply the fix:
```powershell
# Stop current server (Ctrl+C)
npm start
```

After restart, the video endpoint should work and videos will appear on the home page.

---

## Issue 2: Not Fetching Enough Papers from arXiv

### Problem
Only fetching 100 papers per call from arXiv, but arXiv allows up to 2000 results per query.

### Root Cause
- `fetchArXivLatest()` was called with `maxResults = 100` in multiple places
- Internal fetch limit was capped at 500
- Not taking advantage of arXiv's 2000 result limit

### Fixes Applied

1. **Increased fetch calls in `server.js`**:
   - Changed `fetchArXivLatest(100, ...)` to `fetchArXivLatest(300, ...)` in all 3 locations
   - This will fetch 300 papers per cycle instead of 100

2. **Increased internal fetch limit in `arxivService.js`**:
   - Changed `fetchLimit = Math.min(maxResults * 3, 500)` to `fetchLimit = Math.min(maxResults * 5, 1000)`
   - This allows fetching up to 1000 papers internally (arXiv allows 2000, but 1000 is safer)

3. **Updated `fetchArXivPapers()` function**:
   - Changed default `maxResults` from 100 to 300
   - Added internal fetch limit of up to 1000 papers

### Expected Results

**Before:**
- ~100 papers per fetch cycle
- Internal limit: 500 papers

**After:**
- ~300 papers per fetch cycle (3x increase)
- Internal limit: 1000 papers (2x increase)
- More papers will be available in the database

### Next Steps

**RESTART YOUR SERVER** to apply the changes:
```powershell
# Stop current server (Ctrl+C)
npm start
```

The system will now fetch more papers from arXiv on the next update cycle (every 10 minutes).

---

## Summary

Both issues have been fixed in the code. You need to **restart your backend server** for the changes to take effect.

After restarting:
1. Video insights should appear on the home page
2. More papers will be fetched from arXiv (3x increase)

