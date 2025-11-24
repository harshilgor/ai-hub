/**
 * Enhanced Podcast Insights Generator
 * Features:
 * 1. Speaker Diarization & Transcription
 * 2. Per-Speaker NLP Analysis (Stance Detection, Sentiment)
 * 3. Topic and Industry Targeting (NER, Topic-Aware Stance)
 * 4. Aggregation & Visualization Support
 */

import axios from 'axios';
import nlp from 'compromise';
import FormData from 'form-data';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import YoutubeTranscript from 'youtube-transcript';

const execAsync = promisify(exec);

// ============================================
// 1. SPEAKER DIARIZATION & TRANSCRIPTION
// ============================================

/**
 * Parse time-aligned transcript with speaker labels
 * Format: "00:00:15 [Speaker 1]: Hello and welcome..."
 * Or: "00:00:15 Speaker 1: Hello and welcome..."
 */
export function parseDiarizedTranscript(transcriptText) {
  const segments = [];
  
  if (!transcriptText || transcriptText.trim().length === 0) {
    console.warn('⚠️ Empty transcript text provided');
    return segments;
  }
  
  const lines = transcriptText.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.warn('⚠️ No lines found in transcript');
    return segments;
  }
  
  const timestampPattern = /(\d{2}):(\d{2}):(\d{2})/;
  const speakerPatterns = [
    /\[([^\]]+)\]:/,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?):/,
    /Speaker\s+(\d+):/i
  ];
  
  let segmentCount = 0;
  lines.forEach((line, index) => {
    const timestampMatch = line.match(timestampPattern);
    let speaker = 'Unknown';
    let speakerMatch = null;
    
    // Try to find speaker
    for (const pattern of speakerPatterns) {
      speakerMatch = line.match(pattern);
      if (speakerMatch) {
        speaker = normalizeSpeakerName(speakerMatch[1]);
        break;
      }
    }
    
    // Extract text after speaker label or timestamp
    let textStart = 0;
    if (timestampMatch) {
      textStart = timestampMatch.index + timestampMatch[0].length;
    }
    if (speakerMatch) {
      textStart = Math.max(textStart, speakerMatch.index + speakerMatch[0].length);
    }
    
    let text = line.substring(textStart).trim();
    
    // Clean up text (remove leading dashes, bullets, etc.)
    text = text.replace(/^[-•]\s*/, '').trim();
    
    if (text.length > 10) { // Minimum segment length
      const timestamp = timestampMatch ? timestampMatch[0] : null;
      const startTime = timestamp ? parseTimestamp(timestamp) : (segmentCount * 10); // Fallback: 10s per segment
      
      segments.push({
        index,
        timestamp: timestamp || `${Math.floor(startTime / 3600).toString().padStart(2, '0')}:${Math.floor((startTime % 3600) / 60).toString().padStart(2, '0')}:${(startTime % 60).toString().padStart(2, '0')}`,
        speaker: speaker,
        text,
        startTime
      });
      segmentCount++;
    }
  });
  
  console.log(`📝 Parsed ${segments.length} segments from transcript (${lines.length} lines)`);
  
  // If no segments found with timestamps, try to parse as plain text with line breaks
  if (segments.length === 0 && lines.length > 0) {
    console.log('⚠️ No timestamped segments found, treating each substantial line as a segment');
    lines.forEach((line, index) => {
      const text = line.trim();
      if (text.length > 10) { // Only include substantial lines
        const startTime = index * 10; // 10 seconds per segment
        segments.push({
          index,
          timestamp: `${Math.floor(startTime / 3600).toString().padStart(2, '0')}:${Math.floor((startTime % 3600) / 60).toString().padStart(2, '0')}:${(startTime % 60).toString().padStart(2, '0')}`,
          speaker: 'Speaker',
          text,
          startTime
        });
      }
    });
    console.log(`📝 Created ${segments.length} segments from plain text lines`);
  }
  
  // Final fallback: if still no segments, treat entire text as one segment
  if (segments.length === 0 && transcriptText.trim().length > 0) {
    console.log('⚠️ No segments created, treating entire transcript as single segment');
    segments.push({
      index: 0,
      timestamp: '00:00:00',
      speaker: 'Unknown',
      text: transcriptText.trim(),
      startTime: 0
    });
  }
  
  return segments;
}

/**
 * Normalize speaker names (handle variations)
 */
function normalizeSpeakerName(speaker) {
  // Common patterns
  const patterns = {
    'Host': ['host', 'interviewer', 'moderator', 'speaker 1'],
    'Guest': ['guest', 'interviewee', 'speaker 2']
  };
  
  const lower = speaker.toLowerCase().trim();
  for (const [normalized, variants] of Object.entries(patterns)) {
    if (variants.some(v => lower.includes(v))) {
      return normalized;
    }
  }
  
  // Return capitalized version
  return speaker.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Parse timestamp string to seconds
 */
function parseTimestamp(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// ============================================
// 2. PER-SPEAKER NLP ANALYSIS
// ============================================

/**
 * Analyze stance for each speaker segment
 * Stance: pro, con, neutral, mixed
 */
export async function analyzeStance(segment, targetTopic) {
  const text = segment.text.toLowerCase();
  const topicLower = targetTopic.toLowerCase();
  
  // Check if segment mentions the topic
  if (!text.includes(topicLower)) {
    return { stance: 'neutral', confidence: 0, reason: 'Topic not mentioned' };
  }
  
  // Pro indicators
  const proIndicators = [
    'will revolutionize', 'game changer', 'breakthrough', 'transform',
    'huge potential', 'exciting', 'amazing', 'incredible', 'revolutionary',
    'will change', 'going to be big', 'next big thing', 'promising',
    'enormous', 'tremendous', 'massive', 'significant', 'major',
    'will dominate', 'will take over', 'future', 'inevitable'
  ];
  
  // Con indicators
  const conIndicators = [
    'concerned', 'worried', 'risky', 'dangerous', 'problematic',
    'overhyped', 'not ready', 'too early', 'challenges', 'limitations',
    'skeptical', 'doubt', 'uncertain', 'risks', 'threat', 'danger',
    'worrying', 'problem', 'issue', 'concern', 'fear'
  ];
  
  // Neutral/mixed indicators
  const neutralIndicators = [
    'interesting', 'we\'ll see', 'time will tell', 'depends',
    'both sides', 'pros and cons', 'advantages and disadvantages',
    'could be', 'might be', 'possibly', 'perhaps'
  ];
  
  const proCount = proIndicators.filter(ind => text.includes(ind)).length;
  const conCount = conIndicators.filter(ind => text.includes(ind)).length;
  const neutralCount = neutralIndicators.filter(ind => text.includes(ind)).length;
  
  let stance = 'neutral';
  let confidence = 0.5;
  
  if (proCount > conCount && proCount > 0) {
    stance = 'pro';
    confidence = Math.min(0.9, 0.5 + (proCount * 0.1));
  } else if (conCount > proCount && conCount > 0) {
    stance = 'con';
    confidence = Math.min(0.9, 0.5 + (conCount * 0.1));
  } else if (proCount > 0 && conCount > 0) {
    stance = 'mixed';
    confidence = 0.6;
  } else if (neutralCount > 0) {
    stance = 'neutral';
    confidence = 0.7;
  }
  
  return {
    stance,
    confidence,
    proIndicators: proCount,
    conIndicators: conCount,
    topic: targetTopic
  };
}

/**
 * Aspect-based sentiment analysis
 * Analyzes sentiment toward specific aspects (regulation, adoption, etc.)
 */
export function analyzeAspectSentiment(segment, aspects = ['regulation', 'adoption', 'impact']) {
  const text = segment.text.toLowerCase();
  const results = {};
  
  aspects.forEach(aspect => {
    if (text.includes(aspect)) {
      // Extract sentences mentioning the aspect
      const sentences = segment.text.split(/[.!?]+/).filter(s => 
        s.toLowerCase().includes(aspect)
      );
      
      // Simple sentiment scoring
      const positiveWords = ['good', 'positive', 'beneficial', 'support', 'favor', 'great', 'excellent', 'wonderful'];
      const negativeWords = ['bad', 'negative', 'harmful', 'oppose', 'against', 'terrible', 'awful', 'worst'];
      
      let score = 0;
      sentences.forEach(sentence => {
        const lower = sentence.toLowerCase();
        positiveWords.forEach(word => {
          if (lower.includes(word)) score += 1;
        });
        negativeWords.forEach(word => {
          if (lower.includes(word)) score -= 1;
        });
      });
      
      results[aspect] = {
        sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
        score,
        mentions: sentences.length
      };
    }
  });
  
  return results;
}

/**
 * Extract opinion mining - nuanced views
 */
export function extractOpinions(segment) {
  const opinions = [];
  
  // Extract statements with opinion verbs
  const opinionVerbs = ['think', 'believe', 'feel', 'argue', 'suggest', 'claim', 'say', 'predict', 'forecast'];
  const sentences = segment.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase();
    if (opinionVerbs.some(verb => lower.includes(verb))) {
      opinions.push({
        text: sentence.trim(),
        type: 'opinion',
        confidence: 0.7
      });
    }
  });
  
  return opinions;
}

