import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

/**
 * News Service - Fetches tech news from multiple sources
 */

// Rate limiter for news APIs
class NewsRateLimiter {
  constructor(requestsPerSecond = 2) {
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

const rateLimiter = new NewsRateLimiter(2);

/**
 * Extract technologies from news content
 */
function extractTechnologies(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const technologies = [];
  
  // Technology keywords
  const techKeywords = {
    'AI': ['artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'neural network'],
    'LLM': ['large language model', 'llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'transformer'],
    'Computer Vision': ['computer vision', 'cv', 'image recognition', 'object detection', 'visual ai'],
    'NLP': ['natural language processing', 'nlp', 'text processing', 'language model'],
    'Robotics': ['robot', 'robotics', 'autonomous', 'automation'],
    'Quantum': ['quantum computing', 'quantum', 'qubit'],
    'Blockchain': ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3'],
    'AR/VR': ['augmented reality', 'virtual reality', 'ar', 'vr', 'metaverse'],
    'IoT': ['internet of things', 'iot', 'smart device'],
    'Edge Computing': ['edge computing', 'edge ai'],
    'Autonomous Vehicles': ['self-driving', 'autonomous vehicle', 'tesla autopilot'],
    'Biotech': ['biotechnology', 'gene editing', 'crispr', 'synthetic biology'],
    'Clean Energy': ['solar', 'wind energy', 'renewable energy', 'battery technology'],
    'Space Tech': ['spacex', 'satellite', 'space technology', 'rocket'],
  };
  
  Object.entries(techKeywords).forEach(([tech, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      technologies.push(tech);
    }
  });
  
  return [...new Set(technologies)]; // Remove duplicates
}

/**
 * Extract industries from content
 */
function extractIndustries(title, content) {
  const text = `${title} ${content}`.toLowerCase();
  const industries = [];
  
  const industryKeywords = {
    'Healthcare': ['healthcare', 'medical', 'health', 'pharmaceutical', 'biotech'],
    'Finance': ['fintech', 'banking', 'finance', 'cryptocurrency', 'payment'],
    'Education': ['education', 'edtech', 'learning', 'online learning'],
    'Transportation': ['transportation', 'logistics', 'autonomous vehicle', 'delivery'],
    'Energy': ['energy', 'renewable', 'solar', 'wind', 'battery'],
    'Manufacturing': ['manufacturing', 'industrial', 'factory', 'production'],
    'Retail': ['retail', 'e-commerce', 'shopping', 'marketplace'],
    'Entertainment': ['entertainment', 'gaming', 'media', 'streaming'],
    'Agriculture': ['agriculture', 'farming', 'agtech', 'food tech'],
    'Real Estate': ['real estate', 'property', 'construction'],
  };
  
  Object.entries(industryKeywords).forEach(([industry, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      industries.push(industry);
    }
  });
  
  return [...new Set(industries)];
}

/**
 * Simple sentiment analysis
 */
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();
  
  const positiveWords = ['breakthrough', 'innovative', 'revolutionary', 'success', 'growth', 'advance', 'improve', 'excellent', 'amazing', 'promising'];
  const negativeWords = ['failure', 'decline', 'problem', 'issue', 'concern', 'risk', 'threat', 'challenge', 'difficult'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 0.5 + Math.min(0.5, positiveCount / 20);
  if (negativeCount > positiveCount) return -0.5 - Math.min(0.5, negativeCount / 20);
  return 0; // Neutral
}

/**
 * Fetch news from Google News RSS
 */
export async function fetchTechNewsFromGoogle(limit = 50, dateThreshold = null) {
  try {
    const allNews = [];
    
    // Tech-related search queries
    const queries = [
      'artificial intelligence',
      'machine learning',
      'technology startup',
      'tech innovation',
      'AI technology'
    ];
    
    for (const query of queries.slice(0, 3)) { // Limit to 3 queries
      try {
        const response = await rateLimiter.execute(async () => {
          return await axios.get('https://news.google.com/rss/search', {
            params: {
              q: query,
              hl: 'en',
              gl: 'US',
              ceid: 'US:en'
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
        });
        
        const result = await parseXML(response.data);
        const items = result.rss?.channel?.[0]?.item || [];
        
        items.forEach(item => {
          const title = item.title?.[0] || '';
          const link = item.link?.[0] || '';
          const pubDate = item.pubDate?.[0] || new Date().toISOString();
          const description = item.description?.[0] || '';
          
          // Parse date
          let publishedDate;
          try {
            publishedDate = new Date(pubDate).toISOString();
          } catch {
            publishedDate = new Date().toISOString();
          }
          
          // Filter by date if threshold provided
          if (dateThreshold && new Date(publishedDate) < dateThreshold) {
            return;
          }
          
          const technologies = extractTechnologies(title, description);
          const industries = extractIndustries(title, description);
          const sentiment = analyzeSentiment(title + ' ' + description);
          
          allNews.push({
            id: `google_${link.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
            type: 'news',
            title: title,
            content: description,
            published: publishedDate,
            source: 'Google News',
            sourceId: 'google-news',
            link: link,
            technologies: technologies,
            industries: industries,
            sentiment: sentiment,
            confidence: technologies.length > 0 ? 0.7 : 0.3,
            metadata: {
              query: query
            }
          });
        });
        
        // Small delay between queries
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching Google News for "${query}":`, error.message);
        continue;
      }
    }
    
    // Remove duplicates by title
    const uniqueNews = [];
    const seenTitles = new Set();
    
    allNews.forEach(news => {
      const titleKey = news.title.toLowerCase().trim();
      if (!seenTitles.has(titleKey)) {
        seenTitles.add(titleKey);
        uniqueNews.push(news);
      }
    });
    
    // Sort by date and limit
    uniqueNews.sort((a, b) => new Date(b.published) - new Date(a.published));
    
    console.log(`✅ Fetched ${uniqueNews.slice(0, limit).length} news articles from Google News`);
    return uniqueNews.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Error fetching news from Google News:', error.message);
    return [];
  }
}

/**
 * Fetch news from Hacker News API
 */
export async function fetchTechNewsFromHackerNews(limit = 30, dateThreshold = null) {
  try {
    // Get top stories
    const topStoriesResponse = await rateLimiter.execute(async () => {
      return await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
    });
    
    const topStoryIds = topStoriesResponse.data.slice(0, 100);
    const allNews = [];
    
    // Fetch details for each story
    for (const storyId of topStoryIds.slice(0, limit)) {
      try {
        const storyResponse = await rateLimiter.execute(async () => {
          return await axios.get(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
        });
        
        const story = storyResponse.data;
        
        if (!story || story.type !== 'story' || !story.title) {
          continue;
        }
        
        // Check date threshold
        if (dateThreshold && story.time && new Date(story.time * 1000) < dateThreshold) {
          continue;
        }
        
        const publishedDate = story.time ? new Date(story.time * 1000).toISOString() : new Date().toISOString();
        const technologies = extractTechnologies(story.title, story.text || '');
        const industries = extractIndustries(story.title, story.text || '');
        const sentiment = analyzeSentiment(story.title + ' ' + (story.text || ''));
        
        allNews.push({
          id: `hn_${storyId}`,
          type: 'news',
          title: story.title,
          content: story.text || '',
          published: publishedDate,
          source: 'Hacker News',
          sourceId: 'hacker-news',
          link: story.url || `https://news.ycombinator.com/item?id=${storyId}`,
          technologies: technologies,
          industries: industries,
          sentiment: sentiment,
          confidence: technologies.length > 0 ? 0.7 : 0.3,
          metadata: {
            score: story.score || 0,
            comments: story.descendants || 0
          }
        });
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error fetching Hacker News story ${storyId}:`, error.message);
        continue;
      }
    }
    
    console.log(`✅ Fetched ${allNews.length} news articles from Hacker News`);
    return allNews;
    
  } catch (error) {
    console.error('❌ Error fetching news from Hacker News:', error.message);
    return [];
  }
}

/**
 * Fetch latest tech news from all sources
 */
export async function fetchLatestTechNews(limit = 50, dateThreshold = null) {
  try {
    const [googleNews, hackerNews] = await Promise.allSettled([
      fetchTechNewsFromGoogle(Math.ceil(limit * 0.7), dateThreshold),
      fetchTechNewsFromHackerNews(Math.ceil(limit * 0.3), dateThreshold)
    ]);
    
    const allNews = [];
    
    if (googleNews.status === 'fulfilled') {
      allNews.push(...googleNews.value);
    }
    
    if (hackerNews.status === 'fulfilled') {
      allNews.push(...hackerNews.value);
    }
    
    // Remove duplicates and sort
    const uniqueNews = [];
    const seenTitles = new Set();
    
    allNews.forEach(news => {
      const titleKey = news.title.toLowerCase().trim();
      if (!seenTitles.has(titleKey)) {
        seenTitles.add(titleKey);
        uniqueNews.push(news);
      }
    });
    
    uniqueNews.sort((a, b) => new Date(b.published) - new Date(a.published));
    
    console.log(`✅ Total fetched ${uniqueNews.slice(0, limit).length} unique news articles`);
    return uniqueNews.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Error fetching latest tech news:', error.message);
    return [];
  }
}

