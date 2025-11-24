# Assembly AI Integration Setup

This guide explains how to set up Assembly AI for YouTube video transcription.

## Overview

Assembly AI allows us to transcribe YouTube videos directly from their URL - no need to download videos. This is much more reliable than trying to download audio from YouTube.

## Setup Steps

### 1. Get Assembly AI API Key

1. Go to [Assembly AI](https://www.assemblyai.com/)
2. Sign up for a free account (or use existing account)
3. Navigate to your dashboard and copy your API key
4. The free tier includes 5 hours of transcription per month

### 2. Add API Key to Environment

Add your Assembly AI API key to your `.env` file in the `backend` directory:

```env
ASSEMBLYAI_API_KEY=your_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. Install Dependencies

The Assembly AI package is already added to `package.json`. Run:

```bash
cd backend
npm install
```

## How It Works

1. **YouTube API** - Fetches video information from channels you specify
2. **Assembly AI** - Transcribes videos directly from YouTube URL (no download needed)
3. **Database** - Stores transcripts and insights in `backend/data/podcasts.json`
4. **Scheduled Job** - Automatically checks channels every 6 hours

## Usage

### Add a Channel

```bash
POST /api/channels
{
  "channelId": "UCX14i9dYBrFOabk0xGmbkRA",
  "name": "Channel Name",
  "autoProcess": true,
  "maxVideosPerCheck": 5
}
```

### Check Channels Manually

```bash
POST /api/channels/check-all
```

### View Processed Videos

```bash
GET /api/podcasts
```

## Method Priority

The system tries methods in this order:

1. **Assembly AI** (Primary) - Works with just URL, no download needed
2. **youtube-transcript library** (Fallback) - Fast if captions are available

## Benefits

- ✅ No video downloading required
- ✅ Works even without captions
- ✅ Speaker diarization included
- ✅ More reliable than YouTube download methods
- ✅ Automatic processing every 6 hours

## Cost

- Assembly AI Free Tier: 5 hours/month
- Assembly AI Paid: $0.00025 per second (~$0.90 per hour)

## Troubleshooting

### "Assembly AI not configured"
- Make sure `ASSEMBLYAI_API_KEY` is set in `.env`
- Restart the server after adding the key

### "Transcription failed"
- Check your Assembly AI account for remaining credits
- Verify the YouTube URL is accessible
- Check server logs for detailed error messages

### "Rate limit exceeded"
- Assembly AI has rate limits on free tier
- Wait a few minutes and try again
- Consider upgrading if you need more throughput

