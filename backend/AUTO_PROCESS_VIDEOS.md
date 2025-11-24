# Automatic Video Processing

## Problem
Videos were being fetched and displayed, but not automatically processed, showing "Processing insights... This video will be analyzed soon."

## Solution

### 1. Automatic Processing on Fetch
When videos are fetched via `/api/channels/:id/videos`, the system now:
- Checks if videos are already processed
- If `autoProcess` is enabled on the channel, automatically processes unprocessed videos
- Returns insights immediately after processing

### 2. Manual Processing Endpoint
New endpoint to manually process all unprocessed videos:

```bash
POST /api/channels/:id/videos/process?limit=10
```

**Example:**
```powershell
$channelId = (Invoke-RestMethod -Uri "http://localhost:3001/api/channels" -Method GET).channels[0].id
Invoke-RestMethod -Uri "http://localhost:3001/api/channels/$channelId/videos/process?limit=5" -Method POST
```

## How It Works

1. **On Home Page Load:**
   - Frontend calls `/api/channels/:id/videos`
   - Backend fetches videos from YouTube
   - If `autoProcess: true` on channel, processes unprocessed videos
   - Returns videos with insights

2. **Processing Steps:**
   - Fetches transcript from YouTube
   - Parses into segments with speaker labels
   - Extracts entities (technologies, companies, people)
   - Analyzes stances (pro/con/neutral)
   - Generates key quotes
   - Calculates sentiment distribution
   - Saves to database

3. **Rate Limiting:**
   - 2 second delay between videos
   - Prevents overwhelming YouTube API

## Current Status

Your channel (Dwarkesh Patel) has `autoProcess: true`, so videos should automatically process when:
- Home page loads and fetches videos
- Channel is checked via cron job (every 6 hours)
- Manual channel check is triggered

## Next Steps

**Restart your server** to apply the changes:

```powershell
# Stop current server (Ctrl+C)
npm start
```

After restart:
1. Refresh the home page
2. Videos will automatically process (may take a few minutes for first load)
3. Insights will appear once processing completes

## Manual Processing (Optional)

If you want to process videos immediately without waiting:

```powershell
$channelId = (Invoke-RestMethod -Uri "http://localhost:3001/api/channels" -Method GET).channels[0].id
Invoke-RestMethod -Uri "http://localhost:3001/api/channels/$channelId/videos/process?limit=5" -Method POST
```

This will process up to 5 unprocessed videos and return the results.

