# Transcriptor AI Setup Guide

## Quick Start

### 1. Set Up Transcriptor AI Service

The repository has been cloned to `transcripter-api/` directory.

**Install dependencies:**
```bash
cd transcripter-api
pip install -r requirements.txt
```

**Create `.env` file in `transcripter-api/` directory:**
```env
SUPADATA_API_KEY=your_supadata_api_key_here
YOUTUBE_TRANSCRIPT_API_TOKEN=your_token_here (optional)
```

**Start the service:**
```bash
uvicorn main:app --reload --port 8000
```

The service will be available at: `http://localhost:8000`

### 2. Configure Backend

Add to `backend/.env`:
```env
TRANSCRIPTOR_AI_URL=http://localhost:8000
```

### 3. Test the Integration

Run the test script:
```bash
cd backend
node test-video-insights.js
```

You should see:
```
📹 Fetching transcript for <videoId>...
   Trying Transcriptor AI API...
   ✅ Successfully fetched transcript via Transcriptor AI (X segments)
```

## API Details

**Endpoint:** `GET /transcript?url=<youtube_url>`

**Example:**
```bash
curl "http://localhost:8000/transcript?url=https://www.youtube.com/watch?v=VIDEO_ID"
```

**Response:**
```json
{
  "vid_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "transcript": "Full transcript text here..."
}
```

## How It Works

1. Transcriptor AI uses Supadata internally for transcription
2. It handles YouTube restrictions and proxy configuration
3. Returns plain text transcript
4. Our system converts it to diarized format with timestamps

## Priority Order

The system tries methods in this order:

1. **Transcriptor AI** (if `TRANSCRIPTOR_AI_URL` is set)
2. **youtube-transcript library** (if captions available)
3. **OpenAI Whisper API** (fallback, works without captions)

## Benefits

- ✅ Fast: Direct API call, no audio download
- ✅ Reliable: Uses Supadata which handles YouTube restrictions
- ✅ Simple: Just pass a URL
- ✅ Automatic fallback: If service is down, uses other methods

## Troubleshooting

**Service not available:**
- Check if service is running: `curl http://localhost:8000/`
- Check if port 8000 is available
- Verify SUPADATA_API_KEY is set correctly

**Connection refused:**
- Make sure the service is started: `uvicorn main:app --reload --port 8000`
- Check firewall settings

**API errors:**
- Verify Supadata API key is valid
- Check transcripter-api logs for details

