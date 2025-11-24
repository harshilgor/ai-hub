# Podcast Insights Generator - User Guide

## Overview

The Podcast Insights Generator analyzes podcast transcripts to extract:
- **Speaker diarization** - Identifies who said what
- **Stance detection** - Determines if speakers are pro/con/neutral/mixed about technologies
- **Technology extraction** - Identifies technologies mentioned (AI, LLM, Robotics, etc.)
- **Key quotes** - Extracts important predictions and insights
- **Sentiment analysis** - Analyzes sentiment toward specific aspects
- **Company mentions** - Identifies companies and startups discussed

## Input Methods

### Method 1: Manual Transcript Submission (Recommended for now)

You provide the transcript text directly. The system will:
1. Parse speaker labels and timestamps
2. Analyze each segment
3. Extract insights
4. Store in database

**API Endpoint:**
```
POST /api/podcasts/process
Content-Type: application/json

{
  "transcript": "00:00:15 [Host]: Welcome to the show...\n00:00:30 [Guest]: Thanks for having me...",
  "metadata": {
    "title": "AI Revolution with Sam Altman",
    "published": "2024-01-15T10:00:00Z",
    "source": "Lex Fridman Podcast",
    "link": "https://example.com/episode-123",
    "episode": "Episode 123",
    "podcast": "Lex Fridman Podcast"
  }
}
```

### Method 2: YouTube Video Processing

You provide a YouTube video ID or URL. The system will:
1. Fetch the transcript automatically
2. Process it with all analyses
3. Store in database

**API Endpoint:**
```
POST /api/podcasts/youtube
Content-Type: application/json

{
  "videoId": "dQw4w9WgXcQ",  // or full URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  "metadata": {
    "title": "Sam Altman on AGI",
    "published": "2024-01-15T10:00:00Z",
    "episode": "Episode 123",
    "podcast": "Lex Fridman Podcast"
  }
}
```

## Transcript Format

The system supports multiple transcript formats:

### Format 1: Time-aligned with speaker labels
```
00:00:15 [Host]: Welcome to the show...
00:00:30 [Guest]: Thanks for having me...
00:01:00 [Host]: Let's talk about AI...
```

### Format 2: Simple speaker labels
```
Host: Welcome to the show...
Guest: Thanks for having me...
Host: Let's talk about AI...
```

### Format 3: Plain text (no speaker labels)
```
Welcome to the show. Thanks for having me. Let's talk about AI...
```

## Querying Podcasts

### Get All Podcasts
```
GET /api/podcasts?limit=10&offset=0
```

### Query by Technology and Stance
```
GET /api/podcasts/query?technology=AI&stance=pro&startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
- `technology` - Filter by technology (e.g., "AI", "LLM", "Robotics")
- `stance` - Filter by stance: "pro", "con", "neutral", "mixed"
- `speaker` - Filter by speaker name
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)

### Aggregate Views
```
GET /api/podcasts/aggregate?groupBy=speaker
```

**Group By Options:**
- `speaker` - Group by speaker
- `episode` - Group by episode
- `industry` - Group by industry

## Example Workflow

### 1. Process a YouTube Video
```bash
curl -X POST http://localhost:3001/api/podcasts/youtube \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "dQw4w9WgXcQ",
    "metadata": {
      "title": "Sam Altman on AGI",
      "published": "2024-01-15T10:00:00Z",
      "podcast": "Lex Fridman Podcast"
    }
  }'
```

### 2. Process a Manual Transcript
```bash
curl -X POST http://localhost:3001/api/podcasts/process \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "00:00:15 [Host]: Welcome...\n00:00:30 [Guest]: AI will revolutionize everything...",
    "metadata": {
      "title": "AI Revolution",
      "published": "2024-01-15T10:00:00Z",
      "source": "Tech Podcast"
    }
  }'
```

### 3. Query for Pro-AI Statements
```bash
curl "http://localhost:3001/api/podcasts/query?technology=AI&stance=pro"
```

## Future: Channel-Based Fetching

Currently, you need to provide individual podcast links/transcripts. In the future, we can add:
- **Channel-based fetching** - Automatically fetch new episodes from YouTube channels
- **RSS feed integration** - Monitor podcast RSS feeds
- **Scheduled processing** - Automatically process new episodes

## Integration with Insights

Processed podcasts are automatically:
- Included in `getAllSignals()` for insight generation
- Used in technology predictions
- Included in leader quotes (`/api/insights/leader-quotes`)
- Used in combined signal strength calculations

## Storage

Podcasts are stored in:
- **In-memory cache**: `podcastsCache` (for fast access)
- **Database file**: `backend/data/podcasts.json` (persistent storage)

## Notes

- YouTube transcripts require the video to have captions enabled
- Processing can take 30-60 seconds for long transcripts
- The system automatically extracts technologies, companies, and sentiments
- Speaker names are normalized (Host, Guest, etc.)

