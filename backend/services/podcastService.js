import axios from 'axios';

/**
 * Podcast Service - Processes podcast transcripts and extracts insights
 */

// Rate limiter
class PodcastRateLimiter {
  constructor(requestsPerSecond = 1) {
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequestTime = 0;
  }

  async waitForNextSlot() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  async execute(requestFn) {
    await this.waitForNextSlot();
    return await requestFn();
  }
}

const rateLimiter = new PodcastRateLimiter(1);

/**
 * Extract technologies from transcript
 */
function extractTechnologies(text) {
  const lowerText = text.toLowerCase();
  const technologies = [];
  
  const techKeywords = {
    'AI': ['artificial intelligence', 'ai', 'machine learning', 'deep learning'],
    'LLM': ['large language model', 'llm', 'gpt', 'chatgpt', 'claude', 'gemini'],
    'Computer Vision': ['computer vision', 'image recognition', 'visual ai'],
    'Robotics': ['robot', 'robotics', 'autonomous'],
    'Quantum': ['quantum computing', 'quantum'],
    'AGI': ['artificial general intelligence', 'agi', 'general ai'],
    'Autonomous Vehicles': ['self-driving', 'autonomous vehicle', 'tesla'],
    'Biotech': ['biotechnology', 'gene editing', 'crispr'],
  };
  
  Object.entries(techKeywords).forEach(([tech, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      technologies.push(tech);
    }
  });
  
  return [...new Set(technologies)];
}

/**
 * Extract key quotes about technology predictions
 */
function extractKeyQuotes(transcript, technologies) {
  const quotes = [];
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  const predictionKeywords = [
    'will be', 'going to', 'next big', 'future of', 'revolutionary',
    'breakthrough', 'game changer', 'transform', 'disrupt', 'emerging'
  ];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    
    // Check if sentence mentions a technology and a prediction keyword
    const hasTech = technologies.some(tech => 
      lowerSentence.includes(tech.toLowerCase())
    );
    const hasPrediction = predictionKeywords.some(keyword => 
      lowerSentence.includes(keyword)
    );
    
    if (hasTech && hasPrediction) {
      quotes.push({
        text: sentence.trim(),
        technologies: technologies.filter(tech => 
          lowerSentence.includes(tech.toLowerCase())
        ),
        confidence: 0.8
      });
    }
  });
  
  return quotes.slice(0, 5); // Top 5 quotes
}

/**
 * Extract speaker information
 */
function extractSpeaker(text) {
  // Common patterns in transcripts
  const patterns = [
    /^([A-Z][a-z]+ [A-Z][a-z]+):/,
    /^([A-Z][a-z]+):/,
    /\[([A-Z][a-z]+ [A-Z][a-z]+)\]:/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return 'Unknown';
}

/**
 * Process podcast transcript
 */
export function processPodcastTranscript(transcript, metadata = {}) {
  try {
    const technologies = extractTechnologies(transcript);
    const quotes = extractKeyQuotes(transcript, technologies);
    const speaker = extractSpeaker(transcript);
    
    return {
      id: metadata.id || `podcast_${Date.now()}`,
      type: 'podcast',
      title: metadata.title || 'Podcast Episode',
      content: transcript,
      published: metadata.published || new Date().toISOString(),
      source: metadata.source || 'Podcast',
      sourceId: metadata.sourceId || 'podcast',
      link: metadata.link || '',
      technologies: technologies,
      industries: [],
      sentiment: 0.5, // Generally positive/neutral for podcasts
      confidence: technologies.length > 0 ? 0.9 : 0.5,
      metadata: {
        speaker: speaker,
        quotes: quotes,
        episode: metadata.episode || '',
        podcast: metadata.podcast || ''
      }
    };
  } catch (error) {
    console.error('Error processing podcast transcript:', error.message);
    return null;
  }
}

/**
 * Fetch podcast transcripts from public sources
 * Note: Most podcasts don't have public APIs, so this is a placeholder
 * In production, you'd integrate with services like:
 * - YouTube Transcript API
 * - Podcast transcript databases
 * - Custom scraping (with permission)
 */
export async function fetchPodcastTranscripts(limit = 10, dateThreshold = null) {
  try {
    // This is a placeholder - in production, you'd fetch from actual sources
    // For now, return empty array as most podcast APIs require authentication
    console.log('⚠️ Podcast transcript fetching requires API keys or custom integration');
    console.log('💡 Suggested sources: YouTube Transcript API, Podcast transcript databases');
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching podcast transcripts:', error.message);
    return [];
  }
}

/**
 * Process and store podcast transcript manually
 * Use this when you have transcript text from external sources
 */
export function addPodcastTranscript(transcript, metadata) {
  return processPodcastTranscript(transcript, metadata);
}

