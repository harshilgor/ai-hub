import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { fetchArXivPapers, categorizePapersByIndustry } from './services/arxivService.js';
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
    console.log(`📚 Loaded ${papersCache.length} papers from database`);
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
        industryStats: industryStats
      }, null, 2)
    );
    console.log(`💾 Saved ${papersCache.length} papers to database`);
  } catch (error) {
    console.error('❌ Error saving to database:', error.message);
  }
}

/**
 * Remove duplicate papers
 */
function removeDuplicatePapers(papers) {
  const seen = new Set();
  const unique = [];
  
  for (const paper of papers) {
    const key = paper.semanticScholarId || paper.arxivId || paper.title.toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(paper);
    }
  }
  
  return unique;
}

/**
 * Fetch and update papers
 */
async function updatePapers() {
  console.log('🔄 Fetching new papers...');
  
  try {
    let papers = [];
    const currentYear = new Date().getFullYear();
    
    // Strategy 1: Try Semantic Scholar first (better citation data)
    console.log('🔍 Fetching from Semantic Scholar...');
    const ssPapers = await fetchLatestPapersFromSemanticScholar(100, currentYear);
    
    if (ssPapers.length > 0) {
      console.log(`✅ Found ${ssPapers.length} papers from Semantic Scholar`);
      
      // Transform to our format
      const transformed = ssPapers
        .map(transformSemanticScholarPaper)
        .filter(p => p !== null);
      
      papers.push(...transformed);
    }
    
    // Strategy 2: Fallback to arXiv if Semantic Scholar returns few results
    if (papers.length < 50) {
      console.log('📚 Supplementing with arXiv papers...');
      const arxivPapers = await fetchArXivPapers(50, 7);
      
      // Enrich arXiv papers with Semantic Scholar data (limit to avoid rate limits)
      for (let i = 0; i < Math.min(arxivPapers.length, 30); i++) {
        const enriched = await enrichPaperWithSemanticScholar(arxivPapers[i]);
        papers.push(enriched);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Add remaining arXiv papers without enrichment
      if (arxivPapers.length > 30) {
        papers.push(...arxivPapers.slice(30));
      }
    }

    if (papers.length === 0) {
      console.log('⚠️ No papers fetched');
      return;
    }

    // Remove duplicates
    const uniquePapers = removeDuplicatePapers(papers);
    console.log(`📝 Removed ${papers.length - uniquePapers.length} duplicates`);

    // Categorize by industry
    industryStats = categorizePapersByIndustry(uniquePapers);

    // Update cache
    papersCache = uniquePapers;
    lastFetchTime = new Date().toISOString();

    // Save to database
    await savePapersToDP();

    console.log(`✅ Updated ${papersCache.length} papers`);
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
  const { category, venue, search, limit = 50, offset = 0 } = req.query;
  
  let filtered = [...papersCache];

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

  // Pagination
  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  res.json({
    papers: paginated,
    total: filtered.length,
    lastUpdate: lastFetchTime,
    hasMore: end < filtered.length
  });
});

/**
 * GET /api/papers/stats - Get paper statistics by industry
 */
app.get('/api/papers/stats', (req, res) => {
  res.json({
    industryStats: industryStats,
    totalPapers: papersCache.length,
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
 */
app.post('/api/papers/refresh', async (req, res) => {
  res.json({ message: 'Refresh started', status: 'in_progress' });
  
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

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 Serving ${papersCache.length} papers`);
    console.log(`🔄 Auto-refresh every 10 minutes (100 papers per update)`);
  });
}

// Start server
initialize();

