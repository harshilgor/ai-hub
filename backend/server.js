import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
let oldestPaperDate = null; // Track the date of the oldest paper we've fetched

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
    oldestPaperDate = parsed.oldestPaperDate || null;
    
    // If we have papers, set lastPaperDate to the newest one and oldestPaperDate to the oldest one
    if (papersCache.length > 0) {
      // Sort by date to find newest and oldest
      const sortedByDate = [...papersCache].sort((a, b) => {
        const dateA = new Date(a.published || a.updated || 0);
        const dateB = new Date(b.published || b.updated || 0);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
      
      if (!lastPaperDate) {
        const newest = new Date(sortedByDate[0].published || sortedByDate[0].updated || 0);
        lastPaperDate = newest.toISOString();
      }
      
      if (!oldestPaperDate) {
        const oldest = new Date(sortedByDate[sortedByDate.length - 1].published || sortedByDate[sortedByDate.length - 1].updated || 0);
        oldestPaperDate = oldest.toISOString();
      }
    }
    
    console.log(`📚 Loaded ${papersCache.length} papers from database`);
    if (lastPaperDate) {
      console.log(`📅 Newest paper date: ${lastPaperDate}`);
    }
    if (oldestPaperDate) {
      console.log(`📅 Oldest paper date: ${oldestPaperDate}`);
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
        lastPaperDate: lastPaperDate,
        oldestPaperDate: oldestPaperDate
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
 * Reduced enrichment to avoid rate limits
 */
async function enrichPapersWithCitations(papers) {
  const enriched = [];
  const arxivPapers = papers.filter(p => p.sourceId === 'arxiv' && !p.citations);
  const alreadyEnriched = papers.filter(p => p.citations > 0 || p.sourceId === 'semantic-scholar');
  
  enriched.push(...alreadyEnriched);
  
  // Enrich arXiv papers with citations (reduced limit to avoid rate limits)
  // Only enrich a small subset to avoid hitting rate limits
  const enrichmentLimit = Math.min(arxivPapers.length, 10); // Reduced from 50 to 10
  console.log(`🔍 Enriching ${enrichmentLimit} arXiv papers with citations (limited to avoid rate limits)...`);
  
  for (let i = 0; i < enrichmentLimit; i++) {
    try {
      const enrichedPaper = await enrichPaperWithSemanticScholar(arxivPapers[i]);
      enriched.push(enrichedPaper);
      // Rate limiter already handles delays, but add extra buffer
      await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2 seconds between enrichment calls
    } catch (error) {
      // If enrichment fails (especially 429), skip enrichment for remaining papers
      if (error.response && error.response.status === 429) {
        console.log(`⚠️ Rate limit hit during enrichment. Skipping remaining enrichments.`);
        // Add remaining papers without enrichment
        enriched.push(...arxivPapers.slice(i));
        break;
      }
      // If enrichment fails, add paper without citations
      enriched.push(arxivPapers[i]);
    }
  }
  
  // Add remaining arXiv papers without enrichment
  if (arxivPapers.length > enrichmentLimit) {
    enriched.push(...arxivPapers.slice(enrichmentLimit));
  }
  
  return enriched;
}

/**
 * Fetch and update papers from all sources in parallel
 * Strategy: Always try recent papers first, then expand backwards in time to build comprehensive database
 */
async function updatePapers() {
  console.log('🔄 Fetching new papers from all sources...');
  
  try {
    const currentYear = new Date().getFullYear();
    let trulyNewPapers = [];
    
    // Strategy: Try recent first, then go backwards
    // Define expansion strategy: recent → older
    const expansionWindows = [
      { days: 3, label: 'last 3 days' },
      { days: 7, label: 'last 7 days' },
      { days: 14, label: 'last 14 days' },
      { days: 30, label: 'last 30 days' },
      { days: 60, label: 'last 60 days' },
      { days: 90, label: 'last 90 days' },
      { days: 180, label: 'last 6 months' },
      { days: 365, label: 'last year' },
      { days: 730, label: 'last 2 years' },
    ];
    
    let currentWindowIndex = 0;
    
    while (trulyNewPapers.length === 0 && currentWindowIndex < expansionWindows.length) {
      const window = expansionWindows[currentWindowIndex];
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - window.days);
      dateThreshold.setHours(0, 0, 0, 0);
      
      // If we have an oldestPaperDate and we're going back further, check if we should skip
      if (oldestPaperDate) {
        const oldestDate = new Date(oldestPaperDate);
        // If the window goes back further than our oldest paper, we might already have papers from this period
        // But we still want to try in case there are gaps
        const daysSinceOldest = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceOldest > window.days && currentWindowIndex > 3) {
          // We've already fetched papers from this period, but continue to fill any gaps
          console.log(`⏭️ Note: Already have papers from ${window.label}, but checking for gaps...`);
        }
      }
      
      console.log(`🔍 Attempt ${currentWindowIndex + 1}/${expansionWindows.length}: Fetching papers from ${window.label} (threshold: ${dateThreshold.toISOString()})`);
      
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
        console.log(`⚠️ No papers found for ${window.label}, trying next window...`);
        currentWindowIndex++;
        continue;
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

      console.log(`🆕 Found ${trulyNewPapers.length} truly new papers from ${window.label} (${enrichedNewPapers.length - trulyNewPapers.length} were already in cache)`);
      
      if (trulyNewPapers.length > 0) {
        break; // Found new papers, stop expanding
      }
      
      currentWindowIndex++;
    }

    if (trulyNewPapers.length === 0) {
      console.log('⚠️ No new papers found after all expansion attempts - database is comprehensive for available time windows');
      console.log(`📊 Current database size: ${papersCache.length} papers`);
      lastFetchTime = new Date().toISOString();
      await savePapersToDP();
      return;
    }
    
    console.log(`📥 Processing ${trulyNewPapers.length} new papers to add to database...`);
    console.log(`📊 Current database has ${papersCache.length} papers, will add ${trulyNewPapers.length} new ones`);

    // Merge: add new papers to existing cache
    const beforeMergeCount = papersCache.length;
    console.log(`📊 Before merge: ${beforeMergeCount} papers in cache, ${trulyNewPapers.length} new papers to add`);
    
    const mergedPapers = [...trulyNewPapers, ...papersCache];
    console.log(`📊 After merge: ${mergedPapers.length} total papers (should be ${beforeMergeCount + trulyNewPapers.length})`);

    // Sort by published date (newest first)
    mergedPapers.sort((a, b) => {
      const dateA = new Date(a.published || a.updated || 0);
      const dateB = new Date(b.published || b.updated || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Update both newest and oldest dates
    if (mergedPapers.length > 0) {
      const newestPaper = mergedPapers[0];
      const newestDate = new Date(newestPaper.published || newestPaper.updated || 0);
      if (!lastPaperDate || newestDate > new Date(lastPaperDate)) {
        lastPaperDate = newestDate.toISOString();
        console.log(`📅 Updated newest paper date to: ${lastPaperDate}`);
      }
      
      const oldestPaper = mergedPapers[mergedPapers.length - 1];
      const oldestDate = new Date(oldestPaper.published || oldestPaper.updated || 0);
      if (!oldestPaperDate || oldestDate < new Date(oldestPaperDate)) {
        oldestPaperDate = oldestDate.toISOString();
        console.log(`📅 Updated oldest paper date to: ${oldestPaperDate}`);
      }
    }

    // Increased cache limit to allow large database growth
    const MAX_CACHE_SIZE = 10000; // Increased from 1000 to 10000
    const limitedPapers = mergedPapers.slice(0, MAX_CACHE_SIZE);
    
    if (mergedPapers.length > MAX_CACHE_SIZE) {
      console.log(`📦 Limited cache from ${mergedPapers.length} to ${MAX_CACHE_SIZE} papers (removed oldest)`);
      // Update oldestPaperDate to reflect what we kept
      const keptOldest = limitedPapers[limitedPapers.length - 1];
      oldestPaperDate = new Date(keptOldest.published || keptOldest.updated || 0).toISOString();
    }

    // Categorize by industry (use all papers for stats)
    industryStats = categorizePapersByIndustry(limitedPapers);

    // Update cache
    const previousCount = papersCache.length;
    papersCache = limitedPapers;
    const newCount = papersCache.length;
    const actualAdded = newCount - previousCount;
    lastFetchTime = new Date().toISOString();

    // Save to database
    await savePapersToDP();

    // Log source breakdown
    const arxivCount = limitedPapers.filter(p => p.sourceId === 'arxiv').length;
    const ssCount = limitedPapers.filter(p => p.sourceId === 'semantic-scholar').length;
    
    console.log(`✅ Updated database: ${papersCache.length} total papers (${trulyNewPapers.length} new fetched, ${actualAdded} actually added)`);
    console.log(`📈 Count change: ${previousCount} → ${newCount} (+${actualAdded})`);
    console.log(`📊 Date range: ${oldestPaperDate || 'N/A'} to ${lastPaperDate || 'N/A'}`);
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
    const categoryLower = category.toLowerCase();
    
    // Map of category names to related keywords/tags for better matching
    const categoryKeywords = {
      'mathematics': ['mathematics', 'math', 'algebra', 'geometry', 'topology', 'analysis', 'number theory', 'combinatorics', 'probability', 'statistics theory'],
      'statistics': ['statistics', 'stat', 'probability', 'statistical'],
      'physics': ['physics', 'quantum', 'optics', 'plasma', 'condensed matter', 'high energy'],
      'economics': ['economics', 'econometrics', 'economic', 'finance'],
      'finance': ['finance', 'financial', 'trading', 'quantitative finance', 'portfolio', 'risk management'],
      'biology': ['biology', 'genomics', 'computational biology', 'neuroscience', 'biomolecules', 'quantitative biology'],
      'computer science': ['computer science', 'algorithms', 'systems', 'networks', 'security', 'programming', 'software'],
      'electrical engineering': ['electrical engineering', 'signal processing', 'control systems', 'eess']
    };
    
    // Get keywords for this category
    const keywords = categoryKeywords[categoryLower] || [categoryLower];
    
    filtered = filtered.filter(paper => {
      const paperTags = (paper.tags || []).map(t => t.toLowerCase());
      const paperTitle = (paper.title || '').toLowerCase();
      const paperSummary = (paper.summary || '').toLowerCase();
      
      // Check if any tag matches
      if (paperTags.some(tag => keywords.some(kw => tag.includes(kw)))) {
        return true;
      }
      
      // Also check if category name appears in title or summary (for broader matching)
      if (keywords.some(kw => paperTitle.includes(kw) || paperSummary.includes(kw))) {
        return true;
      }
      
      return false;
    });
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
 * Query params: period (month, quarter, year, 3m, 6m, 12m, all)
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
      case '3m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '12m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
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
 * GET /api/papers/trends - Get monthly trend data by field
 * Query params: period (3m, 6m, 12m, all), fields (comma-separated or 'all')
 */
app.get('/api/papers/trends', (req, res) => {
  const { period = '12m', fields = 'all' } = req.query;
  
  let filteredPapers = [...papersCache];
  
  // Filter by time period
  const now = new Date();
  let cutoffDate = null;
  
  if (period !== 'all') {
    switch (period) {
      case '3m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '12m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
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
  
  // Define fields to track
  const fieldList = fields === 'all' 
    ? ['NLP', 'Computer Vision', 'LLMs', 'Agents', 'Robotics', 'Healthcare AI']
    : fields.split(',').map(f => f.trim());
  
  // Group papers by month and field
  const trendsByMonth = {};
  
  filteredPapers.forEach(paper => {
    const paperDate = new Date(paper.published || paper.updated || 0);
    const monthKey = paperDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const monthIndex = `${paperDate.getFullYear()}-${String(paperDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!trendsByMonth[monthIndex]) {
      trendsByMonth[monthIndex] = {
        month: paperDate.toLocaleDateString('en-US', { month: 'short' }),
        monthIndex: monthIndex,
        date: paperDate,
        NLP: 0,
        'Computer Vision': 0,
        LLMs: 0,
        Agents: 0,
        Robotics: 0,
        'Healthcare AI': 0
      };
    }
    
    // Check which fields this paper belongs to based on tags and title/summary
    const text = (paper.title + ' ' + (paper.summary || '')).toLowerCase();
    const paperTags = (paper.tags || []).map(t => t.toLowerCase());
    
    // NLP
    if (fieldList.includes('NLP') && (
      paperTags.some(t => t.includes('nlp') || t.includes('natural language')) ||
      text.includes('language model') || text.includes('translation') || 
      text.includes('text processing') || text.includes('bert') || text.includes('gpt')
    )) {
      trendsByMonth[monthIndex].NLP++;
    }
    
    // Computer Vision
    if (fieldList.includes('Computer Vision') && (
      paperTags.some(t => t.includes('vision') || t.includes('computer vision') || t.includes('cv')) ||
      text.includes('image') || text.includes('visual') || text.includes('detection') ||
      text.includes('segmentation') || text.includes('recognition')
    )) {
      trendsByMonth[monthIndex]['Computer Vision']++;
    }
    
    // LLMs
    if (fieldList.includes('LLMs') && (
      paperTags.some(t => t.includes('llm') || t.includes('language model')) ||
      text.includes('large language model') || text.includes('gpt') || 
      text.includes('bert') || text.includes('transformer') || text.includes('pretraining')
    )) {
      trendsByMonth[monthIndex].LLMs++;
    }
    
    // Agents
    if (fieldList.includes('Agents') && (
      paperTags.some(t => t.includes('agent') || t.includes('reinforcement')) ||
      text.includes('agent') || text.includes('reinforcement learning') ||
      text.includes('planning') || text.includes('reasoning') || text.includes('decision')
    )) {
      trendsByMonth[monthIndex].Agents++;
    }
    
    // Robotics
    if (fieldList.includes('Robotics') && (
      paperTags.some(t => t.includes('robot') || t.includes('robotics')) ||
      text.includes('robot') || text.includes('autonomous') || 
      text.includes('manipulation') || text.includes('navigation') || text.includes('control')
    )) {
      trendsByMonth[monthIndex].Robotics++;
    }
    
    // Healthcare AI
    if (fieldList.includes('Healthcare AI') && (
      paperTags.some(t => t.includes('health') || t.includes('medical') || t.includes('healthcare')) ||
      text.includes('medical') || text.includes('health') || text.includes('diagnosis') ||
      text.includes('clinical') || text.includes('patient') || text.includes('disease') || text.includes('drug')
    )) {
      trendsByMonth[monthIndex]['Healthcare AI']++;
    }
  });
  
  // Convert to array and sort by date
  const trends = Object.values(trendsByMonth)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ monthIndex, date, ...rest }) => rest); // Remove monthIndex and date from output
  
  res.json({
    trends,
    period,
    fields: fieldList,
    totalPapers: filteredPapers.length,
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
 * GET /api/papers/total - Get total paper count in database (unfiltered)
 */
app.get('/api/papers/total', (req, res) => {
  // Ensure we're reading the actual count from cache
  const actualCount = papersCache.length;
  
  res.json({
    total: actualCount,
    lastUpdate: lastFetchTime,
    oldestPaperDate: oldestPaperDate,
    newestPaperDate: lastPaperDate,
    sourceBreakdown: {
      arxiv: papersCache.filter(p => p.sourceId === 'arxiv').length,
      'semantic-scholar': papersCache.filter(p => p.sourceId === 'semantic-scholar').length
    }
  });
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

/**
 * Check if port is in use and kill the process if needed (Windows)
 */
async function checkAndFreePort(port) {
  try {
    // Check if port is in use
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (stdout) {
      // Extract PID from netstat output
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const match = line.match(/\s+(\d+)\s*$/);
        if (match && match[1] !== '0') {
          pids.add(match[1]);
        }
      }
      
      // Kill all processes using the port
      for (const pid of pids) {
        try {
          console.log(`⚠️ Port ${port} is in use by PID ${pid}, killing process...`);
          await execAsync(`taskkill /F /PID ${pid}`);
          console.log(`✅ Killed process ${pid}`);
          // Wait a moment for the port to be released
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          // Process might have already terminated
          console.log(`ℹ️ Process ${pid} already terminated or not found`);
        }
      }
    }
  } catch (err) {
    // Port is not in use, which is fine
    if (err.code !== 1) { // Error code 1 means no matches found
      console.log(`ℹ️ Port ${port} is available`);
    }
  }
}

// Initialize
async function initialize() {
  console.log('🚀 Starting AI Hub Backend Server...');
  
  // Check and free port if needed
  await checkAndFreePort(PORT);
  
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

  // Start server with error handling
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 Serving ${papersCache.length} papers`);
    console.log(`🔄 Auto-refresh every 10 minutes (100 papers per update)`);
    console.log(`💡 Server will automatically fetch papers in the background`);
  });

  // Handle server errors gracefully
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Attempting to free it...`);
      checkAndFreePort(PORT).then(() => {
        console.log('🔄 Retrying server startup...');
        setTimeout(() => {
          const retryServer = app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`📚 Serving ${papersCache.length} papers`);
            console.log(`🔄 Auto-refresh every 10 minutes (100 papers per update)`);
          });
        }, 2000);
      });
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

// Start server
initialize();

