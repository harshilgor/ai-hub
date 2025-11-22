import axios from 'axios';

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';

/**
 * Rate limiter for Semantic Scholar API - ensures 1 request per second
 */
class RateLimiter {
  constructor(requestsPerSecond = 1) {
    this.requestsPerSecond = requestsPerSecond;
    this.minInterval = 1000 / requestsPerSecond; // 1000ms for 1 req/sec
    this.lastRequestTime = 0;
    this.queue = [];
    this.processing = false;
  }

  async waitForNextSlot() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async execute(requestFn) {
    await this.waitForNextSlot();
    return await requestFn();
  }
}

// Create a singleton rate limiter instance
const rateLimiter = new RateLimiter(1); // 1 request per second

/**
 * Enrich paper data with Semantic Scholar information
 * @param {Object} paper - Paper object from arXiv
 */
export async function enrichPaperWithSemanticScholar(paper) {
  try {
    // Search by arXiv ID or title
    const searchUrl = `${SEMANTIC_SCHOLAR_API}/paper/arXiv:${paper.arxivId}`;
    
    const response = await rateLimiter.execute(async () => {
      return await axios.get(searchUrl, {
        params: {
          fields: 'title,authors,abstract,year,citationCount,influentialCitationCount,references,citations,venue,externalIds'
        },
        headers: {
          'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || ''
        }
      });
    });

    const data = response.data;

    return {
      ...paper,
      citations: data.citationCount || 0,
      influentialCitations: data.influentialCitationCount || 0,
      semanticScholarId: data.paperId,
      venue: data.venue || paper.venue,
      year: data.year || new Date(paper.published).getFullYear()
    };

  } catch (error) {
    // Paper not found in Semantic Scholar or API error
    // Return original paper without enrichment
    return paper;
  }
}

/**
 * Search papers by query in Semantic Scholar
 */
export async function searchSemanticScholar(query, limit = 50) {
  try {
    const response = await rateLimiter.execute(async () => {
      return await axios.get(`${SEMANTIC_SCHOLAR_API}/paper/search`, {
        params: {
          query: query,
          limit: limit,
          fields: 'title,authors,abstract,year,citationCount,venue,externalIds'
        },
        headers: {
          'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || ''
        }
      });
    });

    return response.data.data || [];
  } catch (error) {
    console.error('❌ Error searching Semantic Scholar:', error.message);
    return [];
  }
}

/**
 * Get trending AI papers from Semantic Scholar
 */
