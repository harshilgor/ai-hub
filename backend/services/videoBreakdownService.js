/**
 * Video Breakdown Service - Creates detailed breakdowns of video content
 * Extracts deep insights, segments conversations by topic, and structures knowledge
 */

import axios from 'axios';

/**
 * Segment transcript into topic-based conversation segments
 * Uses LLM to identify natural topic shifts and conversation structure
 */
export async function segmentTranscript(transcriptText, videoMetadata = {}) {
  try {
    const aiProvider = process.env.AI_PROVIDER || 'none';
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (aiProvider === 'none' || !apiKey) {
      // Fallback: time-based segmentation
      return segmentByTime(transcriptText);
    }

    console.log(`   Segmenting transcript using ${aiProvider}...`);
    
    // Prepare transcript for LLM (limit to avoid token limits)
    const maxTranscriptLength = 50000; // ~12k tokens
    const truncatedTranscript = transcriptText.length > maxTranscriptLength 
      ? transcriptText.substring(0, maxTranscriptLength) + '... [truncated]'
      : transcriptText;

    const prompt = `You are analyzing a video transcript. Identify natural topic shifts and segment the conversation into meaningful sections.

TRANSCRIPT:
${truncatedTranscript}

VIDEO METADATA:
Title: ${videoMetadata.title || 'Unknown'}
Duration: ${videoMetadata.duration || 'Unknown'}

Analyze the transcript and identify where topics change. Return ONLY valid JSON in this exact format:
{
  "segments": [
    {
      "title": "Short descriptive title for this segment (2-5 words)",
      "startTime": "00:00:00",
      "endTime": "00:05:30",
      "summary": "2-3 sentence summary of what was discussed in this segment",
      "topics": ["topic1", "topic2"],
      "transcriptSnippet": "Key excerpt from transcript (2-3 sentences)"
    }
  ],
  "overallStructure": {
    "intro": "Brief description of introduction",
    "mainTopics": ["Main topic 1", "Main topic 2"],
    "conclusion": "Brief description of conclusion"
  }
}

Focus on identifying where the conversation shifts to new topics, not just time intervals.`;

    let segments = [];
    let overallStructure = {};

    if (aiProvider === 'openai') {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing conversations and identifying topic shifts. Return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      segments = parsed.segments || [];
      overallStructure = parsed.overallStructure || {};
    } else if (aiProvider === 'anthropic') {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const content = response.data.content[0].text;
      const parsed = JSON.parse(content);
      segments = parsed.segments || [];
      overallStructure = parsed.overallStructure || {};
    }

    if (segments.length === 0) {
      console.log(`   ⚠️ LLM segmentation failed, falling back to time-based`);
      return segmentByTime(transcriptText);
    }

    console.log(`   ✅ Segmented into ${segments.length} topic-based segments`);
    return {
      segments,
      overallStructure
    };

  } catch (error) {
    console.error(`   ⚠️ Segmentation error: ${error.message}`);
    console.log(`   Falling back to time-based segmentation`);
    return segmentByTime(transcriptText);
  }
}

/**
 * Fallback: Segment transcript by time intervals
 */
