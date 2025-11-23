import axios from 'axios';

/**
 * GitHub Service - Fetches trending repositories and tech activity
 */

// Rate limiter (GitHub allows 60 requests/hour for unauthenticated, 5000/hour authenticated)
class GitHubRateLimiter {
  constructor(requestsPerSecond = 0.5) {
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

const rateLimiter = new GitHubRateLimiter(0.5);

/**
 * Extract technologies from repository
 */
function extractTechnologies(name, description, topics) {
  const text = `${name} ${description} ${(topics || []).join(' ')}`.toLowerCase();
  const technologies = [];
  
  const techKeywords = {
    'AI': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning'],
    'LLM': ['llm', 'language model', 'gpt', 'transformer', 'bert'],
    'Computer Vision': ['computer vision', 'cv', 'image', 'opencv', 'yolo'],
    'NLP': ['nlp', 'natural language', 'text processing'],
    'Robotics': ['robot', 'robotics', 'ros'],
    'Blockchain': ['blockchain', 'crypto', 'web3', 'ethereum'],
    'IoT': ['iot', 'internet of things'],
    'Edge Computing': ['edge', 'edge computing'],
    'Quantum': ['quantum'],
  };
  
  Object.entries(techKeywords).forEach(([tech, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      technologies.push(tech);
    }
  });
  
  return [...new Set(technologies)];
}

/**
 * Fetch trending repositories from GitHub
 */
export async function fetchTrendingRepositories(limit = 30, dateThreshold = null) {
  try {
    const allRepos = [];
    
    // Technology-related search queries
    const queries = [
      'machine learning',
      'artificial intelligence',
      'deep learning',
      'neural network',
      'transformer'
    ];
    
    for (const query of queries.slice(0, 3)) {
      try {
        const response = await rateLimiter.execute(async () => {
          return await axios.get('https://api.github.com/search/repositories', {
            params: {
              q: `${query} language:python language:javascript language:typescript stars:>100`,
              sort: 'stars',
              order: 'desc',
              per_page: Math.min(limit, 10)
            },
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              // Add GitHub token if available: 'Authorization': `token ${process.env.GITHUB_TOKEN}`
            }
          });
        });
        
        if (response.data && response.data.items) {
          for (const repo of response.data.items) {
            // Check date threshold (using updated_at as proxy)
            if (dateThreshold && new Date(repo.updated_at) < dateThreshold) {
              continue;
            }
            
            const technologies = extractTechnologies(
              repo.name,
              repo.description || '',
              repo.topics || []
            );
            
            allRepos.push({
              id: `github_${repo.id}`,
              type: 'github',
              title: repo.name,
              content: repo.description || '',
              published: repo.created_at,
              updated: repo.updated_at,
              source: 'GitHub',
              sourceId: 'github',
              link: repo.html_url,
              technologies: technologies,
              industries: [],
              sentiment: 0.5, // Neutral
              confidence: technologies.length > 0 ? 0.7 : 0.3,
              metadata: {
                stars: repo.stargazers_count || 0,
                forks: repo.forks_count || 0,
                language: repo.language || '',
                topics: repo.topics || [],
                owner: repo.owner?.login || ''
              }
            });
          }
        }
        
        // Delay between queries
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        if (error.response?.status === 403) {
          console.error('⚠️ GitHub API rate limit reached. Consider adding GITHUB_TOKEN to .env');
        } else {
          console.error(`Error fetching GitHub repos for "${query}":`, error.message);
        }
        continue;
      }
    }
    
    // Remove duplicates
    const uniqueRepos = [];
    const seenIds = new Set();
    
    allRepos.forEach(repo => {
      if (!seenIds.has(repo.id)) {
        seenIds.add(repo.id);
        uniqueRepos.push(repo);
      }
    });
    
    // Sort by stars
    uniqueRepos.sort((a, b) => (b.metadata?.stars || 0) - (a.metadata?.stars || 0));
    
    console.log(`✅ Fetched ${uniqueRepos.slice(0, limit).length} trending repositories from GitHub`);
    return uniqueRepos.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Error fetching trending repositories:', error.message);
    return [];
  }
}

/**
 * Fetch latest GitHub activity
 */
export async function fetchLatestGithubActivity(limit = 30, dateThreshold = null) {
  try {
    const repos = await fetchTrendingRepositories(limit, dateThreshold);
    return repos;
  } catch (error) {
    console.error('❌ Error fetching latest GitHub activity:', error.message);
    return [];
  }
}