// ============================================
// 3. TOPIC & INDUSTRY TARGETING
// ============================================

/**
 * Named Entity Recognition for technologies and companies
 */
export async function extractEntities(segment) {
  const text = segment.text;
  
  // Technology keywords (expandable)
  const techKeywords = {
    'AI': ['artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning'],
    'LLM': ['large language model', 'llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'llama', 'gpt-4', 'gpt-3'],
    'Computer Vision': ['computer vision', 'cv', 'image recognition', 'visual ai', 'image processing'],
    'Robotics': ['robot', 'robotics', 'robotic', 'autonomous robot', 'robotic system'],
    'Quantum': ['quantum computing', 'quantum', 'qubit', 'quantum computer'],
    'AGI': ['artificial general intelligence', 'agi', 'general ai', 'general artificial intelligence'],
    'Autonomous Vehicles': ['self-driving', 'autonomous vehicle', 'autonomous car', 'self-driving car', 'autonomous driving'],
    'Biotech': ['biotechnology', 'gene editing', 'crispr', 'synthetic biology', 'bioengineering'],
    'Neural Networks': ['neural network', 'neural net', 'deep neural network', 'cnn', 'rnn', 'transformer'],
    'Reinforcement Learning': ['reinforcement learning', 'rl', 'q-learning', 'policy gradient'],
    'Generative AI': ['generative ai', 'generative model', 'gan', 'diffusion model', 'stable diffusion']
  };
  
  // Company patterns
  const companyPatterns = [
    /\b(OpenAI|Anthropic|Google|Microsoft|Meta|Apple|Amazon|Tesla|Nvidia|AMD|Intel)\b/gi,
    /\b([A-Z][a-z]+ (?:Technologies|AI|Systems|Labs|Inc|Corp|LLC))\b/g
  ];
  
  const technologies = [];
  const companies = [];
  
  // Extract technologies
  const lowerText = text.toLowerCase();
  Object.entries(techKeywords).forEach(([tech, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      technologies.push(tech);
    }
  });
  
  // Extract companies
  companyPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      companies.push(...matches.map(m => m.trim()));
    }
  });
  
  return {
    technologies: [...new Set(technologies)],
    companies: [...new Set(companies)],
    people: extractPeople(text)
  };
}

/**
 * Extract people names (simplified using compromise)
 */
function extractPeople(text) {
  try {
    const doc = nlp(text);
    const people = doc.people().out('array');
    return people.filter(p => p.length > 2 && p.length < 50);
  } catch (error) {
    // Fallback: simple pattern matching
    const namePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    const matches = text.match(namePattern);
    return matches ? [...new Set(matches)] : [];
  }
}

/**
 * Topic-aware stance detection
 * Uses context around topic mentions to determine stance
 */
