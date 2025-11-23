import axios from 'axios';

const OPENALEX_API = 'https://api.openalex.org';

/**
 * Simple rate limiter for OpenAlex (100k requests/day = ~1.16 req/sec, we'll use 1 req/sec)
 */
class OpenAlexRateLimiter {
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

const rateLimiter = new OpenAlexRateLimiter(1); // 1 request per second

/**
 * Transform OpenAlex work format to our internal format
 */
export function transformOpenAlexPaper(work) {
  if (!work || !work.id) {
    return null;
  }

  // Extract authors
  const authors = work.authorships 
    ? work.authorships.map(a => {
        const author = a.author;
        if (author && author.display_name) {
          return author.display_name;
        }
        return null;
      }).filter(Boolean)
    : [];

  // Extract arXiv ID if available
  const arxivId = work.ids?.arxiv ? work.ids.arxiv.replace('https://arxiv.org/abs/', '') : null;

  // Extract tags from concepts (OpenAlex's topic classification)
  const concepts = work.concepts || [];
  const tags = concepts
    .filter(c => c.score > 0.3) // Only include concepts with significant relevance
    .map(c => c.display_name)
    .slice(0, 10); // Limit to top 10 concepts

  // Determine categories from primary concepts
  const primaryConcepts = concepts
    .filter(c => c.level === 0 || c.score > 0.5)
    .map(c => c.display_name);

  // Publication date
  const publishedDate = work.publication_date || 
    (work.publication_year ? `${work.publication_year}-01-01` : new Date().toISOString());

  // Extract venue/journal
  const venue = work.primary_location?.source?.display_name || 
    work.venues?.[0]?.display_name || 
    'OpenAlex';

  // Extract PDF link
  const pdfLink = work.open_access?.is_oa && work.open_access.oa_url
    ? work.open_access.oa_url
    : (arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : null);

  // Extract DOI
  const doi = work.doi || (work.ids?.doi ? work.ids.doi.replace('https://doi.org/', '') : null);

  // Build link
  let link = work.primary_location?.landing_page_url || 
    (doi ? `https://doi.org/${doi}` : null) ||
    (arxivId ? `https://arxiv.org/abs/${arxivId}` : work.id);

  return {
    id: work.id.replace('https://openalex.org/', 'W'),
    openAlexId: work.id,
    arxivId: arxivId,
    doi: doi,
    title: work.title || 'Untitled',
    authors: authors,
    summary: work.abstract || '',
    published: publishedDate,
    date: work.publication_year ? work.publication_year.toString() : new Date(publishedDate).getFullYear().toString(),
    year: work.publication_year || new Date(publishedDate).getFullYear(),
    link: link,
    pdfLink: pdfLink,
    venue: venue,
    citations: work.cited_by_count || 0,
    influentialCitations: 0, // OpenAlex doesn't have this metric
    referenceCount: work.referenced_works?.length || 0,
    tags: tags.length > 0 ? tags : ['Research'],
    categories: primaryConcepts,
    relatedStartups: []
  };
}

/**
 * Fetch latest papers from OpenAlex
 * @param {number} limit - Maximum number of papers to fetch
 * @param {Date} dateThreshold - Only fetch papers newer than this date
 * @returns {Promise<Array>} Array of paper objects
 */
export async function fetchLatestPapersFromOpenAlex(limit = 500, dateThreshold = null) {
  try {
    const allPapers = [];
    let cursor = '*';
    const perPage = 200; // OpenAlex allows up to 200 per page
    const maxPages = Math.ceil(limit / perPage) + 1; // Fetch a bit more to account for filtering
    let pagesFetched = 0;

    // Build date filter
    let dateFilter = '';
    if (dateThreshold) {
      const thresholdDate = new Date(dateThreshold);
      // Format: YYYY-MM-DD
      const dateStr = thresholdDate.toISOString().split('T')[0];
      dateFilter = `,from_publication_date:${dateStr}`;
    }

    console.log(`🔍 Fetching papers from OpenAlex${dateFilter ? ` (after ${dateFilter.replace(',from_publication_date:', '')})` : ''}...`);

    while (pagesFetched < maxPages && allPapers.length < limit) {
      try {
        const response = await rateLimiter.execute(async () => {
          return await axios.get(`${OPENALEX_API}/works`, {
            params: {
              filter: `is_oa:true${dateFilter}`, // Only open access papers
              sort: 'publication_date:desc',
              per_page: perPage,
              cursor: cursor,
              // Add email for better performance (optional but recommended)
              mailto: 'ai-hub@example.com' // You can change this to your email
            }
          });
        });

        if (!response.data || !response.data.results) {
          break;
        }

        const works = response.data.results;
        if (works.length === 0) {
          break;
        }

        // Transform papers
        const transformed = works
          .map(transformOpenAlexPaper)
          .filter(p => p !== null);

        allPapers.push(...transformed);

        // Get next cursor for pagination
        cursor = response.data.meta?.next_cursor || null;
        if (!cursor) {
          break;
        }

        pagesFetched++;
        console.log(`📄 Fetched page ${pagesFetched} from OpenAlex: ${transformed.length} papers (total: ${allPapers.length})`);

        // If we got fewer papers than requested, we might be at the end
        if (works.length < perPage) {
          break;
        }

      } catch (pageError) {
        if (pageError.response && pageError.response.status === 429) {
          console.error('⚠️ OpenAlex rate limit hit. Waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          continue; // Retry this page
        } else {
          console.error(`⚠️ Error fetching OpenAlex page ${pagesFetched + 1}:`, pageError.message);
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
    console.log(`✅ Fetched ${limitedPapers.length} papers from OpenAlex`);
    
    return limitedPapers;

  } catch (error) {
    console.error('❌ Error fetching papers from OpenAlex:', error.message);
    return [];
  }
}

/**
 * Search OpenAlex for papers by query
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of paper objects
 */
export async function searchOpenAlex(query, limit = 50) {
  try {
    const response = await rateLimiter.execute(async () => {
      return await axios.get(`${OPENALEX_API}/works`, {
        params: {
          search: query,
          sort: 'cited_by_count:desc',
          per_page: Math.min(limit, 200),
          mailto: 'ai-hub@example.com'
        }
      });
    });

    if (!response.data || !response.data.results) {
      return [];
    }

    const works = response.data.results;
    const papers = works
      .map(transformOpenAlexPaper)
      .filter(p => p !== null);

    return papers.slice(0, limit);
  } catch (error) {
    console.error('❌ Error searching OpenAlex:', error.message);
    return [];
  }
}

