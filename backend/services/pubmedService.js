import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * Rate limiter for PubMed API (3 req/sec limit, use 2/sec for safety)
 */
class PubMedRateLimiter {
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

const rateLimiter = new PubMedRateLimiter(2); // 2 requests per second

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
  const commonEnglishWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'been', 'have', 'has', 'will', 'can', 'may', 'not', 'all', 'but', 'use', 'new', 'more', 'most', 'some', 'such', 'only', 'also', 'into', 'over', 'after', 'first', 'second', 'other', 'many', 'these', 'their', 'there', 'where', 'which', 'when', 'what', 'about', 'which', 'research', 'paper', 'study', 'method', 'result', 'analysis', 'data', 'model', 'system', 'algorithm', 'learning', 'network', 'neural', 'artificial', 'intelligence', 'machine', 'patient', 'clinical', 'treatment', 'disease', 'medical', 'health', 'diagnosis'];
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
 * Transform PubMed article format to our internal format
 */
export function transformPubMedPaper(article) {
  if (!article || !article.PubmedData || !article.MedlineCitation) {
    return null;
  }

  const citation = article.MedlineCitation;
  const pubmedData = article.PubmedData;
  
  // Extract PMID
  const pmid = pubmedData.ArticleIdList?.ArticleId?.find(id => id.$.IdType === 'pubmed')?._ || 
               citation.PMID?._ || 
               citation.PMID?.[0]?._ || null;

  if (!pmid) {
    return null;
  }

  // Extract title
  const title = citation.Article?.ArticleTitle?._ || 
                citation.Article?.ArticleTitle?.[0]?._ || 
                citation.Article?.ArticleTitle || 
                'Untitled';

  // Extract authors
  const authors = [];
  if (citation.Article?.AuthorList?.Author) {
    const authorList = Array.isArray(citation.Article.AuthorList.Author) 
      ? citation.Article.AuthorList.Author 
      : [citation.Article.AuthorList.Author];
    
    authorList.forEach(author => {
      if (author.LastName && author.ForeName) {
        authors.push(`${author.ForeName} ${author.LastName}`);
      } else if (author.LastName) {
        authors.push(author.LastName);
      } else if (author.CollectiveName) {
        authors.push(author.CollectiveName);
      }
    });
  }

  // Extract abstract
  let summary = '';
  if (citation.Article?.Abstract?.AbstractText) {
    const abstractText = citation.Article.Abstract.AbstractText;
    if (Array.isArray(abstractText)) {
      summary = abstractText.map(text => {
        if (typeof text === 'string') return text;
        if (text._) return text._;
        if (text.Label) return `${text.Label}: ${text._ || ''}`;
        return '';
      }).filter(Boolean).join(' ');
    } else if (typeof abstractText === 'string') {
      summary = abstractText;
    } else if (abstractText._) {
      summary = abstractText._;
    }
  }

  // Extract title string
  const titleStr = typeof title === 'string' ? title : (title._ || 'Untitled');

  // Filter out non-English papers
  if (!isEnglish(titleStr) || (summary && !isEnglish(summary))) {
    return null;
  }

  // Extract publication date
  let publishedDate;
  const pubDate = citation.Article?.Journal?.JournalIssue?.PubDate;
  if (pubDate) {
    if (pubDate.Year && pubDate.Month && pubDate.Day) {
      publishedDate = `${pubDate.Year}-${String(pubDate.Month).padStart(2, '0')}-${String(pubDate.Day).padStart(2, '0')}`;
    } else if (pubDate.Year && pubDate.Month) {
      publishedDate = `${pubDate.Year}-${String(pubDate.Month).padStart(2, '0')}-01`;
    } else if (pubDate.Year) {
      publishedDate = `${pubDate.Year}-01-01`;
    }
  }
  
  if (!publishedDate) {
    publishedDate = new Date().toISOString();
  }

  // Extract year
  const year = pubDate?.Year ? parseInt(pubDate.Year) : new Date(publishedDate).getFullYear();

  // Extract journal/venue
  const venue = citation.Article?.Journal?.Title?._ || 
                citation.Article?.Journal?.Title || 
                'PubMed';

  // Extract DOI if available
  const doi = pubmedData.ArticleIdList?.ArticleId?.find(id => id.$.IdType === 'doi')?._ || null;

  // Extract MeSH terms for tags/categories
  const meshTerms = [];
  if (citation.MeshHeadingList?.MeshHeading) {
    const headings = Array.isArray(citation.MeshHeadingList.MeshHeading)
      ? citation.MeshHeadingList.MeshHeading
      : [citation.MeshHeadingList.MeshHeading];
    
    headings.forEach(heading => {
      if (heading.DescriptorName?._) {
        meshTerms.push(heading.DescriptorName._);
      }
    });
  }

  // Filter for AI/ML related terms
  const aiKeywords = ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 
                      'computer vision', 'natural language processing', 'robotics', 'algorithm'];
  const relevantTags = meshTerms.filter(term => 
    aiKeywords.some(keyword => term.toLowerCase().includes(keyword))
  ).slice(0, 10);

  // Build link
  const link = `https://pubmed.ncbi.nlm.nih.gov/${pmid}`;

  // Extract PDF link if available
  const pdfLink = citation.OtherAbstract?.AbstractText?.find(ab => ab.$.Type === 'pdf')?.URL || null;

  return {
    id: `pmid_${pmid}`,
    pubmedId: pmid,
    doi: doi,
    title: titleStr,
    authors: authors,
    summary: summary,
    published: publishedDate,
    date: year.toString(),
    year: year,
    link: link,
    pdfLink: pdfLink,
    venue: typeof venue === 'string' ? venue : (venue._ || 'PubMed'),
    citations: 0, // PubMed doesn't provide citation count directly
    influentialCitations: 0,
    referenceCount: 0,
    tags: relevantTags.length > 0 ? relevantTags : ['Healthcare AI', 'Biomedical Research'],
    categories: meshTerms.slice(0, 10),
    relatedStartups: []
  };
}