export async function detectTopicAwareStance(segment, topic) {
  const topicLower = topic.toLowerCase();
  const sentences = segment.text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Find sentences mentioning the topic
  const topicSentences = sentences.filter(s => 
    s.toLowerCase().includes(topicLower)
  );
  
  if (topicSentences.length === 0) {
    return null;
  }
  
  // Analyze each sentence for stance
  const stances = [];
  for (const sentence of topicSentences) {
    const stance = await analyzeStance({ text: sentence }, topic);
    stances.push(stance);
  }
  
  // Aggregate stances
  const stanceCounts = { pro: 0, con: 0, neutral: 0, mixed: 0 };
  stances.forEach(s => {
    if (s.stance && stanceCounts[s.stance] !== undefined) {
      stanceCounts[s.stance]++;
    }
  });
  
  const dominantStance = Object.entries(stanceCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  const maxConfidence = Math.max(...stances.map(s => s.confidence || 0));
  
  return {
    stance: dominantStance,
    confidence: maxConfidence,
    topicSentences: topicSentences.map((s, i) => ({
      text: s.trim(),
      stance: stances[i]?.stance || 'neutral'
    })),
    context: segment.text.substring(
      Math.max(0, segment.text.indexOf(topicSentences[0]) - 100),
      Math.min(segment.text.length, segment.text.indexOf(topicSentences[topicSentences.length - 1]) + topicSentences[topicSentences.length - 1].length + 100)
    )
  };
}

// ============================================
// 4. AGGREGATION & PROCESSING
// ============================================

/**
 * Generate a summary of the video based on transcript and insights
 */
async function generateVideoSummary(transcriptText, context = {}) {
  try {
    const { title, technologies, companies, keyQuotes, sentiment } = context;
    
    // Try to use OpenAI if available for better summaries
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    
    if (openaiApiKey) {
      try {
        // Create a condensed version of the transcript (first 4000 chars for context)
        const transcriptPreview = transcriptText.substring(0, 4000);
        
        const summaryPrompt = `Generate a concise 2-3 sentence summary of this YouTube video transcript. 

Video Title: ${title || 'Untitled'}
Technologies Discussed: ${technologies?.join(', ') || 'Various'}
Companies Mentioned: ${companies?.join(', ') || 'Various'}

Transcript Preview:
${transcriptPreview}...

Key Points from the discussion:
${keyQuotes?.map((q, i) => `${i + 1}. ${q.text.substring(0, 150)}`).join('\n') || 'Various topics discussed'}

Write a clear, engaging summary that captures the main themes and insights from this video. Focus on what makes this discussion valuable or interesting. Keep it to 2-3 sentences maximum.`;

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at creating concise, engaging summaries of video content. Always write clear, informative summaries in 2-3 sentences.'
              },
              {
                role: 'user',
                content: summaryPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 200
          },
          {
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        
        if (response.data?.choices?.[0]?.message?.content) {
          const summary = response.data.choices[0].message.content.trim();
          console.log(`   ✅ Generated AI summary (${summary.length} chars)`);
          return summary;
        }
      } catch (openaiError) {
        console.log(`   ⚠️ OpenAI summary generation failed: ${openaiError.message}`);
        // Fall through to simple summary
      }
    }
    
    // Fallback: Generate a simple summary from available data
    let summary = '';
    
    if (title) {
      summary += `This video "${title}"`;
    } else {
      summary += 'This video';
    }
    
    if (technologies && technologies.length > 0) {
      summary += ` explores ${technologies.slice(0, 3).join(', ')}`;
      if (technologies.length > 3) {
        summary += ` and ${technologies.length - 3} other technologies`;
      }
    }
    
    if (companies && companies.length > 0) {
      summary += `, discussing companies like ${companies.slice(0, 2).join(' and ')}`;
    }
    
    if (keyQuotes && keyQuotes.length > 0) {
      const mainQuote = keyQuotes[0];
      summary += `. Key insights include discussions about ${mainQuote.technology || 'various topics'}`;
      if (sentiment && sentiment.overall !== 'neutral') {
        summary += ` with a ${sentiment.overall} sentiment`;
      }
    } else {
      summary += `, covering important topics and insights`;
    }
    
    summary += '.';
    
    console.log(`   ✅ Generated simple summary (${summary.length} chars)`);
    return summary;
    
  } catch (error) {
    console.error(`   ⚠️ Summary generation failed: ${error.message}`);
    // Return a basic fallback summary
    return `This video discusses ${context.technologies?.length || 0} technologies and ${context.companies?.length || 0} companies, providing insights and analysis on the topics covered.`;
  }
}

/**
 * Process complete podcast transcript with all analyses
 */
export async function processPodcastTranscript(transcriptText, metadata = {}) {
  try {
    console.log(`📊 Processing podcast transcript (${transcriptText?.length || 0} characters)...`);
    
    // 1. Parse diarized transcript
    const segments = parseDiarizedTranscript(transcriptText);
    
    if (segments.length === 0) {
      console.error('❌ No segments found in transcript after parsing.');
      console.error('   Transcript preview:', transcriptText?.substring(0, 500));
      return null;
    }
    
    console.log(`✅ Parsed ${segments.length} segments successfully`);
    
    // 2. Analyze each segment
    const analyzedSegments = [];
    const allTechnologies = new Set();
    const allCompanies = new Set();
    const allStances = [];
    
    console.log(`📊 Analyzing ${segments.length} segments...`);
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Extract entities
      const entities = await extractEntities(segment);
      entities.technologies.forEach(t => allTechnologies.add(t));
      entities.companies.forEach(c => allCompanies.add(c));
      
      // Analyze stances for each technology mentioned
      const segmentStances = {};
      for (const tech of entities.technologies) {
        const stance = await analyzeStance(segment, tech);
        const topicStance = await detectTopicAwareStance(segment, tech);
        
        segmentStances[tech] = {
          basic: stance,
          topicAware: topicStance
        };
        
        allStances.push({
          technology: tech,
          stance: stance.stance,
          confidence: stance.confidence,
          speaker: segment.speaker,
          segment: segment.text.substring(0, 200)
        });
      }
      
      // Aspect sentiment
      const aspectSentiment = analyzeAspectSentiment(segment);
      
      // Extract opinions
      const opinions = extractOpinions(segment);
      
      analyzedSegments.push({
        ...segment,
        entities,
        stances: segmentStances,
        aspectSentiment,
        opinions
      });
      
      // Log progress every 10 segments
      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${segments.length} segments...`);
      }
    }
    
    // 3. Aggregate insights
    const aggregatedInsights = aggregateInsights(analyzedSegments, allStances);
    
    // 4. Extract key quotes
    const keyQuotes = extractKeyQuotes(analyzedSegments, allTechnologies);
    
    // 5. Generate summary
    console.log(`📝 Generating summary for video...`);
    const summary = await generateVideoSummary(transcriptText, {
      title: metadata.title || 'Video',
      technologies: Array.from(allTechnologies),
      companies: Array.from(allCompanies),
      keyQuotes: keyQuotes.slice(0, 3), // Use top 3 quotes
      sentiment: calculateOverallSentiment(analyzedSegments)
    });
    console.log(`✅ Summary generated: ${summary.substring(0, 100)}...`);
    
    const result = {
      id: metadata.id || `podcast_${Date.now()}`,
      type: 'podcast',
      title: metadata.title || 'Podcast Episode',
      content: transcriptText,
      published: metadata.published || new Date().toISOString(),
      source: metadata.source || 'Podcast',
      sourceId: metadata.sourceId || 'podcast',
      link: metadata.link || '',
      technologies: Array.from(allTechnologies),
      companies: Array.from(allCompanies),
      industries: extractIndustries(transcriptText),
      sentiment: calculateOverallSentiment(analyzedSegments),
      confidence: allTechnologies.size > 0 ? 0.9 : 0.5,
      metadata: {
        segments: analyzedSegments.map(s => ({
          index: s.index,
          timestamp: s.timestamp,
          speaker: s.speaker,
          text: s.text.substring(0, 500), // Limit text size for storage
          entities: s.entities,
          stances: s.stances,
          aspectSentiment: s.aspectSentiment
        })),
        totalSegments: segments.length,
        speakers: [...new Set(segments.map(s => s.speaker))],
        duration: segments.length > 0 ? segments[segments.length - 1].startTime : 0,
        episode: metadata.episode || '',
        podcast: metadata.podcast || '',
        aggregatedInsights,
        keyQuotes,
        stanceDistribution: calculateStanceDistribution(allStances),
        summary: summary
      }
    };
    
    console.log(`✅ Processed podcast: ${result.title}`);
    console.log(`   Technologies: ${result.technologies.length}`);
    console.log(`   Companies: ${result.companies.length}`);
    console.log(`   Key Quotes: ${keyQuotes.length}`);
    console.log(`   Summary: ${result.metadata.summary ? '✅ Generated' : '❌ Missing'}`);
    if (result.metadata.summary) {
      console.log(`   Summary preview: ${result.metadata.summary.substring(0, 150)}...`);
    }
    
    return result;
  } catch (error) {
    console.error('Error processing podcast transcript:', error.message);
    console.error(error.stack);
    return null;
  }
}

/**
 * Aggregate insights across all segments
 */
function aggregateInsights(segments, allStances) {
  const insights = {
    byTechnology: {},
    bySpeaker: {},
    overall: {
      totalSegments: segments.length,
      technologies: new Set(),
      companies: new Set()
    }
  };
  
  // Group by technology
  allStances.forEach(stance => {
    if (!insights.byTechnology[stance.technology]) {
      insights.byTechnology[stance.technology] = {
        pro: 0,
        con: 0,
        neutral: 0,
        mixed: 0,
        segments: []
      };
    }
    if (insights.byTechnology[stance.technology][stance.stance] !== undefined) {
      insights.byTechnology[stance.technology][stance.stance]++;
    }
    insights.byTechnology[stance.technology].segments.push(stance);
  });
  
  // Group by speaker
  segments.forEach(segment => {
    if (!insights.bySpeaker[segment.speaker]) {
      insights.bySpeaker[segment.speaker] = {
        segmentCount: 0,
        technologies: new Set(),
        companies: new Set()
      };
    }
    insights.bySpeaker[segment.speaker].segmentCount++;
    segment.entities.technologies.forEach(t => 
      insights.bySpeaker[segment.speaker].technologies.add(t)
    );
    segment.entities.companies.forEach(c => 
      insights.bySpeaker[segment.speaker].companies.add(c)
    );
  });
  
  // Convert Sets to Arrays for JSON serialization
  Object.keys(insights.bySpeaker).forEach(key => {
    insights.bySpeaker[key].technologies = Array.from(insights.bySpeaker[key].technologies);
    insights.bySpeaker[key].companies = Array.from(insights.bySpeaker[key].companies);
  });
  
  return insights;
}

/**
 * Extract key quotes with speaker attribution
 */
function extractKeyQuotes(segments, technologies) {
  const quotes = [];
  
  technologies.forEach(tech => {
    const techSegments = segments.filter(s => 
      s.entities.technologies.includes(tech)
    );
    
    techSegments.forEach(segment => {
      const stance = segment.stances[tech];
      if (stance && (stance.basic.stance === 'pro' || stance.basic.confidence > 0.7)) {
        quotes.push({
          text: segment.text.substring(0, 300),
          speaker: segment.speaker,
          technology: tech,
          stance: stance.basic.stance,
          confidence: stance.basic.confidence,
          timestamp: segment.timestamp
        });
      }
    });
  });
  
  // Sort by confidence and return top 10
  return quotes.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

/**
 * Calculate stance distribution
 */
function calculateStanceDistribution(allStances) {
  const distribution = { pro: 0, con: 0, neutral: 0, mixed: 0 };
  allStances.forEach(s => {
    if (distribution[s.stance] !== undefined) {
      distribution[s.stance]++;
    }
  });
  return distribution;
}

/**
 * Calculate overall sentiment
 */
function calculateOverallSentiment(segments) {
  let totalScore = 0;
  let count = 0;
  
  segments.forEach(segment => {
    Object.values(segment.aspectSentiment).forEach(aspect => {
      totalScore += aspect.score;
      count++;
    });
  });
  
  if (count === 0) return 0.5;
  return Math.max(0, Math.min(1, 0.5 + (totalScore / count) * 0.1));
}

/**
 * Extract industries from transcript
 */
function extractIndustries(text) {
  const industries = [];
  const industryKeywords = {
    'Healthcare': ['healthcare', 'medical', 'health', 'hospital', 'medicine'],
    'Finance': ['finance', 'financial', 'banking', 'fintech', 'investment'],
    'Education': ['education', 'learning', 'teaching', 'school', 'university'],
    'Entertainment': ['entertainment', 'gaming', 'media', 'content', 'streaming'],
    'Transportation': ['transportation', 'logistics', 'shipping', 'delivery', 'transport'],
    'Energy': ['energy', 'renewable', 'solar', 'wind', 'power', 'electricity'],
    'Manufacturing': ['manufacturing', 'production', 'factory', 'industrial'],
    'Retail': ['retail', 'e-commerce', 'shopping', 'commerce']
  };
  
  const lower = text.toLowerCase();
  Object.entries(industryKeywords).forEach(([industry, keywords]) => {
    if (keywords.some(keyword => lower.includes(keyword))) {
      industries.push(industry);
    }
  });
  
  return industries;
}

// ============================================
// 5. YOUTUBE TRANSCRIPT INTEGRATION
// ============================================

// Cache for transcript availability to avoid repeated failed attempts
// Maps videoId -> { available: boolean, timestamp: number }
const transcriptAvailabilityCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if video has captions available (using cache)
 * Exported so it can be used in server.js to skip processing
 */
export function isCachedAsUnavailable(videoId) {
  const cached = transcriptAvailabilityCache.get(videoId);
  if (!cached) return false;
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_DURATION) {
    transcriptAvailabilityCache.delete(videoId);
    return false;
  }
  return !cached.available;
}

/**
 * Fetch transcript using youtube-transcript library (Method 1 - Fastest)
 * This directly extracts captions from YouTube if available
 */
async function fetchTranscriptViaLibrary(videoId) {
  try {
    console.log(`   Trying youtube-transcript library...`);
    
    // Try multiple language options
    const languages = ['en', 'en-US', 'en-GB'];
    let transcriptItems = null;
    let lastError = null;
    
    for (const lang of languages) {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: lang
        });
        if (transcriptItems && transcriptItems.length > 0) {
          console.log(`   Found transcript in language: ${lang}`);
          break;
        }
      } catch (langError) {
        lastError = langError;
        // Try next language
        continue;
      }
    }
    
    // If all languages failed, try without language specification (auto-detect)
    if (!transcriptItems || transcriptItems.length === 0) {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      } catch (autoError) {
        lastError = autoError;
      }
    }
    
    if (!transcriptItems || transcriptItems.length === 0) {
      if (lastError) {
        const errorMsg = lastError.message || lastError.toString();
        if (errorMsg.includes('Transcript is disabled') || 
            errorMsg.includes('Could not retrieve a transcript') ||
            errorMsg.includes('No transcript found') ||
            errorMsg.includes('Transcript not available')) {
          console.log(`   Transcript not available via library (captions may be disabled)`);
        } else {
          console.log(`   youtube-transcript library failed: ${errorMsg.substring(0, 150)}`);
        }
      }
      return null;
    }
    
    // Convert to diarized format with timestamps
    // youtube-transcript library returns items with: { text, offset (ms), duration (ms) }
    let diarizedText = '';
    transcriptItems.forEach(item => {
      // Handle different possible formats
      let startMs = 0;
      if (item.offset !== undefined) {
        startMs = item.offset; // Already in milliseconds
      } else if (item.start !== undefined) {
        // If start is in seconds, convert to milliseconds
        startMs = typeof item.start === 'number' ? item.start * 1000 : 0;
      }
      
      const text = item.text || '';
      
      if (text && text.trim()) {
        const timestamp = formatTimestamp(startMs);
        diarizedText += `${timestamp} [Speaker]: ${text.trim()}\n`;
      }
    });
    
    if (diarizedText.trim()) {
      console.log(`   ✅ Successfully fetched transcript via youtube-transcript library (${transcriptItems.length} segments)`);
      return diarizedText;
    }
    
    return null;
  } catch (error) {
    // This is expected if video doesn't have captions
    const errorMsg = error.message || error.toString();
    if (errorMsg.includes('Transcript is disabled') || 
        errorMsg.includes('Could not retrieve a transcript') ||
        errorMsg.includes('No transcript found') ||
        errorMsg.includes('Transcript not available')) {
      console.log(`   Transcript not available via library (captions may be disabled)`);
      return null;
    }
    
    // Log other errors but don't fail - we'll try other methods
    console.log(`   youtube-transcript library failed: ${errorMsg.substring(0, 150)}`);
    return null;
  }
}

/**
 * Download audio from YouTube using yt-dlp (more reliable than ytdl-core)
 * @param {string} videoId - YouTube video ID
 * @param {string} outputPath - Path where audio file should be saved
 * @returns {Promise<{success: boolean, duration?: number, filePath?: string, error?: string}>}
 */
async function downloadAudioWithYtDlp(videoId, outputPath) {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`   Downloading audio using yt-dlp...`);
    
    // First, get video info to check duration
    const infoCommand = `yt-dlp --dump-json --extractor-args "youtube:player_client=default" "${videoUrl}"`;
    let videoInfo;
    try {
      const { stdout } = await execAsync(infoCommand, { timeout: 30000 });
      videoInfo = JSON.parse(stdout);
    } catch (error) {
      console.log(`   ⚠️ Could not get video info: ${error.message}`);
      // Continue anyway - we'll try to download
    }
    
    // Check duration if we got video info
    if (videoInfo && videoInfo.duration) {
      const duration = videoInfo.duration;
      if (duration > 7200) {
        console.log(`   ⚠️ Video is too long (${Math.floor(duration / 60)} minutes), skipping`);
        return { success: false, error: 'Video too long' };
      }
    }
    
    // Download audio using yt-dlp
    // -x: extract audio only
    // --audio-format mp3: convert to MP3
    // --audio-quality 0: best quality
    // --no-playlist: don't download playlists
    // --extractor-args: use default player client to avoid JS runtime requirement
    const downloadCommand = `yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist --extractor-args "youtube:player_client=default" -o "${outputPath}" "${videoUrl}"`;
    
    await execAsync(downloadCommand, { timeout: 600000 }); // 10 minute timeout
    
    // Check if file was created (yt-dlp adds .mp3 extension)
    const actualPath = outputPath.replace('%(ext)s', 'mp3');
    let finalPath = actualPath;
    
    // Try to find the file with mp3 extension
    try {
      await fs.access(actualPath);
      finalPath = actualPath;
    } catch {
      // Try without extension pattern
      const basePath = outputPath.replace('%(ext)s', '');
      const possiblePaths = [
        `${basePath}.mp3`,
        `${basePath}.m4a`,
        `${basePath}.webm`,
        `${basePath}.opus`
      ];
      
      for (const testPath of possiblePaths) {
        try {
          await fs.access(testPath);
          finalPath = testPath;
          break;
        } catch {
          continue;
        }
      }
    }
    
    // Verify file exists and has content
    const stats = await fs.stat(finalPath);
    if (stats.size === 0) {
      throw new Error('Downloaded audio file is empty');
    }
    
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`   ✅ Audio downloaded successfully (${fileSizeMB.toFixed(2)} MB)`);
    
    return {
      success: true,
      filePath: finalPath,
      duration: videoInfo?.duration
    };
    
  } catch (error) {
    const errorMsg = error.message || error.toString();
    
    // Provide helpful error messages
    if (errorMsg.includes('Video unavailable') || errorMsg.includes('Private video')) {
      console.log(`   ⚠️ Video unavailable or private`);
      return { success: false, error: 'Video unavailable' };
    } else if (errorMsg.includes('Sign in to confirm your age') || errorMsg.includes('age-restricted')) {
      console.log(`   ⚠️ Age-restricted video`);
      return { success: false, error: 'Age-restricted' };
    } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
      console.log(`   ⚠️ YouTube blocked download (403 Forbidden)`);
      return { success: false, error: '403 Forbidden' };
    } else if (errorMsg.includes('429')) {
      console.log(`   ⚠️ Rate limited by YouTube`);
      return { success: false, error: 'Rate limited' };
    } else {
      console.error(`   ❌ yt-dlp download failed: ${errorMsg.substring(0, 200)}`);
      return { success: false, error: errorMsg };
    }
  }
}

/**
 * Split audio file into chunks using ffmpeg
 * Each chunk will be approximately targetSizeMB (default 20MB to stay under 25MB limit)
 * @param {string} audioPath - Path to the audio file
 * @param {number} targetSizeMB - Target size per chunk in MB (default 20MB)
 * @returns {Promise<Array<{path: string, startTime: number, duration: number}>>}
 */
async function splitAudioIntoChunks(audioPath, targetSizeMB = 20) {
  try {
    // Get audio file info using ffprobe
    const probeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${audioPath}"`;
    const { stdout: probeOutput } = await execAsync(probeCommand);
    const audioInfo = JSON.parse(probeOutput);
    
    // Get duration and bitrate
    const duration = parseFloat(audioInfo.format.duration || 0);
    
    // Try to get bitrate from format or audio stream
    let bitrate = parseFloat(audioInfo.format.bit_rate || 0);
    if (!bitrate && audioInfo.streams) {
      const audioStream = audioInfo.streams.find(s => s.codec_type === 'audio');
      if (audioStream && audioStream.bit_rate) {
        bitrate = parseFloat(audioStream.bit_rate);
      }
    }
    
    // If bitrate not found, estimate based on file size and duration
    if (!bitrate || bitrate === 0) {
      const stats = await fs.stat(audioPath);
      const fileSizeBytes = stats.size;
      bitrate = (fileSizeBytes * 8) / duration; // bits per second
      console.log(`   ⚠️ Bitrate not found in metadata, estimated: ${Math.round(bitrate / 1000)} kbps`);
    }
    
    // Use a conservative bitrate estimate (128kbps) if still not available
    if (!bitrate || bitrate === 0 || isNaN(bitrate)) {
      bitrate = 128000; // 128kbps default
      console.log(`   ⚠️ Using default bitrate: 128 kbps`);
    }
    
    // Calculate chunk duration (in seconds) to achieve target size
    // Size (MB) = (bitrate (bps) * duration (s)) / (8 * 1024 * 1024)
    // duration (s) = (Size (MB) * 8 * 1024 * 1024) / bitrate (bps)
    const chunkDurationSeconds = (targetSizeMB * 8 * 1024 * 1024) / bitrate;
    
    // Calculate number of chunks needed
    const numChunks = Math.ceil(duration / chunkDurationSeconds);
    
    console.log(`   📦 Audio file is large, splitting into ${numChunks} chunks`);
    console.log(`   Duration: ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`);
    console.log(`   Bitrate: ${Math.round(bitrate / 1000)} kbps`);
    console.log(`   Chunk duration: ~${Math.floor(chunkDurationSeconds / 60)}:${String(Math.floor(chunkDurationSeconds % 60)).padStart(2, '0')} per chunk`);
    
    const chunks = [];
    const baseName = audioPath.replace(/\.[^/.]+$/, ''); // Remove extension
    
    // Split audio into chunks
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDurationSeconds;
      const chunkDuration = Math.min(chunkDurationSeconds, duration - startTime);
      
      if (chunkDuration <= 0) break;
      
      // Always output as MP3 to ensure Whisper compatibility
      const chunkPath = `${baseName}_chunk_${i}.mp3`;
      
      // Use ffmpeg to extract chunk and convert to MP3
      // -ss: start time (input)
      // -t: duration
      // -acodec libmp3lame: encode as MP3
      // -ab 128k: audio bitrate (128kbps to keep file size manageable)
      // -ar 44100: sample rate
      // -ac 2: stereo (or 1 for mono)
      const splitCommand = `ffmpeg -i "${audioPath}" -ss ${startTime} -t ${chunkDuration} -acodec libmp3lame -ab 128k -ar 44100 -ac 2 -y "${chunkPath}"`;
      
      await execAsync(splitCommand, { timeout: 120000 }); // 2 minute timeout per chunk
      
      // Verify chunk was created and check size
      const stats = await fs.stat(chunkPath);
      const chunkSizeMB = stats.size / (1024 * 1024);
      
      console.log(`   ✅ Created chunk ${i + 1}/${numChunks}: ${chunkSizeMB.toFixed(2)} MB (${formatTimestamp(startTime * 1000)} - ${formatTimestamp((startTime + chunkDuration) * 1000)})`);
      
      // Verify chunk is under 25MB limit
      if (chunkSizeMB > 25) {
        console.warn(`   ⚠️ Chunk ${i + 1} is ${chunkSizeMB.toFixed(2)} MB, which exceeds 25MB limit`);
        console.warn(`   This may cause Whisper API to reject it. Consider reducing target chunk size.`);
      }
      
      chunks.push({
        path: chunkPath,
        startTime: startTime,
        duration: chunkDuration
      });
    }
    
    return chunks;
  } catch (error) {
    console.error(`   ❌ Error splitting audio: ${error.message}`);
    throw error;
  }
}

