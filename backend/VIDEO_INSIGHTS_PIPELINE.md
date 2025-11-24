# Video Insights Generation Pipeline

## Overview

The system generates comprehensive insights from YouTube videos through a multi-stage NLP pipeline. Here's how it works:

---

## Step 1: Video Discovery & Transcript Fetching

### 1.1 Channel Monitoring
- System monitors configured YouTube channels (e.g., Dwarkesh Patel)
- Fetches recent videos using YouTube Data API v3
- Filters for long-form content (videos > 20 minutes)

### 1.2 Transcript Extraction
```javascript
// Uses youtube-transcript library
fetchYouTubeTranscript(videoId)
```
- Fetches auto-generated captions from YouTube
- Converts to time-aligned format: `"00:00:15 [Speaker]: Hello and welcome..."`
- Returns full transcript text

---

## Step 2: Speaker Diarization & Segmentation

### 2.1 Parse Transcript
```javascript
parseDiarizedTranscript(transcriptText)
```

**What it does:**
- Splits transcript into time-aligned segments
- Identifies speaker labels (if available)
- Extracts timestamps for each segment

**Output format:**
```javascript
{
  index: 0,
  timestamp: "00:00:15",
  speaker: "Host" or "Guest" or "Unknown",
  text: "The transcript text for this segment...",
  startTime: 15  // seconds
}
```

**Speaker Detection:**
- Looks for patterns like `[Speaker Name]:`, `Speaker 1:`, or capitalized names
- Normalizes speaker names (Host, Guest, etc.)

---

## Step 3: Per-Segment NLP Analysis

For each segment, the system performs multiple analyses:

### 3.1 Entity Extraction
```javascript
extractEntities(segment)
```

**Technologies Detected:**
- AI, LLM, Computer Vision, Robotics, Quantum Computing
- AGI, Autonomous Vehicles, Biotech, Neural Networks
- Reinforcement Learning, Generative AI
- Uses keyword matching against predefined technology dictionary

**Companies Detected:**
- Major tech companies: OpenAI, Anthropic, Google, Microsoft, Meta, Apple, Amazon, Tesla, Nvidia
- Pattern matching for company names (e.g., "X Technologies", "Y AI")

**People Detected:**
- Uses NLP library (compromise) to extract person names
- Pattern: `[A-Z][a-z]+ [A-Z][a-z]+` (First Last format)

**Output:**
```javascript
{
  technologies: ["AI", "LLM", "Robotics"],
  companies: ["OpenAI", "Google"],
  people: ["Elon Musk", "Sam Altman"]
}
```

---

### 3.2 Stance Detection
```javascript
analyzeStance(segment, targetTopic)
```

**What it does:**
- Determines speaker's position on a technology: **pro**, **con**, **neutral**, or **mixed**
- Uses keyword-based sentiment analysis

**Pro Indicators:**
- "will revolutionize", "game changer", "breakthrough", "transform"
- "huge potential", "exciting", "amazing", "revolutionary"
- "will change", "next big thing", "promising"

**Con Indicators:**
- "concerned", "worried", "risky", "dangerous", "problematic"
- "overhyped", "not ready", "too early", "challenges"
- "skeptical", "doubt", "uncertain", "risks"

**Output:**
```javascript
{
  stance: "pro" | "con" | "neutral" | "mixed",
  confidence: 0.0-1.0,
  proIndicators: 3,
  conIndicators: 0,
  topic: "AI"
}
```

---

### 3.3 Topic-Aware Stance Detection
```javascript
detectTopicAwareStance(segment, topic)
```

**What it does:**
- More sophisticated stance detection using context
- Analyzes sentences that mention the topic
- Considers surrounding context (100 chars before/after)

**Output:**
```javascript
{
  stance: "pro",
  confidence: 0.85,
  topicSentences: [
    { text: "AI will revolutionize healthcare", stance: "pro" }
  ],
  context: "surrounding text..."
}
```

---

### 3.4 Aspect-Based Sentiment Analysis
```javascript
analyzeAspectSentiment(segment, aspects)
```

**What it does:**
- Analyzes sentiment toward specific aspects:
  - **Regulation**: How they feel about AI regulation
  - **Adoption**: Views on adoption rates
  - **Impact**: Thoughts on societal impact

**Output:**
```javascript
{
  regulation: {
    sentiment: "positive" | "negative" | "neutral",
    score: 2,  // positive = +1, negative = -1
    mentions: 3
  },
  adoption: { ... },
  impact: { ... }
}
```

---

### 3.5 Opinion Mining
```javascript
extractOpinions(segment)
```

**What it does:**
- Extracts statements with opinion verbs:
  - "think", "believe", "feel", "argue", "suggest", "claim", "predict"
- Identifies subjective statements vs. factual statements

**Output:**
```javascript
[
  {
    text: "I think AI will transform healthcare",
    type: "opinion",
    confidence: 0.7
  }
]
```

---

## Step 4: Aggregation & Insight Generation

### 4.1 Aggregate Insights
```javascript
aggregateInsights(analyzedSegments, allStances)
```

**What it does:**
- Groups insights by technology
- Groups insights by speaker
- Calculates stance distributions

**Output:**
```javascript
{
  byTechnology: {
    "AI": {
      pro: 5,
      con: 2,
      neutral: 3,
      mixed: 1,
      segments: [...]
    }
  },
  bySpeaker: {
    "Host": {
      segmentCount: 20,
      technologies: ["AI", "LLM"],
      companies: ["OpenAI"]
    }
  }
}
```

