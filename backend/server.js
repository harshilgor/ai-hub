import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { fetchArXivPapers, fetchArXivLatest, categorizePapersByIndustry } from './services/arxivService.js';
import { 
  enrichPaperWithSemanticScholar,
  fetchLatestPapersFromSemanticScholar,
  fetchPapersBatch,
  getPaperAutocomplete,
  transformSemanticScholarPaper
} from './services/semanticScholarService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory cache
let papersCache = [];
let lastFetchTime = null;
let industryStats = {};
let lastPaperDate = null; // Track the date of the newest paper we've seen

// Database file path
const DB_PATH = path.join(__dirname, 'data', 'papers.json');

/**
 * Load papers from database
 */
async function loadPapersFromDB() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    papersCache = parsed.papers || [];
    lastFetchTime = parsed.lastFetchTime;
    industryStats = parsed.industryStats || {};
    lastPaperDate = parsed.lastPaperDate || null;
    
    // If we have papers, set lastPaperDate to the newest one
    if (papersCache.length > 0 && !lastPaperDate) {
      papersCache.sort((a, b) => {
        const dateA = new Date(a.published || a.updated || 0);
        const dateB = new Date(b.published || b.updated || 0);
        return dateB.getTime() - dateA.getTime();
      });
      const newest = new Date(papersCache[0].published || papersCache[0].updated || 0);
      lastPaperDate = newest.toISOString();
    }
    
    // If lastPaperDate is too old (more than 7 days), reset it to ensure fresh papers
    if (lastPaperDate) {
      const lastDate = new Date(lastPaperDate);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      if (lastDate < sevenDaysAgo) {
        console.log('⚠️ Last paper date is too old, resetting to last 7 days');
        lastPaperDate = sevenDaysAgo.toISOString();
      }
    }
    
    console.log(`📚 Loaded ${papersCache.length} papers from database`);
    if (lastPaperDate) {
      console.log(`📅 Last paper date: ${lastPaperDate}`);
    }
  } catch (error) {
    console.log('📝 No existing database found, will create new one');
    papersCache = [];
  }
}

/**
 * Save papers to database
 */
async function savePapersToDP() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(
      DB_PATH,
      JSON.stringify({
        papers: papersCache,
        lastFetchTime: lastFetchTime,
        industryStats: industryStats,
        lastPaperDate: lastPaperDate
      }, null, 2)
    );
    console.log(`💾 Saved ${papersCache.length} papers to database`);
  } catch (error) {
    console.error('❌ Error saving to database:', error.message);
  }
}

/**
 * Extract arXiv ID from URL or ID
 */