/**
 * Transcribe a single audio chunk using Whisper API
 * @param {string} chunkPath - Path to the audio chunk
 * @param {string} openaiApiKey - OpenAI API key
 * @param {number} offsetSeconds - Time offset to add to timestamps
 * @returns {Promise<string>} - Diarized transcript text
 */
async function transcribeChunk(chunkPath, openaiApiKey, offsetSeconds = 0) {
  try {
    const audioBuffer = await fs.readFile(chunkPath);
    
    // Prepare form data for OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: path.basename(chunkPath),
      contentType: 'audio/mpeg'
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'verbose_json'); // Get timestamps
    
    // Call OpenAI Whisper API
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          ...formData.getHeaders()
        },
        timeout: 300000, // 5 minutes per chunk
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    if (response.data && response.data.segments) {
      // Convert to diarized format with timestamps (adjusted by offset)
      let diarizedText = '';
      response.data.segments.forEach(segment => {
        const start = (segment.start || 0) + offsetSeconds;
        const text = segment.text || '';
        
        if (text && text.trim()) {
          const timestamp = formatTimestamp(start * 1000);
          diarizedText += `${timestamp} [Speaker]: ${text.trim()}\n`;
        }
      });
      
      return diarizedText;
    } else if (response.data && response.data.text) {
      // Fallback: single text without timestamps
      const timestamp = formatTimestamp(offsetSeconds * 1000);
      return `${timestamp} [Speaker]: ${response.data.text}\n`;
    }
    
    return '';
  } catch (error) {
    const errorMsg = error.message || error.toString();
    if (error.response) {
      const status = error.response.status;
      if (status === 413) {
        console.error(`   ❌ Chunk still too large (${status}), this shouldn't happen`);
      }
    }
    throw error;
  }
}