function segmentByTime(transcriptText) {
  const lines = transcriptText.split('\n').filter(line => line.trim());
  const segments = [];
  const segmentDuration = 300; // 5 minutes per segment
  
  let currentSegment = {
    title: 'Introduction',
    startTime: '00:00:00',
    endTime: null,
    summary: '',
    topics: [],
    transcriptSnippet: ''
  };
  
  let segmentStartSeconds = 0;
  let segmentText = [];
  
  lines.forEach((line, index) => {
    // Extract timestamp if present
    const timestampMatch = line.match(/(\d{2}):(\d{2}):(\d{2})/);
    const currentSeconds = timestampMatch 
      ? parseInt(timestampMatch[1]) * 3600 + parseInt(timestampMatch[2]) * 60 + parseInt(timestampMatch[3])
      : segmentStartSeconds + (index * 10);
    
    // Start new segment every 5 minutes
    if (currentSeconds - segmentStartSeconds >= segmentDuration && segmentText.length > 0) {
      currentSegment.endTime = formatTimestamp(segmentStartSeconds);
      currentSegment.transcriptSnippet = segmentText.slice(0, 3).join(' ').substring(0, 200);
      currentSegment.summary = `Discussion from ${currentSegment.startTime} to ${currentSegment.endTime}`;
      segments.push({ ...currentSegment });
      
      segmentStartSeconds = currentSeconds;
      segmentText = [];
      currentSegment = {
        title: `Segment ${segments.length + 1}`,
        startTime: formatTimestamp(segmentStartSeconds),
        endTime: null,
        summary: '',
        topics: [],
        transcriptSnippet: ''
      };
    }
    
    // Extract text (remove timestamp and speaker labels)
    const text = line.replace(/^\d{2}:\d{2}:\d{2}\s*/, '').replace(/\[.*?\]:\s*/, '').trim();
    if (text.length > 20) {
      segmentText.push(text);
    }
  });
  
  // Add final segment
  if (segmentText.length > 0) {
    currentSegment.endTime = formatTimestamp(segmentStartSeconds + segmentDuration);
    currentSegment.transcriptSnippet = segmentText.slice(0, 3).join(' ').substring(0, 200);
    currentSegment.summary = `Discussion from ${currentSegment.startTime} to ${currentSegment.endTime}`;
    segments.push(currentSegment);
  }
  
  return {
    segments,
    overallStructure: {
      intro: 'Introduction segment',
      mainTopics: segments.slice(1, -1).map(s => s.title),
      conclusion: 'Conclusion segment'
    }
  };
}

/**
 * Extract deep insights from a segment
 * Identifies frameworks, tactical advice, trade-offs, personal experiences
 */
export async function extractSegmentInsights(segment, videoMetadata = {}) {
  try {
    const aiProvider = process.env.AI_PROVIDER || 'none';
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (aiProvider === 'none' || !apiKey) {
      // Fallback: basic extraction
      return extractBasicInsights(segment);
    }

    const prompt = `You are analyzing a segment from a video where speakers share knowledge and insights. Extract deep, actionable insights.

SEGMENT:
Title: ${segment.title}
Summary: ${segment.summary}
Transcript: ${segment.transcriptSnippet || segment.transcriptSnippet}

VIDEO CONTEXT:
Title: ${videoMetadata.title || 'Unknown'}
Channel: ${videoMetadata.channel || 'Unknown'}

Extract deep insights from this segment. Focus on:
1. Frameworks, mental models, or step-by-step processes shared
2. Tactical advice or "how-to" recommendations
3. Trade-offs, comparisons, or explanations of why one approach works better
4. Personal experiences, failures, or lessons learned
5. Quantitative claims, metrics, or benchmarks mentioned
6. Nuanced opinions or contrarian views

Return ONLY valid JSON in this exact format:
{
  "insights": [
    {
      "type": "framework" | "tactical_advice" | "tradeoff" | "personal_experience" | "quantitative_claim" | "nuanced_opinion",
      "text": "The actual insight text (1-3 sentences)",
      "depth_score": 0.0-1.0,
      "speaker": "Speaker name if mentioned",
      "timestamp": "00:05:30",
      "context": "Additional context or explanation"
    }
  ],
  "keyTakeaways": [
    "Main takeaway 1",
    "Main takeaway 2"
  ]
}

Only include insights that provide deep knowledge transfer, not surface-level facts.`;

    let insights = [];
    let keyTakeaways = [];

    if (aiProvider === 'openai') {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at extracting deep insights from conversations. Focus on actionable knowledge, not surface facts. Return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      insights = parsed.insights || [];
      keyTakeaways = parsed.keyTakeaways || [];
    } else if (aiProvider === 'anthropic') {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const content = response.data.content[0].text;
      const parsed = JSON.parse(content);
      insights = parsed.insights || [];
      keyTakeaways = parsed.keyTakeaways || [];
    }

    // Score insights by depth
    insights = insights.map(insight => ({
      ...insight,
      depth_score: insight.depth_score || calculateDepthScore(insight)
    }));

    // Filter low-quality insights
    insights = insights.filter(insight => insight.depth_score >= 0.4);

    console.log(`   ✅ Extracted ${insights.length} deep insights from segment`);
    return {
      insights,
      keyTakeaways
    };

  } catch (error) {
    console.error(`   ⚠️ Insight extraction error: ${error.message}`);
    return extractBasicInsights(segment);
  }
}