function extractArxivId(linkOrId) {
  if (!linkOrId) return null;
  if (typeof linkOrId === 'string') {
    const match = linkOrId.match(/arxiv\.org\/abs\/([0-9]+\.[0-9]+v?[0-9]*)/);
    if (match) return match[1];
    // If it's already an arXiv ID format
    if (/^[0-9]+\.[0-9]+v?[0-9]*$/.test(linkOrId)) return linkOrId;
  }
  return null;
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Enhanced deduplication - checks multiple levels
 */
function removeDuplicatePapers(papers) {
  const seen = new Map();
  const unique = [];
  
  for (const paper of papers) {
    let isDuplicate = false;
    
    // Level 1: Check by arXiv ID
    const arxivId = paper.arxivId || extractArxivId(paper.link);
    if (arxivId && seen.has(`arxiv:${arxivId}`)) {
      isDuplicate = true;
    }
    
    // Level 2: Check by Semantic Scholar ID
    if (!isDuplicate && paper.semanticScholarId && seen.has(`ss:${paper.semanticScholarId}`)) {
      isDuplicate = true;
    }
    
    // Level 3: Check by normalized title (fuzzy match)
    if (!isDuplicate) {
      const titleKey = normalizeTitle(paper.title);
      if (seen.has(`title:${titleKey}`)) {
        isDuplicate = true;
      }
    }
    
    // Level 4: Check by DOI if available
    if (!isDuplicate && paper.doi && seen.has(`doi:${paper.doi}`)) {
      isDuplicate = true;
    }
    
    if (!isDuplicate) {
      // Mark as seen using all available identifiers
      if (arxivId) seen.set(`arxiv:${arxivId}`, true);
      if (paper.semanticScholarId) seen.set(`ss:${paper.semanticScholarId}`, true);
      const titleKey = normalizeTitle(paper.title);
      seen.set(`title:${titleKey}`, true);
      if (paper.doi) seen.set(`doi:${paper.doi}`, true);
      
      unique.push(paper);
    }
  }
  
  return unique;
}

/**
 * Enrich papers with Semantic Scholar citation data (batch)
 */
async function enrichPapersWithCitations(papers) {
  const enriched = [];
  const arxivPapers = papers.filter(p => p.sourceId === 'arxiv' && !p.citations);
  const alreadyEnriched = papers.filter(p => p.citations > 0 || p.sourceId === 'semantic-scholar');
  
  enriched.push(...alreadyEnriched);
  
  // Enrich arXiv papers with citations (limit to avoid rate limits)
  console.log(`🔍 Enriching ${Math.min(arxivPapers.length, 50)} arXiv papers with citations...`);
  
  for (let i = 0; i < Math.min(arxivPapers.length, 50); i++) {
    try {
      const enrichedPaper = await enrichPaperWithSemanticScholar(arxivPapers[i]);
      enriched.push(enrichedPaper);
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
    } catch (error) {
      // If enrichment fails, add paper without citations
      enriched.push(arxivPapers[i]);
    }
  }
  
  // Add remaining arXiv papers without enrichment
  if (arxivPapers.length > 50) {
    enriched.push(...arxivPapers.slice(50));
  }
  
  return enriched;
}

/**
 * Fetch and update papers from all sources in parallel
 */
async function updatePapers() {
  console.log('🔄 Fetching new papers from all sources...');
  
  try {
    const currentYear = new Date().getFullYear();
    
    // Always fetch from at least the last 48 hours to ensure we get fresh papers
    // This prevents the cache from getting stuck with old papers
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0); // Start of day 2 days ago
    
    // Calculate date threshold - always include last 48 hours minimum
    let dateThreshold = twoDaysAgo;
    if (papersCache.length > 0 && lastPaperDate) {
      const newestDate = new Date(lastPaperDate);
      // Use the newer of: last 48 hours or newest paper date minus 1 day (to catch papers from same day)
      // But never go beyond 2 days to ensure we always get fresh papers
      const oneDayAfterNewest = new Date(newestDate);
      oneDayAfterNewest.setDate(oneDayAfterNewest.getDate() - 1);
      dateThreshold = oneDayAfterNewest > twoDaysAgo ? oneDayAfterNewest : twoDaysAgo;
    }
    
    console.log(`📅 Fetching papers from: ${dateThreshold.toISOString()} (last 48 hours minimum)`);
    
    // Fetch from both sources in parallel (both are primary sources)
    console.log('🔍 Fetching from Semantic Scholar and arXiv in parallel...');
    
    let papers = [];
    let attempts = 0;
    const maxAttempts = 2;
    
    // Try fetching with date threshold, if no NEW papers found, expand the window
    let trulyNewPapers = [];
    let attempts = 0;
    const maxAttempts = 3; // Try up to 3 times with expanding windows
    
    while (trulyNewPapers.length === 0 && attempts < maxAttempts) {
      const hoursBack = Math.ceil((Date.now() - dateThreshold.getTime()) / (1000 * 60 * 60));
      console.log(`🔍 Attempt ${attempts + 1}: Fetching papers from last ${Math.round(hoursBack / 24)} days (threshold: ${dateThreshold.toISOString()})`);
      
      const [ssResult, arxivResult] = await Promise.allSettled([
        fetchLatestPapersFromSemanticScholar(100, currentYear, dateThreshold),
        fetchArXivLatest(100, dateThreshold)
      ]);
      
      let papers = [];
      
      // Process Semantic Scholar results
      if (ssResult.status === 'fulfilled' && ssResult.value.length > 0) {
        console.log(`✅ Found ${ssResult.value.length} papers from Semantic Scholar`);
        
        const transformed = ssResult.value
          .map(transformSemanticScholarPaper)
          .filter(p => p !== null)
          .map(p => ({
            ...p,
            source: 'Semantic Scholar',
            sourceId: 'semantic-scholar'
          }));
        
        papers.push(...transformed);
      } else if (ssResult.status === 'rejected') {
        console.error('⚠️ Semantic Scholar fetch failed:', ssResult.reason?.message);
      }
      
      // Process arXiv results
      if (arxivResult.status === 'fulfilled' && arxivResult.value.length > 0) {
        console.log(`✅ Found ${arxivResult.value.length} papers from arXiv`);
        
        const arxivWithSource = arxivResult.value.map(p => ({
          ...p,
          source: 'arXiv',
          sourceId: 'arxiv'
        }));
        
        papers.push(...arxivWithSource);
      } else if (arxivResult.status === 'rejected') {
        console.error('⚠️ arXiv fetch failed:', arxivResult.reason?.message);
      }

      if (papers.length === 0) {
        console.log('⚠️ No papers fetched from any source');
        // Expand date window and try again
        if (attempts < maxAttempts - 1) {
          attempts++;
          if (attempts === 1) {
            // First expansion: last 14 days
            dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - 14);
            console.log(`📅 Expanding search to last 14 days...`);
          } else {
            // Second expansion: last 30 days
            dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - 30);
            console.log(`📅 Expanding search to last 30 days...`);
          }
          continue;
        } else {
          console.log('⚠️ No papers fetched after all attempts');
          return;
        }
      }

      console.log(`📦 Total papers before deduplication: ${papers.length}`);
      
      // Remove duplicates within the new batch
      const uniqueNewPapers = removeDuplicatePapers(papers);
      console.log(`📝 Removed ${papers.length - uniqueNewPapers.length} duplicates from new batch`);
      console.log(`📊 New unique papers: ${uniqueNewPapers.length}`);

      // Enrich arXiv papers with Semantic Scholar citation data
      const enrichedNewPapers = await enrichPapersWithCitations(uniqueNewPapers);

      // Merge with existing cache - check for duplicates against existing papers
      const existingIds = new Set();
      papersCache.forEach(p => {
        if (p.arxivId) existingIds.add(`arxiv:${p.arxivId}`);
        if (p.semanticScholarId) existingIds.add(`ss:${p.semanticScholarId}`);
        existingIds.add(`title:${normalizeTitle(p.title)}`);
      });

      // Filter out papers that already exist in cache
      trulyNewPapers = enrichedNewPapers.filter(p => {
        const arxivId = p.arxivId || extractArxivId(p.link);
        if (arxivId && existingIds.has(`arxiv:${arxivId}`)) return false;
        if (p.semanticScholarId && existingIds.has(`ss:${p.semanticScholarId}`)) return false;
        const titleKey = normalizeTitle(p.title);
        if (existingIds.has(`title:${titleKey}`)) return false;
        return true;
      });

      console.log(`🆕 Found ${trulyNewPapers.length} truly new papers (${enrichedNewPapers.length - trulyNewPapers.length} were already in cache)`);
      
      // If no new papers found, expand the date window and try again
      if (trulyNewPapers.length === 0 && attempts < maxAttempts - 1) {
        attempts++;
        if (attempts === 1) {
          // First expansion: last 14 days
          dateThreshold = new Date();
          dateThreshold.setDate(dateThreshold.getDate() - 14);
          console.log(`⚠️ No new papers found, expanding search to last 14 days...`);
        } else {
          // Second expansion: last 30 days
          dateThreshold = new Date();
          dateThreshold.setDate(dateThreshold.getDate() - 30);
          console.log(`⚠️ No new papers found, expanding search to last 30 days...`);
        }
      } else {
        break;
      }
    }

    if (trulyNewPapers.length === 0) {
      console.log('⚠️ No new papers found after expanding search window - keeping existing cache');
      // Still update lastFetchTime to show we tried
      lastFetchTime = new Date().toISOString();
      await savePapersToDP();
      return;
    }

    // Merge: add new papers to existing cache
    const mergedPapers = [...trulyNewPapers, ...papersCache];

    // Sort by published date (newest first)
    mergedPapers.sort((a, b) => {
      const dateA = new Date(a.published || a.updated || 0);
      const dateB = new Date(b.published || b.updated || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Update lastPaperDate to the newest paper's date
    if (mergedPapers.length > 0) {
      const newestPaper = mergedPapers[0];
      const newestDate = new Date(newestPaper.published || newestPaper.updated || 0);
      if (!lastPaperDate || newestDate > new Date(lastPaperDate)) {
        lastPaperDate = newestDate.toISOString();
        console.log(`📅 Updated last paper date to: ${lastPaperDate}`);
      }
    }

    // Keep only the most recent 1000 papers to prevent unbounded growth
    const MAX_CACHE_SIZE = 1000;
    const limitedPapers = mergedPapers.slice(0, MAX_CACHE_SIZE);
    
    if (mergedPapers.length > MAX_CACHE_SIZE) {
      console.log(`📦 Limited cache from ${mergedPapers.length} to ${MAX_CACHE_SIZE} papers (removed oldest)`);
    }

    // Categorize by industry (use all papers for stats)
    industryStats = categorizePapersByIndustry(limitedPapers);

    // Update cache
    papersCache = limitedPapers;
    lastFetchTime = new Date().toISOString();

    // Save to database
    await savePapersToDP();

    // Log source breakdown
    const arxivCount = limitedPapers.filter(p => p.sourceId === 'arxiv').length;
    const ssCount = limitedPapers.filter(p => p.sourceId === 'semantic-scholar').length;
    
    console.log(`✅ Updated ${papersCache.length} papers (${trulyNewPapers.length} new)`);
    console.log(`📊 Source breakdown: arXiv: ${arxivCount}, Semantic Scholar: ${ssCount}`);
    console.log(`📊 Industry stats:`, industryStats);

  } catch (error) {
    console.error('❌ Error updating papers:', error.message);
    console.error(error.stack);
  }
}

// API Routes

/**
 * GET /api/papers - Get all papers with optional filters
 */
app.get('/api/papers', (req, res) => {
  const { category, venue, search, source, limit = 50, offset = 0 } = req.query;
  
  let filtered = [...papersCache];

  // Filter by source
  if (source) {
    filtered = filtered.filter(paper => 
      paper.sourceId === source || 
      paper.source?.toLowerCase().replace(/\s+/g, '-') === source ||
      (source === 'both' && (paper.sourceId === 'arxiv' || paper.sourceId === 'semantic-scholar'))
    );
  }

  // Filter by category/tag
  if (category) {
    filtered = filtered.filter(paper => 
      paper.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
    );
  }

  // Filter by venue
  if (venue) {
    filtered = filtered.filter(paper => 
      paper.venue.toLowerCase().includes(venue.toLowerCase())
    );
  }

  // Search in title and summary
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(paper => 
      paper.title.toLowerCase().includes(searchLower) ||
      paper.summary.toLowerCase().includes(searchLower)
    );
  }

  // Sort by published date (newest first) before pagination
  filtered.sort((a, b) => {
    const dateA = new Date(a.published || a.updated || 0);
    const dateB = new Date(b.published || b.updated || 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Pagination
  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  // Calculate source breakdown
  const sourceBreakdown = {
    arxiv: filtered.filter(p => p.sourceId === 'arxiv').length,
    'semantic-scholar': filtered.filter(p => p.sourceId === 'semantic-scholar').length,
    total: filtered.length
  };

  res.json({
    papers: paginated,
    total: filtered.length,
    sources: sourceBreakdown,
    lastUpdate: lastFetchTime,
    hasMore: end < filtered.length
  });
});

/**
 * GET /api/papers/stats - Get paper statistics by industry
 * Query params: period (month, quarter, year, all)
 */
app.get('/api/papers/stats', (req, res) => {
  const { period = 'all' } = req.query;
  
  let filteredPapers = [...papersCache];
  
  // Filter by time period
  if (period !== 'all') {
    const now = new Date();
    let cutoffDate;
    
    switch (period) {
      case 'month':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        cutoffDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        cutoffDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        cutoffDate = null;
    }
    
    if (cutoffDate) {
      filteredPapers = filteredPapers.filter(paper => {
        const paperDate = new Date(paper.published || paper.updated || 0);
        return paperDate >= cutoffDate;
      });
    }
  }
  
  // Calculate industry stats for filtered papers
  const filteredStats = categorizePapersByIndustry(filteredPapers);
  
  res.json({
    industryStats: filteredStats,
    totalPapers: filteredPapers.length,
    period: period,
    lastUpdate: lastFetchTime
  });
});

/**
 * GET /api/papers/:id - Get specific paper
 */
app.get('/api/papers/:id', (req, res) => {
  const paper = papersCache.find(p => p.id === req.params.id || p.arxivId === req.params.id);
  
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }

  res.json(paper);
});

/**
 * POST /api/papers/refresh - Manually trigger refresh
 * Query param: force=true to reset date threshold and force fresh fetch
 */
app.post('/api/papers/refresh', async (req, res) => {
  const { force } = req.query;
  
  // If force=true, reset date threshold to get fresh papers
  if (force === 'true') {
    console.log('🔄 Force refresh - resetting date threshold');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    lastPaperDate = sevenDaysAgo.toISOString();
  }
  
  res.json({ message: 'Refresh started', status: 'in_progress', forced: force === 'true' });
  
  // Run update in background
  updatePapers();
});

/**
 * GET /api/papers/autocomplete - Get query suggestions
 */
app.get('/api/papers/autocomplete', async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ suggestions: [] });
  }

  try {
    const suggestions = await getPaperAutocomplete(q);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting autocomplete:', error.message);
    res.status(500).json({ error: 'Failed to get autocomplete suggestions' });
  }
});