/**
 * Fetch transcript via OpenAI Whisper API (Speech-to-Text)
 * Downloads audio from YouTube using yt-dlp and transcribes using OpenAI Whisper
 * This is a fallback method that works even without captions
 * Handles large files by chunking them into segments < 25MB
 */
async function fetchTranscriptViaWhisper(videoId) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.log('   OpenAI API key not found, skipping Whisper transcription');
      return null;
    }

    console.log(`   Using OpenAI Whisper API (speech-to-text)...`);
    
    // Download audio using yt-dlp (more reliable than ytdl-core)
    const audioPath = path.join(tmpdir(), `youtube_${videoId}_${Date.now()}.%(ext)s`);
    
    try {
      // Download audio using yt-dlp
      const downloadResult = await downloadAudioWithYtDlp(videoId, audioPath);
      
      if (!downloadResult.success) {
        console.log(`   ⚠️ Audio download failed: ${downloadResult.error}`);
        return null;
      }
      
      const finalAudioPath = downloadResult.filePath;
      
      // Check file size
      const stats = await fs.stat(finalAudioPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      console.log(`   Audio file size: ${fileSizeMB.toFixed(2)} MB`);
      
      // If file is > 25MB, we need to chunk it
      const MAX_FILE_SIZE_MB = 25;
      const TARGET_CHUNK_SIZE_MB = 20; // Target 20MB per chunk to stay safely under 25MB
      
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        console.log(`   ⚠️ File exceeds ${MAX_FILE_SIZE_MB}MB limit, chunking required`);
        
        // Split audio into chunks
        const chunks = await splitAudioIntoChunks(finalAudioPath, TARGET_CHUNK_SIZE_MB);
        
        if (chunks.length === 0) {
          console.error(`   ❌ Failed to create audio chunks`);
          // Clean up
          await fs.unlink(finalAudioPath).catch(() => {});
          return null;
        }
        
        // Process each chunk sequentially
        let fullTranscript = '';
        const chunkFilesToCleanup = [];
        
        try {
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            chunkFilesToCleanup.push(chunk.path);
            
            console.log(`   📝 Transcribing chunk ${i + 1}/${chunks.length}...`);
            
            const chunkTranscript = await transcribeChunk(
              chunk.path,
              openaiApiKey,
              chunk.startTime
            );
            
            if (chunkTranscript) {
              fullTranscript += chunkTranscript;
              console.log(`   ✅ Chunk ${i + 1}/${chunks.length} transcribed successfully`);
            } else {
              console.warn(`   ⚠️ Chunk ${i + 1}/${chunks.length} returned empty transcript`);
            }
          }
          
          // Clean up chunk files
          for (const chunkPath of chunkFilesToCleanup) {
            try {
              await fs.unlink(chunkPath);
            } catch (e) {
              // Ignore cleanup errors
            }
          }
          
          // Clean up original file
          try {
            await fs.unlink(finalAudioPath);
          } catch (e) {
            // Ignore cleanup errors
          }
          
          if (fullTranscript.trim()) {
            const segmentCount = fullTranscript.split('\n').filter(line => line.trim()).length;
            console.log(`   ✅ Successfully transcribed all chunks via OpenAI Whisper (${segmentCount} segments total)`);
            return fullTranscript;
          } else {
            console.error(`   ❌ All chunks processed but no transcript generated`);
            return null;
          }
        } catch (chunkError) {
          // Clean up chunk files on error
          for (const chunkPath of chunkFilesToCleanup) {
            try {
              await fs.unlink(chunkPath);
            } catch (e) {
              // Ignore cleanup errors
            }
          }
          throw chunkError;
        }
      } else {
        // File is small enough, process normally
        console.log(`   Sending audio to Whisper API...`);
        
        // Read audio file
        const audioBuffer = await fs.readFile(finalAudioPath);
        
        // Prepare form data for OpenAI Whisper API
        const formData = new FormData();
        formData.append('file', audioBuffer, {
          filename: `${videoId}.mp3`,
          contentType: 'audio/mpeg'
        });
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
        formData.append('response_format', 'verbose_json'); // Get timestamps
        
        // Call OpenAI Whisper API
        const response = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              ...formData.getHeaders()
            },
            timeout: 300000, // 5 minutes for long videos
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );
        
        // Clean up temporary file
        try {
          await fs.unlink(finalAudioPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (response.data && response.data.segments) {
          // Convert to diarized format with timestamps
          let diarizedText = '';
          response.data.segments.forEach(segment => {
            const start = segment.start || 0;
            const text = segment.text || '';
            
            if (text && text.trim()) {
              const timestamp = formatTimestamp(start * 1000);
              diarizedText += `${timestamp} [Speaker]: ${text.trim()}\n`;
            }
          });
          
          if (diarizedText.trim()) {
            console.log(`   ✅ Successfully transcribed via OpenAI Whisper (${response.data.segments.length} segments)`);
            return diarizedText;
          }
        } else if (response.data && response.data.text) {
          // Fallback: single text without timestamps
          const timestamp = formatTimestamp(0);
          const diarizedText = `${timestamp} [Speaker]: ${response.data.text}\n`;
          console.log(`   ✅ Successfully transcribed via OpenAI Whisper (single segment)`);
          return diarizedText;
        }
        
        return null;
      }
    } catch (downloadError) {
      // Clean up on error - try to find and delete the file
      try {
        const possiblePaths = [
          audioPath.replace('%(ext)s', 'mp3'),
          audioPath.replace('%(ext)s', 'm4a'),
          audioPath.replace('%(ext)s', 'webm'),
          audioPath.replace('%(ext)s', 'opus')
        ];
        for (const testPath of possiblePaths) {
          await fs.unlink(testPath).catch(() => {});
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      
      // Provide more specific error messages
      const errorMsg = downloadError.message || downloadError.toString();
      
      if (errorMsg.includes('Video unavailable') || errorMsg.includes('Private video')) {
        console.log(`   ⚠️ Video unavailable or private - cannot download audio`);
        return null;
      } else if (errorMsg.includes('Sign in to confirm your age') || errorMsg.includes('age-restricted')) {
        console.log(`   ⚠️ Age-restricted video - cannot download audio`);
        return null;
      } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
        console.log(`   ⚠️ YouTube blocked audio download (403 Forbidden)`);
        console.log(`   This usually means YouTube has restricted access to this video`);
        console.log(`   Possible reasons: region-locked, age-restricted, or YouTube anti-bot measures`);
        return null;
      } else if (errorMsg.includes('429')) {
        console.log(`   ⚠️ Rate limited by YouTube - too many requests`);
        console.log(`   Please wait before trying again`);
        return null;
      } else {
        // Re-throw to be caught by outer catch
        throw downloadError;
      }
    }
  } catch (error) {
    const errorMsg = error.message || error.toString();
    
    // Check if it's a YouTube download error (403, etc.)
    if (errorMsg.includes('403') || errorMsg.includes('Forbidden') || (error.statusCode && error.statusCode === 403)) {
      console.error(`   ❌ Whisper API failed: YouTube blocked audio download (403 Forbidden)`);
      console.error(`   YouTube is preventing audio download for this video`);
      console.error(`   Possible reasons:`);
      console.error(`   - Video is region-locked or age-restricted`);
      console.error(`   - YouTube has anti-bot measures in place`);
      console.error(`   - Video is private or unavailable`);
      console.error(`   Solution: This video cannot be transcribed via Whisper API`);
      console.error(`   The video must have captions enabled for transcription to work`);
      return null;
    }
    
    // Check for rate limiting
    if (errorMsg.includes('429') || (error.statusCode && error.statusCode === 429)) {
      console.error(`   ❌ Whisper API failed: Rate limited`);
      console.error(`   Too many requests to YouTube. Please wait before trying again.`);
      return null;
    }
    
    // Check for OpenAI API errors
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.error(`   ❌ Whisper API failed: Invalid OpenAI API key`);
        console.error(`   Please check your OPENAI_API_KEY in .env file`);
        return null;
      } else if (status === 429) {
        console.error(`   ❌ Whisper API failed: OpenAI rate limit exceeded`);
        console.error(`   Please wait before trying again or upgrade your OpenAI plan`);
        return null;
      } else if (status === 413) {
        console.error(`   ❌ Whisper API failed: Audio file too large`);
        console.error(`   The video is too long for Whisper API (max 25MB)`);
        return null;
      }
    }
    
    console.error(`   ❌ Whisper API failed: ${errorMsg.substring(0, 200)}`);
    
    // Log more details for debugging
    if (error.stack) {
      console.error(`   Stack trace: ${error.stack.substring(0, 500)}`);
    }
    
    if (error.response) {
      console.error(`   API Error Status: ${error.response.status}`);
      console.error(`   API Error: ${JSON.stringify(error.response.data)?.substring(0, 300)}`);
    }
    
    // Check for specific error types
    if (errorMsg.includes('Could not extract functions')) {
      console.error(`   This error suggests an issue with audio download.`);
    }
    
    return null;
  }
}

