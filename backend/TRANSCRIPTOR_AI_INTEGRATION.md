# Transcriptor AI Integration

## Overview

Transcriptor AI has been integrated as the **first priority method** for fetching YouTube video transcripts. It's a FastAPI service that uses Supadata internally to provide reliable transcription.

## How It Works

1. **API Endpoint**: `GET /transcript?url=<youtube_url>`
2. **Response Format**: `{ "vid_url": "...", "transcript": "..." }`
3. **Service**: Uses Supadata internally for transcription

## Integration Details

### Priority Order

The system now tries transcript fetching methods in this order:

1. **Transcriptor AI API** (Method 0) - If `TRANSCRIPTOR_AI_URL` is configured
2. **youtube-transcript library** (Method 1) - Fast, if captions available
3. **OpenAI Whisper API** (Method 2) - Fallback, works without captions

### Configuration

Add to `backend/.env`:

```env
# Transcriptor AI API (optional - if you want to use it)
TRANSCRIPTOR_AI_URL=http://localhost:8000
# Or if it's hosted: TRANSCRIPTOR_AI_URL=https://your-transcripter-api.com
```

### Setting Up Transcriptor AI Service

1. **Clone the repository** (already done):
   ```bash
   git clone https://github.com/ShashwatM3/transcripter-api.git
   cd transcripter-api
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables** (create `.env` in transcripter-api directory):
   ```env
   SUPADATA_API_KEY=your_supadata_api_key
   YOUTUBE_TRANSCRIPT_API_TOKEN=your_token (optional)
   ```

4. **Start the service**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. **Configure in your backend**:
   ```env
   TRANSCRIPTOR_AI_URL=http://localhost:8000
   ```

## Benefits

- **Fast**: Direct API call, no audio download needed
- **Reliable**: Uses Supadata service which handles YouTube restrictions
- **Simple**: Just pass a URL, get a transcript
- **Cost-effective**: May be cheaper than Whisper API for large volumes
- **Fallback Chain**: If it fails, we still use existing methods

## Response Format

The Transcriptor AI API returns:
```json
{
  "vid_url": "https://www.youtube.com/watch?v=...",
  "transcript": "Full transcript text here..."
}
```

Our integration converts the plain text transcript into a diarized format with timestamps for consistency with other methods.

## Error Handling

- If the service is not running: Silently falls back to other methods
- If the service returns an error: Logs and falls back to other methods
- Connection errors: Handled gracefully without breaking the pipeline

## Testing

To test the integration:

1. Start the Transcriptor AI service:
   ```bash
   cd transcripter-api
   uvicorn main:app --reload --port 8000
   ```

2. Set the environment variable:
   ```env
   TRANSCRIPTOR_AI_URL=http://localhost:8000
   ```

3. Run the test script:
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

## Notes

- The service must be running separately (it's a Python FastAPI service)
- It requires a Supadata API key (see transcripter-api/.env)
- If the service is not available, the system automatically falls back to other methods
- The transcript is converted to our standard diarized format with timestamps

