import axios from 'axios';

const CROSSREF_API = 'https://api.crossref.org/works';

/**
 * Rate limiter for Crossref API (50 req/sec limit, use 10/sec for polite use)
 */
class CrossrefRateLimiter {
  constructor(requestsPerSecond = 10) {
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

const rateLimiter = new CrossrefRateLimiter(10); // 10 requests per second

/**
 * Simple English language detection
 * Returns true if text appears to be in English
 */
function isEnglish(text) {
  if (!text || typeof text !== 'string') {
    return true; // Assume English if no text
  }

  // Remove common punctuation and numbers
  const cleanText = text.replace(/[0-9\.,;:!?\-\(\)\[\]{}'"]/g, ' ').trim();
  
  if (cleanText.length < 3) {
    return true; // Too short to determine, assume English
  }

  // Check for non-Latin scripts (Chinese, Japanese, Korean, Arabic, Cyrillic, etc.)
  const nonLatinPattern = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0600-\u06FF\u0400-\u04FF]/;
  if (nonLatinPattern.test(text)) {
    return false;
  }

  // Check if text is mostly ASCII (English uses ASCII)
  const asciiChars = (text.match(/[a-zA-Z\s]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  const asciiRatio = totalChars > 0 ? asciiChars / totalChars : 1;
  
  // If less than 70% ASCII, likely not English
  if (asciiRatio < 0.7) {
    return false;
  }

  // Check for common English words (simple heuristic)
  const commonEnglishWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'been', 'have', 'has', 'will', 'can', 'may', 'not', 'all', 'but', 'use', 'new', 'more', 'most', 'some', 'such', 'only', 'also', 'into', 'over', 'after', 'first', 'second', 'other', 'many', 'these', 'their', 'there', 'where', 'which', 'when', 'what', 'about', 'which', 'research', 'paper', 'study', 'method', 'result', 'analysis', 'data', 'model', 'system', 'algorithm', 'learning', 'network', 'neural', 'artificial', 'intelligence', 'machine'];
  const lowerText = text.toLowerCase();
  const englishWordCount = commonEnglishWords.filter(word => lowerText.includes(word)).length;
  
  // If we find at least 2 common English words, likely English
  if (englishWordCount >= 2) {
    return true;
  }

  // If text is short and mostly ASCII, assume English
  if (cleanText.length < 20 && asciiRatio > 0.8) {
    return true;
  }

  // Default: if mostly ASCII, assume English
  return asciiRatio > 0.8;
}

/**
 * Transform Crossref work format to our internal format
 */
export function transformCrossrefPaper(work) {
  if (!work || !work.DOI) {
    return null;
  }

  // Extract authors
  const authors = work.author 
    ? work.author.map(a => {
        if (a.given && a.family) {
          return `${a.given} ${a.family}`;
        } else if (a.name) {
          return a.name;
        } else if (a.family) {
          return a.family;
        }
        return null;
      }).filter(Boolean)
    : [];

  // Extract DOI
  const doi = work.DOI || null;

  // Extract tags from subject categories
  const subjects = work.subject || [];
  const tags = subjects.slice(0, 10); // Limit to top 10 subjects

  // Publication date
  let publishedDate;
  if (work.published && work.published['date-parts'] && work.published['date-parts'][0]) {
    const dateParts = work.published['date-parts'][0];
    if (dateParts.length >= 3) {
      publishedDate = `${dateParts[0]}-${String(dateParts[1]).padStart(2, '0')}-${String(dateParts[2]).padStart(2, '0')}`;
    } else if (dateParts.length === 2) {
      publishedDate = `${dateParts[0]}-${String(dateParts[1]).padStart(2, '0')}-01`;
    } else if (dateParts.length === 1) {
      publishedDate = `${dateParts[0]}-01-01`;
    }
  }
  
  if (!publishedDate && work.published && work.published['date-parts']) {
    // Fallback to first available date
    const firstDate = work.published['date-parts'].find(d => d && d.length > 0);
    if (firstDate) {
      if (firstDate.length >= 3) {
        publishedDate = `${firstDate[0]}-${String(firstDate[1]).padStart(2, '0')}-${String(firstDate[2]).padStart(2, '0')}`;
      } else if (firstDate.length === 2) {
        publishedDate = `${firstDate[0]}-${String(firstDate[1]).padStart(2, '0')}-01`;
      } else {
        publishedDate = `${firstDate[0]}-01-01`;
      }
    }
  }

  if (!publishedDate) {
    publishedDate = new Date().toISOString();
  }

  // Extract venue/journal
  const venue = work['container-title'] 
    ? (Array.isArray(work['container-title']) ? work['container-title'][0] : work['container-title'])
    : (work.publisher || 'Crossref');

  // Extract abstract
  const summary = work.abstract || '';

  // Extract title
  const title = work.title ? (Array.isArray(work.title) ? work.title[0] : work.title) : 'Untitled';

  // Filter out non-English papers
  if (!isEnglish(title) || (summary && !isEnglish(summary))) {
    return null;
  }

  // Build link
  const link = doi ? `https://doi.org/${doi}` : (work.URL || work.DOI);

  // Extract PDF link if available
  const pdfLink = work.link && work.link.length > 0 
    ? work.link.find(l => l['content-type'] === 'application/pdf')?.URL || work.link[0].URL
    : null;

  // Extract year
  const year = work.published && work.published['date-parts'] && work.published['date-parts'][0]
    ? work.published['date-parts'][0][0]
    : new Date(publishedDate).getFullYear();

  return {
    id: doi ? doi.replace(/[^a-zA-Z0-9]/g, '_') : `crossref_${Date.now()}_${Math.random()}`,
    crossrefId: doi,
    doi: doi,
    title: title,
    authors: authors,
    summary: summary,
    published: publishedDate,
    date: year.toString(),
    year: year,
    link: link,
    pdfLink: pdfLink,
    venue: venue,
    citations: work['is-referenced-by-count'] || 0,
    influentialCitations: 0, // Crossref doesn't have this metric
    referenceCount: work['references-count'] || 0,
    tags: tags.length > 0 ? tags : ['Research'],
    categories: subjects,
    relatedStartups: []
  };
}

/**
 * Fetch latest papers from Crossref
 * @param {number} limit - Maximum number of papers to fetch
 * @param {Date} dateThreshold - Only fetch papers newer than this date
 * @returns {Promise<Array>} Array of paper objects
 */
export async function fetchLatestPapersFromCrossref(limit = 300, dateThreshold = null) {
  try {
    const allPapers = [];
    let offset = 0;
    const perPage = 1000; // Crossref allows up to 1000 per request
    const maxPages = Math.ceil(limit / perPage) + 1; // Fetch a bit more to account for filtering
    let pagesFetched = 0;

    // Build date filter with English language filter
    let dateFilter = 'type:journal-article,type:proceedings-article,language:en';
    if (dateThreshold) {
      const thresholdDate = new Date(dateThreshold);
      const dateStr = thresholdDate.toISOString().split('T')[0];
      dateFilter += `,from-pub-date:${dateStr}`;
    }

    console.log(`🔍 Fetching papers from Crossref${dateThreshold ? ` (after ${dateThreshold.toISOString().split('T')[0]})` : ''}...`);

    while (pagesFetched < maxPages && allPapers.length < limit) {
      try {
        const response = await rateLimiter.execute(async () => {
          return await axios.get(CROSSREF_API, {
            params: {
              filter: dateFilter,
              sort: 'published',
              order: 'desc',
              rows: perPage,
              offset: offset
            },
            headers: {
              'User-Agent': 'AI-Hub/1.0 (mailto:ai-hub@example.com)' // Polite use header
            }
          });
        });

        if (!response.data || !response.data.message || !response.data.message.items) {
          break;
        }

        const works = response.data.message.items;
        if (works.length === 0) {
          break;
        }

        // Transform papers
        const transformed = works
          .map(transformCrossrefPaper)
          .filter(p => p !== null);

        allPapers.push(...transformed);

        // Check if we have more pages
        const totalResults = response.data.message['total-results'] || 0;
        offset += perPage;
        
        if (offset >= totalResults || works.length < perPage) {
          break;
        }

        pagesFetched++;
        console.log(`📄 Fetched page ${pagesFetched} from Crossref: ${transformed.length} papers (total: ${allPapers.length})`);

      } catch (pageError) {
        if (pageError.response && pageError.response.status === 429) {
          console.error('⚠️ Crossref rate limit hit. Waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          continue; // Retry this page
        } else {
          console.error(`⚠️ Error fetching Crossref page ${pagesFetched + 1}:`, pageError.message);
          break;
        }
      }
    }

    // Sort by publication date (most recent first) and limit
    allPapers.sort((a, b) => {
      const dateA = new Date(a.published || 0);
      const dateB = new Date(b.published || 0);
      return dateB.getTime() - dateA.getTime();
    });

    const limitedPapers = allPapers.slice(0, limit);
    console.log(`✅ Fetched ${limitedPapers.length} papers from Crossref`);
    
    return limitedPapers;

  } catch (error) {
    console.error('❌ Error fetching papers from Crossref:', error.message);
    return [];
  }
}

/**
 * Search Crossref for papers by query
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of paper objects
 */
export async function searchCrossref(query, limit = 50) {
  try {
    const response = await rateLimiter.execute(async () => {
      return await axios.get(CROSSREF_API, {
        params: {
          query: query,
          sort: 'relevance',
          rows: Math.min(limit, 1000),
        },
        headers: {
          'User-Agent': 'AI-Hub/1.0 (mailto:ai-hub@example.com)'
        }
      });
    });

    if (!response.data || !response.data.message || !response.data.message.items) {
      return [];
    }

    const works = response.data.message.items;
    const papers = works
      .map(transformCrossrefPaper)
      .filter(p => p !== null);

    return papers.slice(0, limit);
  } catch (error) {
    console.error('❌ Error searching Crossref:', error.message);
    return [];
  }
}