/**
 * Fetch transcript from YouTube video
 * Method 1: youtube-transcript library (fastest, if captions available)
 * Method 2: OpenAI Whisper API (fallback, works for videos without captions)
 */
export async function fetchYouTubeTranscript(videoId, retries = 1) {
  try {
    // Extract video ID from URL if full URL provided
    let actualVideoId = videoId;
    
    if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
      const urlMatch = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (urlMatch) {
        actualVideoId = urlMatch[1];
      }
    }
    
    // Check cache first
    if (isCachedAsUnavailable(actualVideoId)) {
      console.warn(`⚠️ Video ${actualVideoId} previously failed (cached, skipping)`);
      return null;
    }
    
    console.log(`📹 Fetching transcript for ${actualVideoId}...`);
    
    // Method 1: Try youtube-transcript library first (fastest, if captions available)
    let transcript = await fetchTranscriptViaLibrary(actualVideoId);
    
    if (transcript) {
      transcriptAvailabilityCache.set(actualVideoId, { available: true, timestamp: Date.now() });
      return transcript;
    }
    
    // Method 2: Fallback to Whisper API (works for videos without captions)
    console.log(`   youtube-transcript library failed, trying Whisper API...`);
    transcript = await fetchTranscriptViaWhisper(actualVideoId);
    
    if (transcript) {
      transcriptAvailabilityCache.set(actualVideoId, { available: true, timestamp: Date.now() });
      return transcript;
    }
    
    // Both methods failed
    console.error(`❌ Failed to fetch transcript for video ${actualVideoId}`);
    console.error(`   Both youtube-transcript library and Whisper API failed`);
    console.error(`   Video may not have captions enabled and Whisper transcription failed`);
    transcriptAvailabilityCache.set(actualVideoId, { available: false, timestamp: Date.now() });
    return null;
    
  } catch (error) {
    console.error(`❌ Error in fetchYouTubeTranscript for ${videoId}:`, error.message);
    return null;
  }
}