/**
 * POST /api/papers/batch - Fetch multiple papers by IDs
 */
app.post('/api/papers/batch', async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid paper IDs' });
  }

  try {
    const papers = await fetchPapersBatch(ids);
    const transformed = papers
      .map(transformSemanticScholarPaper)
      .filter(p => p !== null);
    res.json({ papers: transformed });
  } catch (error) {
    console.error('Error fetching papers batch:', error.message);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    papersCount: papersCache.length,
    lastUpdate: lastFetchTime,
    uptime: process.uptime()
  });
});

// Initialize
async function initialize() {
  console.log('🚀 Starting AI Hub Backend Server...');
  
  // Load existing data
  await loadPapersFromDB();
  
  // Fetch papers if cache is empty or old (>10 minutes)
  const shouldFetch = !lastFetchTime || 
    (new Date() - new Date(lastFetchTime)) > 10 * 60 * 1000;

  if (shouldFetch) {
    console.log('📥 Initial fetch of papers...');
    await updatePapers();
  }

  // Schedule automatic updates every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    console.log('⏰ Scheduled update triggered (every 10 minutes)');
    updatePapers();
  });
  
  // Also schedule a daily refresh that resets the date threshold to ensure fresh papers
  cron.schedule('0 0 * * *', () => {
    console.log('🔄 Daily refresh - resetting date threshold to get fresh papers');
    // Reset lastPaperDate to force fetching from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    lastPaperDate = sevenDaysAgo.toISOString();
    updatePapers();
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 Serving ${papersCache.length} papers`);
    console.log(`🔄 Auto-refresh every 10 minutes (100 papers per update)`);
  });
}

// Start server
initialize();

