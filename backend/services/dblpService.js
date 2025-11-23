import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

const DBLP_API = 'https://dblp.org/search/publ/api';

/**
 * Rate limiter for DBLP (be respectful, ~1 req/sec)
 */
class DBLPRateLimiter {
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

const rateLimiter = new DBLPRateLimiter(1); // 1 request per second

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
  const commonEnglishWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'been', 'have', 'has', 'will', 'can', 'may', 'not', 'all', 'but', 'use', 'new', 'more', 'most', 'some', 'such', 'only', 'also', 'into', 'over', 'after', 'first', 'second', 'other', 'many', 'these', 'their', 'there', 'where', 'which', 'when', 'what', 'about', 'which', 'research', 'paper', 'study', 'method', 'result', 'analysis', 'data', 'model', 'system', 'algorithm', 'learning', 'network', 'neural', 'artificial', 'intelligence', 'machine', 'computer', 'conference', 'proceedings', 'journal'];
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
 * Transform DBLP entry format to our internal format
 */
export function transformDBLPEntry(entry) {
  if (!entry || !entry.title) {
    return null;
  }

  // Extract title
  const title = entry.title._ || entry.title || 'Untitled';

  // Filter out non-English papers
  if (!isEnglish(title)) {
    return null;
  }

  // Extract authors
  const authors = [];
  if (entry.author) {
    const authorList = Array.isArray(entry.author) ? entry.author : [entry.author];
    authorList.forEach(author => {
      const authorName = author._ || author || '';
      if (authorName) {
        authors.push(authorName);
      }
    });
  }

  // Extract year
  const year = entry.year ? parseInt(entry.year) : new Date().getFullYear();

  // Extract venue
  let venue = 'DBLP';
  if (entry.venue) {
    venue = entry.venue._ || entry.venue || 'DBLP';
  } else if (entry.booktitle) {
    venue = entry.booktitle._ || entry.booktitle || 'DBLP';
  } else if (entry.journal) {
    venue = entry.journal._ || entry.journal || 'DBLP';
  }

  // Extract DOI if available
  const doi = entry.doi?._ || entry.doi || null;

  // Extract DBLP key
  const dblpKey = entry.$.key || null;

  // Extract URL
  const url = entry.url?._ || entry.url || (dblpKey ? `https://dblp.org/rec/${dblpKey}` : null);

  // Extract pages (for conference info)
  const pages = entry.pages?._ || entry.pages || null;

  // Publication date (use year, default to Jan 1)
  const publishedDate = `${year}-01-01`;

  // Generate tags from venue (top AI/ML conferences)
  const tags = [];
  const venueLower = venue.toLowerCase();
  if (venueLower.includes('neurips') || venueLower.includes('nips')) {
    tags.push('NeurIPS', 'Machine Learning');
  } else if (venueLower.includes('icml')) {
    tags.push('ICML', 'Machine Learning');
  } else if (venueLower.includes('iclr')) {
    tags.push('ICLR', 'Deep Learning');
  } else if (venueLower.includes('aaai')) {
    tags.push('AAAI', 'Artificial Intelligence');
  } else if (venueLower.includes('ijcai')) {
    tags.push('IJCAI', 'Artificial Intelligence');
  } else if (venueLower.includes('cvpr')) {
    tags.push('CVPR', 'Computer Vision');
  } else if (venueLower.includes('iccv')) {
    tags.push('ICCV', 'Computer Vision');
  } else if (venueLower.includes('acl')) {
    tags.push('ACL', 'NLP');
  } else if (venueLower.includes('emnlp')) {
    tags.push('EMNLP', 'NLP');
  } else {
    tags.push('Computer Science');
  }

  return {
    id: dblpKey ? dblpKey.replace(/[^a-zA-Z0-9]/g, '_') : `dblp_${Date.now()}_${Math.random()}`,
    dblpKey: dblpKey,
    doi: doi,
    title: typeof title === 'string' ? title : (title._ || 'Untitled'),
    authors: authors,
    summary: '', // DBLP doesn't provide abstracts
    published: publishedDate,
    date: year.toString(),
    year: year,
    link: url || (doi ? `https://doi.org/${doi}` : null),
    pdfLink: null, // DBLP doesn't provide direct PDF links
    venue: typeof venue === 'string' ? venue : (venue._ || 'DBLP'),
    citations: 0, // DBLP doesn't provide citation counts
    influentialCitations: 0,
    referenceCount: 0,
    tags: tags.length > 0 ? tags : ['Computer Science'],
    categories: tags,
    relatedStartups: []
  };
}

