# Video Breakdown System

## Overview

The Video Breakdown System automatically creates detailed, structured breakdowns of video/podcast content. It segments conversations by topic, extracts deep insights (frameworks, tactical advice, trade-offs), and presents knowledge in an organized, searchable format.

## How It Works

### 1. **Video Processing Flow**

When a video is processed via `processYouTubeVideo()`:

1. **Transcript Fetching**: Uses existing 3-method fallback (FastAPI Transcriptor → youtube-transcript → Whisper)
2. **Basic Processing**: Extracts entities, technologies, companies (existing functionality)
3. **Deep Breakdown** (NEW): Asynchronously generates detailed breakdown:
   - Segments transcript by topic (not just time)
   - Extracts deep insights from each segment
   - Structures knowledge for easy consumption

### 2. **Segmentation**

The system uses LLM (OpenAI/Anthropic) to identify natural topic shifts:

- **Topic-Based Segmentation**: Identifies where conversations shift to new topics
- **Structure Detection**: Identifies intro, main topics, conclusion
- **Fallback**: Time-based segmentation if LLM unavailable

**Output Format:**
```json
{
  "segments": [
    {
      "title": "AI Scaling Lessons",
      "startTime": "00:05:30",
      "endTime": "00:12:45",
      "summary": "Discussion about scaling AI systems...",
      "topics": ["scaling", "infrastructure"],
      "transcriptSnippet": "Key excerpt..."
    }
  ],
  "overallStructure": {
    "intro": "Introduction segment",
    "mainTopics": ["Topic 1", "Topic 2"],
    "conclusion": "Conclusion segment"
  }
}
```

### 3. **Deep Insight Extraction**

For each segment, extracts:

- **Frameworks**: Mental models, step-by-step processes
- **Tactical Advice**: "How-to" recommendations
- **Trade-offs**: Comparisons, why one approach works better
- **Personal Experiences**: Stories, failures, lessons learned
- **Quantitative Claims**: Metrics, benchmarks, numbers
- **Nuanced Opinions**: Contrarian views, deep analysis

**Output Format:**
```json
{
  "insights": [
    {
      "type": "framework",
      "text": "The actual insight text (1-3 sentences)",
      "depth_score": 0.85,
      "speaker": "Speaker name",
      "timestamp": "00:05:30",
      "context": "Additional context"
    }
  ],
  "keyTakeaways": ["Main takeaway 1", "Main takeaway 2"]
}
```

### 4. **Storage**

Breakdowns are stored in the `podcasts` table:

- **Column**: `breakdown` (JSONB)
- **Migration**: `002_add_video_breakdowns.sql`
- **Indexed**: For fast queries and search

## API Endpoints

### Get Video Breakdown

```
GET /api/podcasts/:id/breakdown
```

**Response:**
```json
{
  "videoId": "abc123",
  "segments": [...],
  "overallSummary": {
    "totalSegments": 8,
    "totalInsights": 24,
    "mainTopics": ["AI Scaling", "Fundraising"],
    "structure": {...}
  },
  "generatedAt": "2025-01-25T10:30:00Z",
  "metadata": {...}
}
```

**Behavior:**
- Returns existing breakdown if available
- Attempts to generate if transcript is stored
- Returns 404 if breakdown unavailable

## Configuration

### Required Environment Variables

```env
# For LLM-based segmentation and insight extraction
AI_PROVIDER=openai  # or 'anthropic' or 'none'
AI_API_KEY=sk-...   # or OPENAI_API_KEY
OPENAI_MODEL=gpt-4o-mini  # optional
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # optional
```

### Fallback Behavior

- If `AI_PROVIDER=none` or no API key: Uses time-based segmentation and basic pattern matching
- System continues to work without LLM, but insights are less deep

## Database Migration

Run the migration to add breakdown support:

```sql
-- In Supabase SQL Editor
\i backend/supabase/migrations/002_add_video_breakdowns.sql
```

Or manually:
```sql
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS breakdown JSONB;
CREATE INDEX IF NOT EXISTS idx_podcasts_breakdown ON podcasts USING GIN(breakdown);
```

## Usage Examples

### Automatic Breakdown Generation

Breakdowns are automatically generated when videos are processed:

```javascript
// In processYouTubeVideo() - breakdown generated asynchronously
const result = await processYouTubeVideo(videoId, metadata);
// result.breakdown will be populated when ready
```

### Manual Breakdown Generation

```javascript
import { generateVideoBreakdown } from './services/videoBreakdownService.js';

const breakdown = await generateVideoBreakdown(
  videoId,
  transcriptText,
  {
    title: "Video Title",
    channel: "Channel Name",
    duration: 3600
  }
);
```

### Fetching Breakdowns

```javascript
// Via API
const response = await fetch(`/api/podcasts/${podcastId}/breakdown`);
const breakdown = await response.json();

// From database
const podcast = await podcastsDB.getById(podcastId);
const breakdown = podcast.breakdown;
```

## Cost Considerations

- **LLM API Costs**: 
  - Segmentation: ~$0.01-0.05 per video (depending on length)
  - Insight Extraction: ~$0.02-0.10 per video (per segment)
  - Total: ~$0.10-0.50 per hour-long video

- **Optimization**:
  - Breakdowns generated asynchronously (non-blocking)
  - Cached in database (no re-generation)
  - Can disable LLM for cost savings (fallback mode)

## Future Enhancements

1. **Cross-Video Analysis**: Identify recurring themes across videos
2. **Knowledge Graph**: Connect insights to create knowledge network
3. **Personalized Feeds**: Filter insights by user interests
4. **Search**: Full-text search across all insights
5. **Export**: Export breakdowns as markdown, PDF, etc.

## Files Created/Modified

- ✅ `backend/services/videoBreakdownService.js` - Core breakdown logic
- ✅ `backend/services/podcastService.js` - Integrated breakdown generation
- ✅ `backend/server.js` - Added `/api/podcasts/:id/breakdown` endpoint
- ✅ `backend/services/supabaseService.js` - Added breakdown storage/retrieval
- ✅ `backend/supabase/migrations/002_add_video_breakdowns.sql` - Database migration