---

### 4.2 Extract Key Quotes
```javascript
extractKeyQuotes(analyzedSegments, technologies)
```

**What it does:**
- Finds high-confidence quotes about each technology
- Prioritizes "pro" stances or high-confidence statements
- Includes speaker attribution and timestamp

**Output:**
```javascript
[
  {
    text: "AI will revolutionize healthcare in the next 5 years...",
    speaker: "Guest",
    technology: "AI",
    stance: "pro",
    confidence: 0.9,
    timestamp: "00:15:30"
  }
]
```

---

### 4.3 Calculate Stance Distribution
```javascript
calculateStanceDistribution(allStances)
```

**Output:**
```javascript
{
  pro: 15,
  con: 5,
  neutral: 10,
  mixed: 3
}
```

---

### 4.4 Calculate Overall Sentiment
```javascript
calculateOverallSentiment(segments)
```

**Output:**
- Score from 0.0 (negative) to 1.0 (positive)
- Based on aspect sentiment scores across all segments

---

## Step 5: Final Output Structure

The processed video generates this structure:

```javascript
{
  id: "podcast_1234567890",
  type: "podcast",
  title: "Video Title",
  content: "Full transcript text...",
  published: "2025-11-23T...",
  source: "YouTube",
  sourceId: "youtube",
  link: "https://www.youtube.com/watch?v=...",
  
  // Extracted entities
  technologies: ["AI", "LLM", "Robotics"],
  companies: ["OpenAI", "Google"],
  industries: ["Healthcare", "Finance"],
  
  // Overall metrics
  sentiment: 0.75,  // 0-1 scale
  confidence: 0.9,
  
  // Detailed metadata
  metadata: {
    segments: [...],  // All analyzed segments
    totalSegments: 150,
    speakers: ["Host", "Guest"],
    duration: 3600,  // seconds
    
    // Aggregated insights
    aggregatedInsights: {
      byTechnology: {...},
      bySpeaker: {...}
    },
    
    // Key quotes (top 10)
    keyQuotes: [
      {
        text: "...",
        speaker: "Guest",
        technology: "AI",
        stance: "pro",
        confidence: 0.9,
        timestamp: "00:15:30"
      }
    ],
    
    // Stance distribution
    stanceDistribution: {
      pro: 15,
      con: 5,
      neutral: 10,
      mixed: 3
    }
  }
}
```

---

## Step 6: Display on Home Page

The `VideoInsightsSection` component:
1. Fetches videos from `/api/channels/:id/videos`
2. For each video, checks if it's been processed
3. If processed, displays:
   - **Technologies Discussed**: List of technologies
   - **Companies Mentioned**: List of companies
   - **Key Insights**: Expandable quotes with speaker, stance, and timestamp
   - **Sentiment Breakdown**: Pro/Con/Neutral/Mixed counts

---

## Processing Flow Diagram

```
YouTube Video
    ↓
Fetch Transcript (youtube-transcript library)
    ↓
Parse into Segments (with speaker labels & timestamps)
    ↓
For Each Segment:
    ├─ Extract Entities (technologies, companies, people)
    ├─ Analyze Stance (pro/con/neutral/mixed)
    ├─ Topic-Aware Stance Detection
    ├─ Aspect Sentiment Analysis
    └─ Extract Opinions
    ↓
Aggregate All Segments:
    ├─ Group by Technology
    ├─ Group by Speaker
    ├─ Extract Key Quotes
    ├─ Calculate Stance Distribution
    └─ Calculate Overall Sentiment
    ↓
Store in Database (podcasts.json)
    ↓
Display on Home Page
```

---

## Key Features

1. **Speaker Attribution**: Knows who said what
2. **Stance Detection**: Understands if speakers are pro/con/neutral
3. **Technology Tracking**: Identifies all technologies discussed
4. **Company Extraction**: Finds all companies mentioned
5. **Key Quote Extraction**: Pulls out the most important statements
6. **Sentiment Analysis**: Overall positive/negative sentiment
7. **Time-Aligned**: Every insight has a timestamp

---

## Current Limitations

1. **Speaker Diarization**: Currently relies on YouTube's auto-generated speaker labels (if available). If not available, all segments are marked as "Unknown"
2. **Keyword-Based**: Entity extraction and stance detection use keyword matching (not deep learning models)
3. **English Only**: Currently only processes English transcripts
4. **Processing Time**: Can take several minutes for long videos (1+ hour)

---

## Future Enhancements

1. **Better Speaker Diarization**: Use ML models for automatic speaker identification
2. **Deep Learning Models**: Replace keyword matching with transformer-based NER and sentiment models
3. **Multi-Language Support**: Process transcripts in multiple languages
4. **Real-Time Processing**: Stream processing for live videos
5. **Visual Analysis**: Extract insights from video frames (not just audio)

---

## API Endpoints

- `POST /api/podcasts/youtube` - Process a YouTube video
- `GET /api/podcasts` - Get all processed podcasts/videos
- `GET /api/channels/:id/videos` - Get videos with insights from a channel
- `GET /api/podcasts/query` - Query stances across videos

---

This pipeline transforms raw video transcripts into structured, queryable insights that power the home page's video insights section!