/**
 * Fetch latest papers from DBLP
 * @param {number} limit - Maximum number of papers to fetch
 * @param {Date} dateThreshold - Only fetch papers newer than this date
 * @returns {Promise<Array>} Array of paper objects
 */
export async function fetchLatestPapersFromDBLP(limit = 100, dateThreshold = null) {
  try {
    const allPapers = [];
    
    // Determine year range
    const currentYear = new Date().getFullYear();
    let startYear = currentYear;
    
    if (dateThreshold) {
      const thresholdYear = new Date(dateThreshold).getFullYear();
      startYear = thresholdYear;
    }

    // Top AI/ML conferences to query
    const venues = [
      'NeurIPS',
      'ICML',
      'ICLR',
      'AAAI',
      'CVPR',
      'ICCV',
      'ACL',
      'EMNLP'
    ];

    console.log(`🔍 Fetching papers from DBLP${dateThreshold ? ` (after ${dateThreshold.toISOString().split('T')[0]})` : ''}...`);

    // Query each venue for recent years
    const yearsToQuery = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearsToQuery.push(year);
    }

    const papersPerVenue = Math.ceil(limit / venues.length);
    const venuesToQuery = venues.slice(0, Math.min(venues.length, 5)); // Limit to 5 venues to avoid too many requests

    for (const venue of venuesToQuery) {
      for (const year of yearsToQuery.slice(-2)) { // Only query last 2 years
        try {
          const response = await rateLimiter.execute(async () => {
            return await axios.get(DBLP_API, {
              params: {
                q: venue,
                h: papersPerVenue, // Number of results
                format: 'xml'
              }
            });
          });

          const result = await parseXML(response.data);
          
          // DBLP XML structure: result.hits.hit
          const hits = result.result?.hits?.hit || [];
          if (!Array.isArray(hits)) {
            if (hits.info) {
              // Single hit
              const entry = hits.info;
              const transformed = transformDBLPEntry(entry);
              if (transformed && transformed.year >= startYear) {
                allPapers.push(transformed);
              }
            }
          } else {
            hits.forEach(hit => {
              if (hit.info) {
                const entry = hit.info;
                const transformed = transformDBLPEntry(entry);
                if (transformed && transformed.year >= startYear) {
                  // Filter by date threshold if provided
                  if (dateThreshold) {
                    const paperDate = new Date(transformed.published);
                    if (paperDate >= dateThreshold) {
                      allPapers.push(transformed);
                    }
                  } else {
                    allPapers.push(transformed);
                  }
                }
              }
            });
          }

        } catch (venueError) {
          console.error(`⚠️ Error fetching DBLP papers for ${venue} ${year}:`, venueError.message);
          continue;
        }

        // Small delay between queries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Remove duplicates by DBLP key
    const uniquePapers = [];
    const seenKeys = new Set();
    
    allPapers.forEach(paper => {
      if (paper.dblpKey && !seenKeys.has(paper.dblpKey)) {
        seenKeys.add(paper.dblpKey);
        uniquePapers.push(paper);
      } else if (!paper.dblpKey) {
        // Papers without DBLP key - check by title
        const titleKey = paper.title.toLowerCase().trim();
        if (!seenKeys.has(`title:${titleKey}`)) {
          seenKeys.add(`title:${titleKey}`);
          uniquePapers.push(paper);
        }
      }
    });

    // Sort by publication date (most recent first) and limit
    uniquePapers.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      const dateA = new Date(a.published || 0);
      const dateB = new Date(b.published || 0);
      return dateB.getTime() - dateA.getTime();
    });

    const limitedPapers = uniquePapers.slice(0, limit);
    console.log(`✅ Fetched ${limitedPapers.length} papers from DBLP`);
    
    return limitedPapers;

  } catch (error) {
    console.error('❌ Error fetching papers from DBLP:', error.message);
    return [];
  }
}