function formatTimestamp(ms) {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Process YouTube video
 */
export async function processYouTubeVideo(videoId, metadata = {}) {
  const startTime = Date.now();
  
  const transcriptText = await fetchYouTubeTranscript(videoId);
  
  if (!transcriptText) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ Failed to fetch YouTube transcript for ${videoId} (${duration}s)`);
    console.error(`   Video may not have captions enabled. Skipping processing.`);
    return null;
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Fetched transcript (${transcriptText.length} characters, ${duration}s)`);
  console.log(`   First 200 chars: ${transcriptText.substring(0, 200)}...`);
  
  const result = await processPodcastTranscript(transcriptText, {
    ...metadata,
    source: 'YouTube',
    sourceId: 'youtube',
    link: `https://www.youtube.com/watch?v=${videoId}`
  });
  
  if (!result) {
    console.error(`❌ Failed to process transcript for video ${videoId}`);
    console.error(`   This may indicate a parsing issue with the transcript format`);
    return null;
  }
  
  console.log(`✅ Successfully processed video ${videoId}:`);
  console.log(`   Technologies: ${result.technologies.length}`);
  console.log(`   Companies: ${result.companies.length}`);
  console.log(`   Key Quotes: ${result.metadata?.keyQuotes?.length || 0}`);
  console.log(`   Segments: ${result.metadata?.totalSegments || 0}`);
  
  return result;
}