/**
 * Fetch latest papers from PubMed
 * @param {number} limit - Maximum number of papers to fetch
 * @param {Date} dateThreshold - Only fetch papers newer than this date
 * @returns {Promise<Array>} Array of paper objects
 */
export async function fetchLatestPapersFromPubMed(limit = 150, dateThreshold = null) {
  try {
    const allPapers = [];
    
    // AI/ML related search terms for PubMed
    const searchTerms = [
      'artificial intelligence',
      'machine learning',
      'deep learning',
      'neural network',
      'computer vision',
      'natural language processing'
    ];

    // Build date range filter
    let mindate = '';
    let maxdate = '';
    if (dateThreshold) {
      const thresholdDate = new Date(dateThreshold);
      mindate = `${thresholdDate.getFullYear()}/${String(thresholdDate.getMonth() + 1).padStart(2, '0')}/${String(thresholdDate.getDate()).padStart(2, '0')}`;
      maxdate = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getDate()).padStart(2, '0')}`;
    } else {
      // Default: last 2 years
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      mindate = `${twoYearsAgo.getFullYear()}/01/01`;
      maxdate = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getDate()).padStart(2, '0')}`;
    }

    console.log(`🔍 Fetching papers from PubMed${dateThreshold ? ` (after ${dateThreshold.toISOString().split('T')[0]})` : ''}...`);

    // Search for papers using each term (limit to avoid too many requests)
    const termsToUse = searchTerms.slice(0, 3); // Use first 3 terms to avoid rate limits
    const papersPerTerm = Math.ceil(limit / termsToUse.length);

    for (const term of termsToUse) {
      try {
        // Step 1: Search for article IDs (filter for English language)
        const searchResponse = await rateLimiter.execute(async () => {
          return await axios.get(`${PUBMED_BASE}/esearch.fcgi`, {
            params: {
              db: 'pubmed',
              term: `${term} AND english[Language]`, // Filter for English language
              mindate: mindate,
              maxdate: maxdate,
              retmax: papersPerTerm + 20, // Get more to account for filtering
              retmode: 'xml',
              sort: 'pub_date'
            }
          });
        });

        const searchResult = await parseXML(searchResponse.data);
        const idList = searchResult.eSearchResult?.IdList?.Id || [];
        
        if (!idList || idList.length === 0) {
          continue;
        }

        const ids = Array.isArray(idList) 
          ? idList.map(id => typeof id === 'string' ? id : id._ || id)
          : [typeof idList === 'string' ? idList : idList._ || idList];

        if (ids.length === 0) {
          continue;
        }

        // Step 2: Fetch article details
        const fetchResponse = await rateLimiter.execute(async () => {
          return await axios.get(`${PUBMED_BASE}/efetch.fcgi`, {
            params: {
              db: 'pubmed',
              id: ids.slice(0, papersPerTerm).join(','),
              retmode: 'xml',
              rettype: 'abstract'
            }
          });
        });

        const fetchResult = await parseXML(fetchResponse.data);
        const articles = fetchResult.PubmedArticleSet?.PubmedArticle || 
                        fetchResult.PubmedArticleSet?.PubmedBookArticle ||
                        [];

        if (!Array.isArray(articles)) {
          const singleArticle = articles;
          if (singleArticle) {
            const transformed = transformPubMedPaper(singleArticle);
            if (transformed) {
              allPapers.push(transformed);
            }
          }
        } else {
          articles.forEach(article => {
            const transformed = transformPubMedPaper(article);
            if (transformed) {
              allPapers.push(transformed);
            }
          });
        }

        console.log(`📄 Fetched ${articles.length || 0} papers from PubMed for term "${term}"`);

      } catch (termError) {
        if (termError.response && termError.response.status === 429) {
          console.error(`⚠️ PubMed rate limit hit for term "${term}". Waiting...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        } else {
          console.error(`⚠️ Error fetching PubMed papers for term "${term}":`, termError.message);
          continue;
        }
      }

      // Small delay between terms
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Remove duplicates by PMID
    const uniquePapers = [];
    const seenPmids = new Set();
    
    allPapers.forEach(paper => {
      if (paper.pubmedId && !seenPmids.has(paper.pubmedId)) {
        seenPmids.add(paper.pubmedId);
        uniquePapers.push(paper);
      }
    });

    // Sort by publication date (most recent first) and limit
    uniquePapers.sort((a, b) => {
      const dateA = new Date(a.published || 0);
      const dateB = new Date(b.published || 0);
      return dateB.getTime() - dateA.getTime();
    });

    const limitedPapers = uniquePapers.slice(0, limit);
    console.log(`✅ Fetched ${limitedPapers.length} papers from PubMed`);
    
    return limitedPapers;

  } catch (error) {
    console.error('❌ Error fetching papers from PubMed:', error.message);
    return [];
  }
}