/**
 * Fallback: Basic insight extraction without LLM
 */
function extractBasicInsights(segment) {
  const insights = [];
  const text = (segment.transcriptSnippet || segment.summary || '').toLowerCase();
  
  // Look for common insight patterns
  const patterns = {
    framework: ['framework', 'model', 'process', 'methodology', 'approach', 'system'],
    tactical_advice: ['should', 'recommend', 'suggest', 'advice', 'tip', 'best practice'],
    tradeoff: ['vs', 'versus', 'better', 'worse', 'trade-off', 'instead of', 'rather than'],
    quantitative_claim: ['percent', '%', 'million', 'billion', 'times', 'x', 'increase', 'decrease']
  };
  
  Object.entries(patterns).forEach(([type, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      insights.push({
        type,
        text: segment.summary || segment.transcriptSnippet,
        depth_score: 0.5,
        speaker: null,
        timestamp: segment.startTime,
        context: null
      });
    }
  });
  
  return {
    insights: insights.slice(0, 3), // Limit to 3 basic insights
    keyTakeaways: [segment.summary]
  };
}

/**
 * Calculate depth score for an insight
 */
function calculateDepthScore(insight) {
  let score = 0.5; // Base score
  
  // Boost for specific types
  if (insight.type === 'framework' || insight.type === 'tactical_advice') {
    score += 0.2;
  }
  
  // Boost for longer, more detailed insights
  if (insight.text && insight.text.length > 100) {
    score += 0.1;
  }
  
  // Boost if context is provided
  if (insight.context) {
    score += 0.1;
  }
  
  // Boost for quantitative claims
  if (insight.type === 'quantitative_claim') {
    score += 0.1;
  }
  
  return Math.min(1.0, score);
}

/**
 * Generate complete breakdown for a video
 */
export async function generateVideoBreakdown(videoId, transcriptText, videoMetadata = {}) {
  try {
    console.log(`📊 Generating breakdown for video ${videoId}...`);
    
    // Step 1: Segment transcript
    const segmentation = await segmentTranscript(transcriptText, videoMetadata);
    
    // Step 2: Extract insights from each segment
    const segmentsWithInsights = [];
    
    for (const segment of segmentation.segments) {
      console.log(`   Processing segment: ${segment.title}`);
      const insightData = await extractSegmentInsights(segment, videoMetadata);
      
      segmentsWithInsights.push({
        ...segment,
        insights: insightData.insights,
        keyTakeaways: insightData.keyTakeaways
      });
      
      // Rate limiting between segments
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Step 3: Generate overall summary
    const overallSummary = {
      totalSegments: segmentsWithInsights.length,
      totalInsights: segmentsWithInsights.reduce((sum, s) => sum + s.insights.length, 0),
      mainTopics: segmentation.overallStructure.mainTopics || [],
      structure: segmentation.overallStructure
    };
    
    const breakdown = {
      videoId,
      segments: segmentsWithInsights,
      overallSummary,
      generatedAt: new Date().toISOString(),
      metadata: videoMetadata
    };
    
    console.log(`✅ Generated breakdown: ${segmentsWithInsights.length} segments, ${overallSummary.totalInsights} insights`);
    return breakdown;
    
  } catch (error) {
    console.error(`❌ Error generating breakdown: ${error.message}`);
    return null;
  }
}

/**
 * Format timestamp from seconds to HH:MM:SS
 */
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

