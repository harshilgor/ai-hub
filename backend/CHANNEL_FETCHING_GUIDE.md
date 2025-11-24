# Automatic Channel-Based Podcast Fetching Guide

## Overview

The system can now automatically fetch and process podcasts from YouTube channels you configure. It will:
- Check channels periodically (every 6 hours by default)
- Fetch new videos automatically
- Process transcripts and extract insights
- Track which videos have been processed (no duplicates)

## Setup

### 1. YouTube API Key
Your API key is already configured in `.env`:
```
YOUTUBE_API_KEY=AIzaSyCV4cQVV2n5eF3WW6xt7xNfcz8Imuw6eH8
```

### 2. Add Channels

You can add channels in multiple ways:

#### Method 1: Channel ID
```
POST /api/channels
{
  "channelId": "UC_x5XG1OV2P6uZZ5FSM9Ttw",
  "name": "Lex Fridman",
  "autoProcess": true,
  "maxVideosPerCheck": 5
}
```

#### Method 2: Channel Handle
```
POST /api/channels
{
  "channelId": "@lexfridman",
  "name": "Lex Fridman",
  "autoProcess": true,
  "maxVideosPerCheck": 5
}
```

#### Method 3: Full YouTube URL
```
POST /api/channels
{
  "channelId": "https://www.youtube.com/@lexfridman",
  "name": "Lex Fridman",
  "autoProcess": true,
  "maxVideosPerCheck": 5
}
```

## API Endpoints

### Add Channel
```bash
POST /api/channels
Content-Type: application/json

{
  "channelId": "@lexfridman",
  "name": "Lex Fridman",
  "autoProcess": true,
  "maxVideosPerCheck": 5
}
```

### List All Channels
```bash
GET /api/channels
```

### Update Channel
```bash
PUT /api/channels/:id
{
  "enabled": false,  // Disable auto-processing
  "maxVideosPerCheck": 10
}
```

### Delete Channel
```bash
DELETE /api/channels/:id
```

### Manually Check Single Channel
```bash
POST /api/channels/:id/check
```

### Manually Check All Channels
```bash
POST /api/channels/check-all
```

## Automatic Processing

The system automatically:
- Checks all enabled channels every 6 hours
- Fetches up to 5 new videos per channel (configurable)
- Processes only videos longer than 4 minutes
- Skips already processed videos
- Saves processed podcasts to database

## Channel Configuration

Each channel has:
- `id`: Unique identifier
- `channelId`: YouTube channel ID or handle
- `name`: Display name
- `enabled`: Whether channel is active
- `autoProcess`: Whether to automatically process new videos
- `lastChecked`: Last time channel was checked
- `lastVideoId`: ID of last processed video
- `processedVideoIds`: Array of all processed video IDs
- `maxVideosPerCheck`: Maximum videos to fetch per check

## Example Workflow

1. **Add a channel:**
```bash
curl -X POST http://localhost:3001/api/channels \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "@lexfridman",
    "name": "Lex Fridman",
    "autoProcess": true,
    "maxVideosPerCheck": 5
  }'
```

2. **Manually trigger check:**
```bash
curl -X POST http://localhost:3001/api/channels/check-all
```

3. **View processed podcasts:**
```bash
curl http://localhost:3001/api/podcasts
```

## Storage

- Channel configurations: `backend/data/channels.json`
- Processed podcasts: `backend/data/podcasts.json`
- In-memory cache: `podcastsCache` array

## Notes

- Videos must have captions enabled for transcript fetching
- Only videos longer than 4 minutes are processed
- Rate limiting: 2 seconds between video processing
- Duplicate videos are automatically skipped