export async function getTrendingPapers(limit = 20) {
  try {
    const queries = [
      'large language models',
      'computer vision',
      'reinforcement learning',
      'transformers',
      'diffusion models'
    ];

    const allPapers = [];

    for (const query of queries) {
      const papers = await searchSemanticScholar(query, 10);
      allPapers.push(...papers);
    }

    // Sort by citation count and recency
    const sortedPapers = allPapers
      .sort((a, b) => {
        const scoreA = (a.citationCount || 0) + (2025 - (a.year || 2020)) * 10;
        const scoreB = (b.citationCount || 0) + (2025 - (b.year || 2020)) * 10;
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return sortedPapers;

  } catch (error) {
    console.error('❌ Error getting trending papers:', error.message);
    return [];
  }
}

/**
 * Fetch latest AI papers from Semantic Scholar
 * Uses search with year filter to get recent papers
 * @param {number} limit - Maximum number of papers to fetch
 * @param {number} year - Year to filter by
 * @param {Date} dateThreshold - Only fetch papers newer than this date (optional)
 */
export async function fetchLatestPapersFromSemanticScholar(limit = 100, year = 2024, dateThreshold = null) {
  try {
    // Rotate queries to get variety - use different queries each time
    const allQueries = [
      'artificial intelligence',
      'machine learning',
      'deep learning',
      'neural networks',
      'computer vision',
      'natural language processing',
      'large language models',
      'reinforcement learning',
      'transformer models',
      'generative AI',
      'diffusion models',
      'foundation models',
      'multimodal learning',
      'self-supervised learning',
      'few-shot learning'
    ];
    
    // Rotate queries based on time to get different results
    const hourOfDay = new Date().getHours();
    const startIndex = hourOfDay % allQueries.length;
    const aiQueries = allQueries.slice(startIndex, startIndex + 8).concat(
      allQueries.slice(0, Math.max(0, 8 - (allQueries.length - startIndex)))
    );

    const allPapers = [];
    const currentYear = new Date().getFullYear();
    const targetYear = year || currentYear;
    
    // Search for each AI topic with offset to get different papers
    let offset = 0;
    for (const query of aiQueries) {
      try {
        // Use offset to get different papers each time
        const response = await rateLimiter.execute(async () => {
          return await axios.get(`${SEMANTIC_SCHOLAR_API}/paper/search`, {
            params: {
              query: query,
              year: `${targetYear},${targetYear + 1}`, // Current year and next
              limit: Math.ceil(limit / aiQueries.length) + 20, // Get more to filter by date
              offset: offset,
              fields: 'paperId,title,authors,year,abstract,citationCount,influentialCitationCount,venue,externalIds,openAccessPdf,publicationDate,fieldsOfStudy'
            },
            headers: {
              'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || ''
            }
          });
        });

        if (response.data && response.data.data) {
          let papers = response.data.data;
          
          // Filter by date threshold if provided, but be lenient (allow papers within 1 day of threshold)
          if (dateThreshold) {
            const thresholdDate = new Date(dateThreshold);
            // Allow papers from 1 day before threshold to account for timezone differences
            thresholdDate.setDate(thresholdDate.getDate() - 1);
            
            papers = papers.filter(p => {
              const paperDate = new Date(p.publicationDate || (p.year ? `${p.year}-01-01` : 0));
              return paperDate >= thresholdDate;
            });
          }
          
          allPapers.push(...papers);
        }
      } catch (queryError) {
        console.error(`⚠️ Error searching for "${query}":`, queryError.message);
        // Continue with other queries
      }
      
      // Increment offset for next query to get different results
      offset += 10;
      // Rate limiter already handles 1 req/sec, no need for additional delay
    }

    // Remove duplicates by paperId
    const uniquePapers = Array.from(
      new Map(allPapers.map(p => [p.paperId, p])).values()
    );

    // Sort by publication date (most recent first)
    uniquePapers.sort((a, b) => {
      const dateA = new Date(a.publicationDate || (a.year ? `${a.year}-01-01` : 0));
      const dateB = new Date(b.publicationDate || (b.year ? `${b.year}-01-01` : 0));
      return dateB - dateA;
    });

    return uniquePapers.slice(0, limit);
  } catch (error) {
    console.error('❌ Error fetching latest papers from Semantic Scholar:', error.message);
    return [];
  }
}

/**
 * Fetch detailed paper information using batch API
 * More efficient than individual requests
 */
export async function fetchPapersBatch(paperIds) {
  try {
    if (!paperIds || paperIds.length === 0) {
      return [];
    }

    // Batch API accepts up to 1000 IDs, but we'll limit to 100 for safety
    const batches = [];
    const batchSize = 100;
    
    for (let i = 0; i < paperIds.length; i += batchSize) {
      const batch = paperIds.slice(i, i + batchSize);
      
      try {
        const response = await rateLimiter.execute(async () => {
          return await axios.post(
            `${SEMANTIC_SCHOLAR_API}/paper/batch`,
            { ids: batch },
            {
              params: {
                fields: 'title,authors,year,abstract,citationCount,influentialCitationCount,venue,externalIds,openAccessPdf,publicationDate,referenceCount,citationCount,fieldsOfStudy'
              },
              headers: {
                'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || '',
                'Content-Type': 'application/json'
              }
            }
          );
        });

        if (response.data) {
          const results = Array.isArray(response.data) ? response.data : [response.data];
          batches.push(...results.filter(p => p !== null && p !== undefined));
        }
      } catch (batchError) {
        console.error(`⚠️ Error fetching batch ${i}-${i + batchSize}:`, batchError.message);
        // Continue with next batch
      }
      // Rate limiter already handles 1 req/sec, no need for additional delay
    }

    return batches;
  } catch (error) {
    console.error('❌ Error fetching papers batch:', error.message);
    return [];
  }
}

/**
 * Get query autocomplete suggestions
 */
export async function getPaperAutocomplete(query) {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const response = await rateLimiter.execute(async () => {
      return await axios.get(`${SEMANTIC_SCHOLAR_API}/paper/autocomplete`, {
        params: {
          query: query
        },
        headers: {
          'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY || ''
        }
      });
    });

    // The API returns an array of paper objects with minimal info
    // Extract titles for autocomplete suggestions
    if (Array.isArray(response.data)) {
      return response.data.map(paper => paper.title || '').filter(Boolean);
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error getting autocomplete:', error.message);
    return [];
  }
}

/**
 * Transform Semantic Scholar paper format to our internal format
 */
export function transformSemanticScholarPaper(ssPaper) {
  if (!ssPaper || !ssPaper.paperId) {
    return null;
  }

  const authors = ssPaper.authors 
    ? ssPaper.authors.map(a => a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim()).filter(Boolean)
    : [];

  // Extract arXiv ID if available
  const arxivId = ssPaper.externalIds?.ArXiv || 
    (ssPaper.paperId && ssPaper.paperId.startsWith('ARXIV:') 
      ? ssPaper.paperId.replace('ARXIV:', '') 
      : null);

  // Determine tags from fields of study
  const fieldsOfStudy = ssPaper.fieldsOfStudy || [];
  
  // Map to our categories
  const categoryMap = {
    'Computer Science': 'Computer Science',
    'Artificial Intelligence': 'AI',
    'Machine Learning': 'Machine Learning',
    'Neural Networks': 'Neural Networks',
    'Computer Vision': 'Computer Vision',
    'Natural Language Processing': 'NLP',
    'Robotics': 'Robotics',
    'Reinforcement Learning': 'Reinforcement Learning'
  };

  const mappedTags = fieldsOfStudy
    .map(tag => categoryMap[tag] || tag)
    .filter(Boolean);

  // Use publication date or year
  const publishedDate = ssPaper.publicationDate || 
    (ssPaper.year ? `${ssPaper.year}-01-01` : new Date().toISOString());

  return {
    id: ssPaper.paperId || `ss-${Date.now()}-${Math.random()}`,
    semanticScholarId: ssPaper.paperId,
    arxivId: arxivId,
    title: ssPaper.title || 'Untitled',
    authors: authors,
    summary: ssPaper.abstract || '',
    published: publishedDate,
    date: ssPaper.year ? ssPaper.year.toString() : new Date(publishedDate).getFullYear().toString(),
    year: ssPaper.year || new Date(publishedDate).getFullYear(),
    link: arxivId 
      ? `https://arxiv.org/abs/${arxivId}` 
      : `https://www.semanticscholar.org/paper/${ssPaper.paperId}`,
    pdfLink: ssPaper.openAccessPdf?.url || 
      (arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : null),
    venue: ssPaper.venue || 'Semantic Scholar',
    citations: ssPaper.citationCount || 0,
    influentialCitations: ssPaper.influentialCitationCount || 0,
    referenceCount: ssPaper.referenceCount || 0,
    tags: mappedTags.length > 0 ? mappedTags : ['AI Research'],
    categories: fieldsOfStudy,
    relatedStartups: [] // Will be populated by matching logic
  };
}