// ============================================
// 6. QUERY & AGGREGATION FUNCTIONS
// ============================================

/**
 * Query stance across multiple podcasts
 * "Show all positive/negative takes on AI in the last 100 tech podcasts"
 */
export function queryStances(podcasts, options = {}) {
  const {
    technology,
    stance = null, // 'pro', 'con', 'neutral', 'mixed'
    speaker = null,
    dateRange = null
  } = options;
  
  const results = [];
  
  podcasts.forEach(podcast => {
    if (!podcast.metadata?.segments) return;
    
    // Filter by date
    if (dateRange) {
      const published = new Date(podcast.published);
      if (published < dateRange.start || published > dateRange.end) return;
    }
    
    podcast.metadata.segments.forEach(segment => {
      // Filter by speaker
      if (speaker && segment.speaker !== speaker) return;
      
      // Filter by technology
      if (technology && !segment.entities.technologies.includes(technology)) return;
      
      // Filter by stance
      if (technology && stance) {
        const segmentStance = segment.stances[technology];
        if (!segmentStance || segmentStance.basic.stance !== stance) return;
      }
      
      results.push({
        podcast: podcast.title,
        speaker: segment.speaker,
        text: segment.text,
        timestamp: segment.timestamp,
        technology,
        stance: technology ? segment.stances[technology]?.basic.stance : null,
        published: podcast.published,
        link: podcast.link
      });
    });
  });
  
  return results;
}

/**
 * Aggregate views by speaker, episode, industry
 */
export function aggregateViews(podcasts, groupBy = 'speaker') {
  const aggregated = {};
  
  podcasts.forEach(podcast => {
    if (!podcast.metadata?.segments) return;
    
    podcast.metadata.segments.forEach(segment => {
      const key = groupBy === 'speaker' ? segment.speaker :
                   groupBy === 'episode' ? podcast.title :
                   groupBy === 'industry' ? (podcast.industries[0] || 'Unknown') : 'all';
      
      if (!aggregated[key]) {
        aggregated[key] = {
          count: 0,
          technologies: new Set(),
          stances: { pro: 0, con: 0, neutral: 0, mixed: 0 }
        };
      }
      
      aggregated[key].count++;
      segment.entities.technologies.forEach(t => aggregated[key].technologies.add(t));
      
      Object.values(segment.stances).forEach(stanceData => {
        const stance = stanceData.basic.stance;
        if (aggregated[key].stances[stance] !== undefined) {
          aggregated[key].stances[stance]++;
        }
      });
    });
  });
  
  // Convert Sets to Arrays
  Object.keys(aggregated).forEach(key => {
    aggregated[key].technologies = Array.from(aggregated[key].technologies);
  });
  
  return aggregated;
}

// Export main function for backward compatibility
export function addPodcastTranscript(transcript, metadata) {
  return processPodcastTranscript(transcript, metadata);
}
