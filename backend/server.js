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
import { fetchLatestTechNews } from './services/newsService.js';
import { fetchLatestGithubActivity } from './services/githubService.js';
import { aggregateAllSignals, extractTechnologiesFromSignals, extractIndustriesFromSignals } from './services/aggregationService.js';
import {
  calculateTechnologyMomentum,
  calculateIndustryGrowth,
  predictNextBigTechnology,
  detectEmergingTechnologies,
  extractLeaderQuotes,
  calculateCombinedSignalStrength,
  generateTechnologyInsight
} from './services/insightEngine.js';
import {
  extractTechnologiesFromPapers,
  generateTechnologyRead
} from './services/technologyReadsEngine.js';
import {
  processPodcastTranscript,
  processYouTubeVideo,
  queryStances,
  aggregateViews
} from './services/podcastService.js';
import {
  runDailySynthesis
} from './services/synthesisService.js';
import {
  extractChannelId,
  fetchChannelVideos,
  checkChannelForNewVideos
} from './services/youtubeChannelService.js';
import {
  isSupabaseConfigured,
  papersDB,
  podcastsDB,
  channelsDB,
  insightsStorage
} from './services/supabaseService.js';

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

// Podcasts cache
let podcastsCache = [];

// Channel management
let channelsConfig = {
  channels: [],
  settings: {
    checkInterval: '0 */6 * * *',  // Every 6 hours
    maxVideosPerChannel: 5,
    minVideoLength: 300  // 5 minutes in seconds
  }
};

// Insights cache
let allSignalsCache = []; // Combined signals from all sources
let insightsCache = {
  technologies: [],
  industries: [],
  emerging: [],
  predictions: [],
  leaderQuotes: [],
  lastUpdate: null
};

// Technology reads cache (20 per day, detailed)
let technologyReadsCache = {
  reads: [],
  lastGenerated: null,
  dailyLimit: 20
};
let technologyPredictionsCache = {
  predictions: [],
  lastGenerated: null
};

// Database file paths
const DB_PATH = path.join(__dirname, 'data', 'papers.json');
const PODCASTS_DB_PATH = path.join(__dirname, 'data', 'podcasts.json');
const TECHNOLOGY_READS_PATH = path.join(__dirname, 'data', 'technologyReads.json');
const TECHNOLOGY_PREDICTIONS_PATH = path.join(__dirname, 'data', 'technologyPredictions.json');
const CHANNELS_CONFIG_PATH = path.join(__dirname, 'data', 'channels.json');

/**
 * Load papers from database (Supabase or JSON fallback)
 */
async function loadPapersFromDB() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const papers = await papersDB.getAll();
      if (papers !== null) {
        // Filter out papers from removed sources (Crossref, PubMed, DBLP)
        const allPapers = papers || [];
        papersCache = allPapers.filter(p => {
          const sourceId = p.source_id || p.sourceId || '';
          return sourceId !== 'crossref' && sourceId !== 'pubmed' && sourceId !== 'dblp';
        });
        
        // Map Supabase column names to our internal format
        papersCache = papersCache.map(p => ({
          ...p,
          sourceId: p.source_id || p.sourceId,
          pdfLink: p.pdf_link || p.pdfLink
        }));
        
        // Calculate dates
        if (papersCache.length > 0) {
          const sortedByDate = [...papersCache].sort((a, b) => {
            const dateA = new Date(a.published || a.updated || 0);
            const dateB = new Date(b.published || b.updated || 0);
            return dateB.getTime() - dateA.getTime();
          });
          
          const newest = new Date(sortedByDate[0].published || sortedByDate[0].updated || 0);
          const oldest = new Date(sortedByDate[sortedByDate.length - 1].published || sortedByDate[sortedByDate.length - 1].updated || 0);
          lastPaperDate = newest.toISOString();
          oldestPaperDate = oldest.toISOString();
        }
        
        console.log(`📚 Loaded ${papersCache.length} papers from Supabase`);
        if (lastPaperDate) {
          console.log(`📅 Newest paper date: ${lastPaperDate}`);
        }
        if (oldestPaperDate) {
          console.log(`📅 Oldest paper date: ${oldestPaperDate}`);
        }
        return;
      }
    } catch (error) {
      console.error('❌ Error loading papers from Supabase, falling back to JSON:', error.message);
    }
  }
  
  // Fallback to JSON files
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    
    const allPapers = parsed.papers || [];
    papersCache = allPapers.filter(p => {
      const sourceId = p.sourceId || '';
      return sourceId !== 'crossref' && sourceId !== 'pubmed' && sourceId !== 'dblp';
    });
    
    lastFetchTime = parsed.lastFetchTime;
    industryStats = parsed.industryStats || {};
    lastPaperDate = parsed.lastPaperDate || null;
    oldestPaperDate = parsed.oldestPaperDate || null;
    
    if (papersCache.length > 0) {
      const sortedByDate = [...papersCache].sort((a, b) => {
        const dateA = new Date(a.published || a.updated || 0);
        const dateB = new Date(b.published || b.updated || 0);
        return dateB.getTime() - dateA.getTime();
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
    
    console.log(`📚 Loaded ${papersCache.length} papers from JSON file`);
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
 * Save papers to database (Supabase or JSON fallback)
 */
async function savePapersToDP() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      // Map to Supabase column names
      const papersToSave = papersCache.map(p => ({
        ...p,
        source_id: p.sourceId || p.source_id,
        pdf_link: p.pdfLink || p.pdf_link
      }));
      
      const success = await papersDB.upsert(papersToSave);
      if (success) {
        console.log(`💾 Saved ${papersCache.length} papers to Supabase`);
        return;
      }
    } catch (error) {
      console.error('❌ Error saving papers to Supabase, falling back to JSON:', error.message);
    }
  }
  
  // Fallback to JSON files
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
    console.log(`💾 Saved ${papersCache.length} papers to JSON file`);
  } catch (error) {
    console.error('❌ Error saving to database:', error.message);
  }
}

/**
 * Load podcasts from database (Supabase or JSON fallback)
 */
async function loadPodcastsFromDB() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const podcasts = await podcastsDB.getAll();
      if (podcasts !== null) {
        podcastsCache = podcasts || [];
        console.log(`📻 Loaded ${podcastsCache.length} podcasts from Supabase`);
        return;
      }
    } catch (error) {
      console.error('❌ Error loading podcasts from Supabase, falling back to JSON:', error.message);
    }
  }
  
  // Fallback to JSON files
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    const data = await fs.readFile(PODCASTS_DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    podcastsCache = parsed.podcasts || [];
    console.log(`📻 Loaded ${podcastsCache.length} podcasts from JSON file`);
  } catch (error) {
    console.log('📝 No existing podcasts database found, will create new one');
    podcastsCache = [];
  }
}

/**
 * Save podcasts to database (Supabase or JSON fallback)
 */
async function savePodcastsToDB() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const success = await podcastsDB.upsert(podcastsCache);
      if (success) {
        console.log(`💾 Saved ${podcastsCache.length} podcasts to Supabase`);
        return;
      }
    } catch (error) {
      console.error('❌ Error saving podcasts to Supabase, falling back to JSON:', error.message);
    }
  }
  
  // Fallback to JSON files
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(
      PODCASTS_DB_PATH,
      JSON.stringify({
        podcasts: podcastsCache,
        lastUpdate: new Date().toISOString()
      }, null, 2)
    );
    console.log(`💾 Saved ${podcastsCache.length} podcasts to JSON file`);
  } catch (error) {
    console.error('❌ Error saving podcasts to database:', error.message);
  }
}

/**
 * Load channels configuration
 */
/**
 * Load channels config from database (Supabase or JSON fallback)
 */
async function loadChannelsConfig() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const channels = await channelsDB.getAll();
      if (channels && channels.length > 0) {
        channelsConfig.channels = channels || [];
        console.log(`📺 Loaded ${channelsConfig.channels.length} channels from Supabase`);
        return;
      } else {
        console.log('⚠️ Supabase returned no channels, falling back to JSON');
      }
    } catch (error) {
      console.error('❌ Error loading channels from Supabase, falling back to JSON:', error.message);
    }
  }
  
  // Fallback to JSON files
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    const data = await fs.readFile(CHANNELS_CONFIG_PATH, 'utf-8');
    channelsConfig = JSON.parse(data);
    console.log(`📺 Loaded ${channelsConfig.channels.length} channels from JSON file`);
  } catch (error) {
    console.log('📝 No existing channels config found, using defaults');
    channelsConfig = {
      channels: [],
      settings: {
        checkInterval: '0 */6 * * *',
        maxVideosPerChannel: 5,
        minVideoLength: 300
      }
    };
  }
}

/**
 * Save channels configuration (Supabase or JSON fallback)
 */
async function saveChannelsConfig() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      // Map channel config to Supabase format
      const channelsToSave = channelsConfig.channels.map(channel => ({
        ...channel,
        channel_id: channel.channelId,
        last_checked: channel.lastChecked,
        last_video_id: channel.lastVideoId,
        processed_video_ids: channel.processedVideoIds,
        auto_process: channel.autoProcess,
        max_videos_per_check: channel.maxVideosPerCheck,
        min_video_length: channel.minVideoLength
      }));
      
      const success = await channelsDB.upsert(channelsToSave);
      if (success) {
        console.log(`💾 Saved ${channelsConfig.channels.length} channels to Supabase`);
        return;
      }
    } catch (error) {
      console.error('❌ Error saving channels to Supabase, falling back to JSON:', error.message);
    }
  }
  
  // Fallback to JSON files
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(CHANNELS_CONFIG_PATH, JSON.stringify(channelsConfig, null, 2));
    console.log(`💾 Saved channels configuration to JSON file`);
  } catch (error) {
    console.error('❌ Error saving channels config:', error.message);
  }
}

/**
 * Load technology reads snapshot from storage
 */
async function loadTechnologyReadsSnapshot() {
  if (technologyReadsCache.reads.length > 0) return;

  // Supabase first
  if (isSupabaseConfigured()) {
    try {
      const snapshot = await insightsStorage.loadLatestTechnologyReads();
      if (snapshot && snapshot.reads?.length > 0) {
        technologyReadsCache.reads = snapshot.reads;
        technologyReadsCache.lastGenerated = snapshot.generatedAt;
        console.log(`📦 Loaded technology reads snapshot from Supabase (${technologyReadsCache.reads.length} reads)`);
        return;
      }
    } catch (error) {
      console.error('❌ Error loading technology reads snapshot from Supabase:', error.message);
    }
  }

  // JSON fallback
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    const data = await fs.readFile(TECHNOLOGY_READS_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    technologyReadsCache.reads = parsed.reads || [];
    technologyReadsCache.lastGenerated = parsed.lastGenerated || null;
    console.log(`📦 Loaded technology reads snapshot from JSON (${technologyReadsCache.reads.length} reads)`);
  } catch {
    // No snapshot yet
  }
}

async function saveTechnologyReadsSnapshot() {
  if (technologyReadsCache.reads.length === 0) return;

  // Supabase
  if (isSupabaseConfigured()) {
    await insightsStorage.saveTechnologyReads(
      technologyReadsCache.reads,
      technologyReadsCache.lastGenerated
    );
  }

  // JSON fallback
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(
      TECHNOLOGY_READS_PATH,
      JSON.stringify({
        reads: technologyReadsCache.reads,
        lastGenerated: technologyReadsCache.lastGenerated
      }, null, 2)
    );
  } catch (error) {
    console.error('❌ Error saving technology reads snapshot:', error.message);
  }
}

async function loadTechnologyPredictionsSnapshot() {
  if (technologyPredictionsCache.predictions.length > 0) return;

  if (isSupabaseConfigured()) {
    try {
      const snapshot = await insightsStorage.loadLatestTechnologyPredictions();
      if (snapshot && snapshot.predictions?.length > 0) {
        technologyPredictionsCache.predictions = snapshot.predictions;
        technologyPredictionsCache.lastGenerated = snapshot.generatedAt;
        console.log(`📦 Loaded technology predictions snapshot from Supabase (${technologyPredictionsCache.predictions.length} entries)`);
        return;
      }
    } catch (error) {
      console.error('❌ Error loading technology predictions snapshot from Supabase:', error.message);
    }
  }

  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    const data = await fs.readFile(TECHNOLOGY_PREDICTIONS_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    technologyPredictionsCache.predictions = parsed.predictions || [];
    technologyPredictionsCache.lastGenerated = parsed.lastGenerated || null;
    console.log(`📦 Loaded technology predictions snapshot from JSON (${technologyPredictionsCache.predictions.length} entries)`);
  } catch {
    // ignore
  }
}

async function saveTechnologyPredictionsSnapshot() {
  if (technologyPredictionsCache.predictions.length === 0) return;

  if (isSupabaseConfigured()) {
    await insightsStorage.saveTechnologyPredictions(
      technologyPredictionsCache.predictions,
      technologyPredictionsCache.lastGenerated
    );
  }

  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.writeFile(
      TECHNOLOGY_PREDICTIONS_PATH,
      JSON.stringify({
        predictions: technologyPredictionsCache.predictions,
        lastGenerated: technologyPredictionsCache.lastGenerated
      }, null, 2)
    );
  } catch (error) {
    console.error('❌ Error saving technology predictions snapshot:', error.message);
  }
}

function isCacheFresh(lastGenerated, maxHours = 12) {
  if (!lastGenerated) return false;
  const ageHours = (Date.now() - new Date(lastGenerated).getTime()) / (1000 * 60 * 60);
  return ageHours < maxHours;
}

/**
 * Check all channels for new videos and process them
 */
async function checkAllChannelsForNewVideos() {
  console.log('🔍 Checking all channels for new videos...');
  
  const enabledChannels = channelsConfig.channels.filter(c => c.enabled && c.autoProcess);
  
  if (enabledChannels.length === 0) {
    console.log('   No enabled channels to check');
    return;
  }
  
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const channel of enabledChannels) {
    const processedVideoIds = channel.processedVideoIds || [];
    const result = await checkChannelForNewVideos(channel, processedVideoIds, podcastsCache);
    
    totalProcessed += result.processed;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
    
    // Update channel config
    channel.lastChecked = new Date().toISOString();
    channel.processedVideoIds = processedVideoIds;
    
    if (result.processed > 0 && processedVideoIds.length > 0) {
      channel.lastVideoId = processedVideoIds[processedVideoIds.length - 1];
    }
  }
  
  // Save updated config
  await saveChannelsConfig();
  
  // Save processed podcasts
  await savePodcastsToDB();
  
  console.log(`✅ Channel check complete: ${totalProcessed} processed, ${totalSkipped} skipped, ${totalErrors} errors`);
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
    
    // Level 2.5: Check by OpenAlex ID
    if (!isDuplicate && paper.openAlexId && seen.has(`openalex:${paper.openAlexId}`)) {
      isDuplicate = true;
    }
    
    // Level 2.6: Check by Crossref ID (DOI-based)
    if (!isDuplicate && paper.crossrefId && seen.has(`crossref:${paper.crossrefId}`)) {
      isDuplicate = true;
    }
    
    // Level 2.7: Check by PubMed ID
    if (!isDuplicate && paper.pubmedId && seen.has(`pubmed:${paper.pubmedId}`)) {
      isDuplicate = true;
    }
    
    // Level 2.8: Check by DBLP key
    if (!isDuplicate && paper.dblpKey && seen.has(`dblp:${paper.dblpKey}`)) {
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
      if (paper.openAlexId) seen.set(`openalex:${paper.openAlexId}`, true);
      if (paper.crossrefId) seen.set(`crossref:${paper.crossrefId}`, true);
      if (paper.pubmedId) seen.set(`pubmed:${paper.pubmedId}`, true);
      if (paper.dblpKey) seen.set(`dblp:${paper.dblpKey}`, true);
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
    
    // Strategy: Fetch recent papers first, then expand backwards to build comprehensive database
    let dateThreshold;
    const now = new Date();
    
    if (lastPaperDate) {
      // Fetch papers newer than the newest paper we have
      dateThreshold = new Date(lastPaperDate);
      // Add a small buffer (1 hour) to account for papers published at the same time
      dateThreshold.setHours(dateThreshold.getHours() - 1);
      console.log(`📅 Fetching papers newer than last known paper: ${dateThreshold.toISOString()}`);
    } else {
      // First run: fetch from last 24 months to build initial database
      dateThreshold = new Date();
      dateThreshold.setMonth(dateThreshold.getMonth() - 24);
      dateThreshold.setHours(0, 0, 0, 0);
      console.log(`📅 First run: Fetching papers from last 24 months to build database`);
    }
    
    // If we have very few papers (< 500), also fetch from older periods
    const shouldFetchOlder = papersCache.length < 500;
    if (shouldFetchOlder && lastPaperDate) {
      // Expand the threshold backwards to get more papers
      const expandedThreshold = new Date();
      expandedThreshold.setMonth(expandedThreshold.getMonth() - 12); // Go back 12 months
      if (expandedThreshold < dateThreshold) {
        dateThreshold = expandedThreshold;
        console.log(`📅 Database is small (${papersCache.length} papers), expanding to fetch from last 12 months`);
      }
    }
    
    // Try fetching recent papers first (newer than lastPaperDate)
    console.log(`🔍 Attempt 1: Fetching papers newer than ${dateThreshold.toISOString()}`);
    
    const [ssResult, arxivResult] = await Promise.allSettled([
      fetchLatestPapersFromSemanticScholar(100, currentYear, dateThreshold),
      fetchArXivLatest(300, dateThreshold)  // Increased from 100 to 300 papers per fetch
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
    
    if (papers.length > 0) {
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
        if (p.openAlexId) existingIds.add(`openalex:${p.openAlexId}`);
        if (p.crossrefId) existingIds.add(`crossref:${p.crossrefId}`);
        if (p.pubmedId) existingIds.add(`pubmed:${p.pubmedId}`);
        if (p.dblpKey) existingIds.add(`dblp:${p.dblpKey}`);
        existingIds.add(`title:${normalizeTitle(p.title)}`);
      });

      // Filter out papers that already exist in cache
      trulyNewPapers = enrichedNewPapers.filter(p => {
        const arxivId = p.arxivId || extractArxivId(p.link);
        if (arxivId && existingIds.has(`arxiv:${arxivId}`)) return false;
        if (p.semanticScholarId && existingIds.has(`ss:${p.semanticScholarId}`)) return false;
        if (p.openAlexId && existingIds.has(`openalex:${p.openAlexId}`)) return false;
        if (p.crossrefId && existingIds.has(`crossref:${p.crossrefId}`)) return false;
        if (p.pubmedId && existingIds.has(`pubmed:${p.pubmedId}`)) return false;
        if (p.dblpKey && existingIds.has(`dblp:${p.dblpKey}`)) return false;
        const titleKey = normalizeTitle(p.title);
        if (existingIds.has(`title:${titleKey}`)) return false;
        return true;
      });

      console.log(`🆕 Found ${trulyNewPapers.length} truly new papers (${enrichedNewPapers.length - trulyNewPapers.length} were already in cache)`);
    }

    // Expand backwards if:
    // 1. We got zero papers total, OR
    // 2. Database is small (< 1000 papers) and we need to build it up
    const shouldExpand = (trulyNewPapers.length === 0 && papers.length === 0) || 
                         (papersCache.length < 1000 && lastPaperDate);
    
    if (shouldExpand && lastPaperDate) {
      if (papersCache.length < 1000) {
        console.log(`📚 Database is small (${papersCache.length} papers), expanding backwards to build comprehensive database...`);
      } else {
        console.log('⚠️ No papers found at all, expanding backwards to fill gaps...');
      }
      
      // Define expansion strategy: go backwards from lastPaperDate
      // More aggressive expansion for small databases
      const isSmallDatabase = papersCache.length < 1000;
      const expansionWindows = isSmallDatabase ? [
        { days: 30, label: 'last 30 days' },
        { days: 60, label: 'last 60 days' },
        { days: 90, label: 'last 90 days' },
        { days: 180, label: 'last 6 months' },
        { days: 365, label: 'last year' },
        { days: 730, label: 'last 2 years' },
      ] : [
        { days: 7, label: 'last 7 days' },
        { days: 14, label: 'last 14 days' },
        { days: 30, label: 'last 30 days' },
        { days: 60, label: 'last 60 days' },
        { days: 90, label: 'last 90 days' },
        { days: 180, label: 'last 6 months' },
      ];
      
      for (let i = 0; i < expansionWindows.length; i++) {
        const window = expansionWindows[i];
        // Go backwards from lastPaperDate
        const backwardThreshold = new Date(lastPaperDate);
        backwardThreshold.setDate(backwardThreshold.getDate() - window.days);
        backwardThreshold.setHours(0, 0, 0, 0);
        
        // Skip if this window goes back further than our oldest paper
        if (oldestPaperDate && backwardThreshold < new Date(oldestPaperDate)) {
          console.log(`⏭️ Skipping ${window.label} - already have papers from this period`);
          continue;
        }
        
        console.log(`🔍 Attempt ${i + 2}/${expansionWindows.length + 1}: Fetching papers from ${window.label} (threshold: ${backwardThreshold.toISOString()})`);
        
        const [ssResult2, arxivResult2] = await Promise.allSettled([
          fetchLatestPapersFromSemanticScholar(100, currentYear, backwardThreshold),
          fetchArXivLatest(100, backwardThreshold)
        ]);
        
        let papers2 = [];
        
        if (ssResult2.status === 'fulfilled' && ssResult2.value.length > 0) {
          const transformed = ssResult2.value
            .map(transformSemanticScholarPaper)
            .filter(p => p !== null)
            .map(p => ({
              ...p,
              source: 'Semantic Scholar',
              sourceId: 'semantic-scholar'
            }));
          papers2.push(...transformed);
        }
        
        if (arxivResult2.status === 'fulfilled' && arxivResult2.value.length > 0) {
          const arxivWithSource = arxivResult2.value.map(p => ({
            ...p,
            source: 'arXiv',
            sourceId: 'arxiv'
          }));
          papers2.push(...arxivWithSource);
        }
        
        if (papers2.length === 0) {
          console.log(`⚠️ No papers found for ${window.label}, trying next window...`);
          continue;
        }
        
        const uniqueNewPapers2 = removeDuplicatePapers(papers2);
        const enrichedNewPapers2 = await enrichPapersWithCitations(uniqueNewPapers2);
        
        const existingIds2 = new Set();
        papersCache.forEach(p => {
          if (p.arxivId) existingIds2.add(`arxiv:${p.arxivId}`);
          if (p.semanticScholarId) existingIds2.add(`ss:${p.semanticScholarId}`);
          if (p.crossrefId) existingIds2.add(`crossref:${p.crossrefId}`);
          if (p.pubmedId) existingIds2.add(`pubmed:${p.pubmedId}`);
          if (p.dblpKey) existingIds2.add(`dblp:${p.dblpKey}`);
          existingIds2.add(`title:${normalizeTitle(p.title)}`);
        });
        
        const newPapersFromWindow = enrichedNewPapers2.filter(p => {
          const arxivId = p.arxivId || extractArxivId(p.link);
          if (arxivId && existingIds2.has(`arxiv:${arxivId}`)) return false;
          if (p.semanticScholarId && existingIds2.has(`ss:${p.semanticScholarId}`)) return false;
          if (p.crossrefId && existingIds2.has(`crossref:${p.crossrefId}`)) return false;
          if (p.pubmedId && existingIds2.has(`pubmed:${p.pubmedId}`)) return false;
          if (p.dblpKey && existingIds2.has(`dblp:${p.dblpKey}`)) return false;
          const titleKey = normalizeTitle(p.title);
          if (existingIds2.has(`title:${titleKey}`)) return false;
          return true;
        });
        
        console.log(`🆕 Found ${newPapersFromWindow.length} truly new papers from ${window.label} (${enrichedNewPapers2.length - newPapersFromWindow.length} were already in cache)`);
        
        if (newPapersFromWindow.length > 0) {
          trulyNewPapers = newPapersFromWindow;
          break; // Found new papers, stop expanding
        }
      }
    }

    // Handle different scenarios
    if (trulyNewPapers.length === 0 && papers.length > 0) {
      // We got papers but they were all duplicates - we're up to date!
      console.log('✅ All fetched papers were already in database - system is up to date');
      console.log(`📊 Current database size: ${papersCache.length} papers`);
      console.log(`📊 Date range: ${oldestPaperDate || 'N/A'} to ${lastPaperDate || 'N/A'}`);
      lastFetchTime = new Date().toISOString();
      await savePapersToDP();
      return; // Don't expand, don't make more requests
    } else if (trulyNewPapers.length === 0) {
      // No papers found at all
      console.log('⚠️ No new papers found - database is up to date');
      console.log(`📊 Current database size: ${papersCache.length} papers`);
      console.log(`📊 Date range: ${oldestPaperDate || 'N/A'} to ${lastPaperDate || 'N/A'}`);
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

    // After successful update, check for gaps in historical coverage and fill them
    if (lastPaperDate && oldestPaperDate) {
      await fillHistoricalGaps();
    }

  } catch (error) {
    console.error('❌ Error updating papers:', error.message);
    console.error(error.stack);
  }
}

/**
 * Fill gaps in historical paper coverage
 * Identifies missing months and fetches papers for those periods
 */
async function fillHistoricalGaps() {
  try {
    if (!lastPaperDate || !oldestPaperDate) {
      return; // Can't fill gaps without date range
    }

    const newest = new Date(lastPaperDate);
    const oldest = new Date(oldestPaperDate);
    const now = new Date();
    
    // Fill gaps for the last 24 months to build comprehensive database
    const twentyFourMonthsAgo = new Date(now);
    twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);
    const startDate = oldest < twentyFourMonthsAgo ? twentyFourMonthsAgo : oldest;
    
    // Group existing papers by month to identify gaps
    const papersByMonth = new Map();
    papersCache.forEach(paper => {
      const paperDate = new Date(paper.published || paper.updated || 0);
      const monthKey = `${paperDate.getFullYear()}-${String(paperDate.getMonth() + 1).padStart(2, '0')}`;
      if (!papersByMonth.has(monthKey)) {
        papersByMonth.set(monthKey, 0);
      }
      papersByMonth.set(monthKey, papersByMonth.get(monthKey) + 1);
    });

    // Find missing months in the last 24 months
    const missingMonths = [];
    const currentMonth = new Date(startDate);
    const endMonth = new Date(newest);
    
    // Determine minimum papers per month based on database size
    const minPapersPerMonth = papersCache.length < 1000 ? 20 : 50;
    
    while (currentMonth <= endMonth) {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const paperCount = papersByMonth.get(monthKey) || 0;
      
      // If a month has fewer papers than threshold, consider it a gap
      if (paperCount < minPapersPerMonth) {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
        missingMonths.push({
          monthKey,
          start: monthStart,
          end: monthEnd,
          count: paperCount
        });
      }
      
      // Move to next month
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    if (missingMonths.length === 0) {
      console.log('✅ No significant gaps found in historical coverage');
      return;
    }

    console.log(`🔍 Found ${missingMonths.length} months with gaps in coverage. Filling gaps...`);
    
    // Fetch papers for missing months (limit to 5 months per cycle to fill faster)
    const monthsToFill = missingMonths.slice(0, 5);
    
    for (const gap of monthsToFill) {
      console.log(`📅 Filling gap for ${gap.monthKey} (currently has ${gap.count} papers)`);
      
      const [ssGapResult, arxivGapResult] = await Promise.allSettled([
        fetchLatestPapersFromSemanticScholar(100, gap.start.getFullYear(), gap.start),
        fetchArXivLatest(100, gap.start)
      ]);
      
      let gapPapers = [];
      
      if (ssGapResult.status === 'fulfilled' && ssGapResult.value.length > 0) {
        const transformed = ssGapResult.value
          .map(transformSemanticScholarPaper)
          .filter(p => p !== null)
          .map(p => ({
            ...p,
            source: 'Semantic Scholar',
            sourceId: 'semantic-scholar'
          }));
        gapPapers.push(...transformed);
      }
      
      if (arxivGapResult.status === 'fulfilled' && arxivGapResult.value.length > 0) {
        const arxivWithSource = arxivGapResult.value.map(p => ({
          ...p,
          source: 'arXiv',
          sourceId: 'arxiv'
        }));
        gapPapers.push(...arxivWithSource);
      }
      
      // Filter papers to only include those from the gap month (with some flexibility)
      const gapMonthStart = new Date(gap.start.getFullYear(), gap.start.getMonth(), 1);
      const gapMonthEnd = new Date(gap.start.getFullYear(), gap.start.getMonth() + 1, 0, 23, 59, 59);
      
      // Allow papers from a few days before/after the month to account for date variations
      const flexibleStart = new Date(gapMonthStart);
      flexibleStart.setDate(flexibleStart.getDate() - 3);
      const flexibleEnd = new Date(gapMonthEnd);
      flexibleEnd.setDate(flexibleEnd.getDate() + 3);
      
      gapPapers = gapPapers.filter(paper => {
        const paperDate = new Date(paper.published || paper.updated || 0);
        return paperDate >= flexibleStart && paperDate <= flexibleEnd;
      });

      if (gapPapers.length === 0) {
        console.log(`⚠️ No papers found for ${gap.monthKey}`);
        continue;
      }

      // Remove duplicates within gap batch
      const uniqueGapPapers = removeDuplicatePapers(gapPapers);
      
      // Check against existing cache
      const existingIds = new Set();
      papersCache.forEach(p => {
        if (p.arxivId) existingIds.add(`arxiv:${p.arxivId}`);
        if (p.semanticScholarId) existingIds.add(`ss:${p.semanticScholarId}`);
        if (p.openAlexId) existingIds.add(`openalex:${p.openAlexId}`);
        if (p.crossrefId) existingIds.add(`crossref:${p.crossrefId}`);
        if (p.pubmedId) existingIds.add(`pubmed:${p.pubmedId}`);
        if (p.dblpKey) existingIds.add(`dblp:${p.dblpKey}`);
        existingIds.add(`title:${normalizeTitle(p.title)}`);
      });

      const newGapPapers = uniqueGapPapers.filter(p => {
        const arxivId = p.arxivId || extractArxivId(p.link);
        if (arxivId && existingIds.has(`arxiv:${arxivId}`)) return false;
        if (p.semanticScholarId && existingIds.has(`ss:${p.semanticScholarId}`)) return false;
        if (p.openAlexId && existingIds.has(`openalex:${p.openAlexId}`)) return false;
        if (p.crossrefId && existingIds.has(`crossref:${p.crossrefId}`)) return false;
        if (p.pubmedId && existingIds.has(`pubmed:${p.pubmedId}`)) return false;
        if (p.dblpKey && existingIds.has(`dblp:${p.dblpKey}`)) return false;
        const titleKey = normalizeTitle(p.title);
        if (existingIds.has(`title:${titleKey}`)) return false;
        return true;
      });

      if (newGapPapers.length > 0) {
        console.log(`✅ Found ${newGapPapers.length} new papers for ${gap.monthKey}`);
        
        // Enrich and add to cache
        const enrichedGapPapers = await enrichPapersWithCitations(newGapPapers);
        const mergedWithGaps = [...enrichedGapPapers, ...papersCache];
        
        // Sort and limit
        mergedWithGaps.sort((a, b) => {
          const dateA = new Date(a.published || a.updated || 0);
          const dateB = new Date(b.published || b.updated || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        const MAX_CACHE_SIZE = 10000;
        papersCache = mergedWithGaps.slice(0, MAX_CACHE_SIZE);
        
        // Update oldest date if needed
        if (mergedWithGaps.length > 0) {
          const oldestPaper = mergedWithGaps[mergedWithGaps.length - 1];
          const oldestDate = new Date(oldestPaper.published || oldestPaper.updated || 0);
          if (!oldestPaperDate || oldestDate < new Date(oldestPaperDate)) {
            oldestPaperDate = oldestDate.toISOString();
          }
        }
        
        // Save to database
        await savePapersToDP();
        console.log(`💾 Saved ${newGapPapers.length} papers from ${gap.monthKey} to database`);
      } else {
        console.log(`ℹ️ No new papers found for ${gap.monthKey} (all were duplicates)`);
      }
      
      // Small delay between gap fills to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`✅ Gap filling complete. Processed ${monthsToFill.length} months.`);
    
  } catch (error) {
    console.error('❌ Error filling historical gaps:', error.message);
    // Don't throw - gap filling is optional
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
 * GET /api/papers/total - Get total paper count in database (unfiltered)
 * IMPORTANT: This route must come BEFORE /api/papers/:id to avoid route conflicts
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
      'semantic-scholar': papersCache.filter(p => p.sourceId === 'semantic-scholar').length,
    }
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
 * GET /api/insights/technologies - Get technology momentum and predictions
 */
app.get('/api/insights/technologies', async (req, res) => {
  try {
    const timeWindow = parseInt(req.query.timeWindow) || 30; // days
    
    // Get all signals (papers + news + patents + etc.)
    const allSignals = await getAllSignals();
    
    // Extract all technologies
    const technologies = extractTechnologiesFromSignals(allSignals);
    
    // Calculate momentum for each technology
    const technologyInsights = technologies.map(tech => {
      const techSignals = allSignals.filter(s => 
        (s.technologies || []).includes(tech)
      );
      
      const momentum = calculateTechnologyMomentum(tech, techSignals, timeWindow);
      const signalStrength = calculateCombinedSignalStrength(tech, allSignals);
      
      return {
        technology: tech,
        momentum: momentum.momentum,
        velocity: momentum.velocity,
        confidence: momentum.confidence,
        signalCount: momentum.signalCount,
        signalStrength: signalStrength.totalStrength,
        sourceBreakdown: signalStrength.sourceBreakdown
      };
    });
    
    // Sort by momentum
    technologyInsights.sort((a, b) => b.momentum - a.momentum);
    
    res.json({
      technologies: technologyInsights,
      timeWindow: timeWindow,
      lastUpdate: insightsCache.lastUpdate
    });
  } catch (error) {
    console.error('Error fetching technology insights:', error);
    res.status(500).json({ error: 'Failed to fetch technology insights' });
  }
});

/**
 * GET /api/insights/industries - Get industry growth rankings
 */
app.get('/api/insights/industries', async (req, res) => {
  try {
    const timeWindow = parseInt(req.query.timeWindow) || 90; // days
    
    const allSignals = await getAllSignals();
    const industries = extractIndustriesFromSignals(allSignals);
    
    const industryInsights = industries.map(industry => {
      const growth = calculateIndustryGrowth(industry, allSignals, timeWindow);
      
      return {
        industry: industry,
        growthRate: growth.growthRate,
        growthScore: growth.growthScore,
        confidence: growth.confidence,
        signalCount: growth.signalCount,
        monthlyTrend: growth.monthlyTrend
      };
    });
    
    // Sort by growth score
    industryInsights.sort((a, b) => b.growthScore - a.growthScore);
    
    res.json({
      industries: industryInsights,
      timeWindow: timeWindow,
      lastUpdate: insightsCache.lastUpdate
    });
  } catch (error) {
    console.error('Error fetching industry insights:', error);
    res.status(500).json({ error: 'Failed to fetch industry insights' });
  }
});

/**
 * GET /api/insights/emerging - Get emerging technologies
 */
app.get('/api/insights/emerging', async (req, res) => {
  try {
    const timeWindow = parseInt(req.query.timeWindow) || 30;
    
    const allSignals = await getAllSignals();
    const emerging = detectEmergingTechnologies(allSignals, timeWindow);
    
    res.json({
      emerging: emerging.slice(0, 20), // Top 20
      timeWindow: timeWindow,
      lastUpdate: insightsCache.lastUpdate
    });
  } catch (error) {
    console.error('Error fetching emerging technologies:', error);
    res.status(500).json({ error: 'Failed to fetch emerging technologies' });
  }
});

/**
 * GET /api/insights/predictions - Get next big technology predictions (enhanced)
 */
app.get('/api/insights/predictions', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    await loadTechnologyPredictionsSnapshot();

    if (!force && technologyPredictionsCache.predictions.length > 0 && isCacheFresh(technologyPredictionsCache.lastGenerated, 6)) {
      return res.json({
        predictions: technologyPredictionsCache.predictions,
        lastUpdate: technologyPredictionsCache.lastGenerated,
        cached: true
      });
    }

    const allSignals = await getAllSignals();
    
    // Extract technologies from signals
    let technologies = extractTechnologiesFromSignals(allSignals);
    
    // If no technologies from signals, extract from papers cache
    if (technologies.length === 0 && papersCache.length > 0) {
      const paperTechnologies = new Set();
      papersCache.forEach(paper => {
        (paper.tags || []).forEach(tag => {
          if (tag.length > 2 && tag.length < 50) {
            paperTechnologies.add(tag);
          }
        });
        (paper.categories || []).forEach(cat => {
          if (cat.length > 2 && cat.length < 50) {
            paperTechnologies.add(cat);
          }
        });
      });
      technologies = Array.from(paperTechnologies).slice(0, 20); // Top 20
    }
    
    // If still no technologies, use common tech keywords
    if (technologies.length === 0) {
      technologies = ['AI', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'Robotics', 'LLM', 'Autonomous Systems'];
    }
    
    // Use enhanced prediction with comprehensive insights
    const predictions = predictNextBigTechnology(technologies, allSignals, papersCache)
      .slice(0, 10); // Top 10

    technologyPredictionsCache.predictions = predictions;
    technologyPredictionsCache.lastGenerated = new Date().toISOString();
    await saveTechnologyPredictionsSnapshot();
    
    res.json({
      predictions,
      lastUpdate: technologyPredictionsCache.lastGenerated,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions', details: error.message });
  }
});

/**
 * GET /api/insights/leader-quotes - Get key quotes from podcasts
 */
app.get('/api/insights/leader-quotes', async (req, res) => {
  try {
    const allSignals = await getAllSignals();
    const quotes = extractLeaderQuotes(allSignals);
    
    res.json({
      quotes: quotes,
      lastUpdate: insightsCache.lastUpdate
    });
  } catch (error) {
    console.error('Error fetching leader quotes:', error);
    res.status(500).json({ error: 'Failed to fetch leader quotes' });
  }
});

/**
 * POST /api/podcasts/process - Process a podcast transcript
 * Body: { transcript: string, metadata: { title, published, source, link, episode, podcast } }
 */
app.post('/api/podcasts/process', async (req, res) => {
  try {
    const { transcript, metadata } = req.body;
    
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    
    console.log(`📻 Processing podcast transcript: ${metadata?.title || 'Untitled'}`);
    const processed = await processPodcastTranscript(transcript, metadata);
    
    if (!processed) {
      return res.status(500).json({ error: 'Failed to process transcript' });
    }
    
    // Add to cache
    const existingIndex = podcastsCache.findIndex(p => p.id === processed.id);
    if (existingIndex >= 0) {
      podcastsCache[existingIndex] = processed;
    } else {
      podcastsCache.push(processed);
    }
    
    // Save to database
    await savePodcastsToDB();
    
    res.json({
      success: true,
      podcast: processed,
      message: 'Podcast processed and saved successfully'
    });
  } catch (error) {
    console.error('Error processing podcast:', error);
    res.status(500).json({ error: 'Failed to process podcast', details: error.message });
  }
});

/**
 * POST /api/podcasts/youtube - Process YouTube video transcript
 * Body: { videoId: string, metadata: { title, published, episode, podcast } }
 */
app.post('/api/podcasts/youtube', async (req, res) => {
  try {
    const { videoId, metadata } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'YouTube video ID is required' });
    }
    
    console.log(`📹 Processing YouTube video: ${videoId}`);
    const processed = await processYouTubeVideo(videoId, metadata);
    
    if (!processed) {
      return res.status(500).json({ error: 'Failed to fetch or process YouTube transcript' });
    }
    
    // Add to cache
    const existingIndex = podcastsCache.findIndex(p => p.id === processed.id);
    if (existingIndex >= 0) {
      podcastsCache[existingIndex] = processed;
    } else {
      podcastsCache.push(processed);
    }
    
    // Save to database
    await savePodcastsToDB();
    
    res.json({
      success: true,
      podcast: processed,
      message: 'YouTube video processed and saved successfully'
    });
  } catch (error) {
    console.error('Error processing YouTube video:', error);
    res.status(500).json({ error: 'Failed to process YouTube video', details: error.message });
  }
});

/**
 * GET /api/podcasts - Get all processed podcasts
 */
app.get('/api/podcasts', (req, res) => {
  const { limit, offset } = req.query;
  const limitNum = limit ? parseInt(limit) : podcastsCache.length;
  const offsetNum = offset ? parseInt(offset) : 0;
  
  const podcasts = podcastsCache
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .slice(offsetNum, offsetNum + limitNum);
  
  res.json({
    podcasts,
    total: podcastsCache.length,
    limit: limitNum,
    offset: offsetNum
  });
});

/**
 * GET /api/podcasts/query - Query stances across podcasts
 * Query params: technology, stance (pro/con/neutral/mixed), speaker, startDate, endDate
 */
app.get('/api/podcasts/query', (req, res) => {
  try {
    const { technology, stance, speaker, startDate, endDate } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;
    
    const results = queryStances(podcastsCache, {
      technology,
      stance,
      speaker,
      dateRange
    });
    
    res.json({
      results,
      count: results.length,
      filters: { technology, stance, speaker, startDate, endDate }
    });
  } catch (error) {
    console.error('Error querying podcasts:', error);
    res.status(500).json({ error: 'Failed to query podcasts', details: error.message });
  }
});

/**
 * GET /api/podcasts/aggregate - Aggregate views by speaker, episode, or industry
 * Query param: groupBy (speaker, episode, industry)
 */
app.get('/api/podcasts/aggregate', (req, res) => {
  try {
    const { groupBy } = req.query;
    const aggregated = aggregateViews(podcastsCache, groupBy || 'speaker');
    
    res.json({
      aggregated,
      groupBy: groupBy || 'speaker',
      totalPodcasts: podcastsCache.length
    });
  } catch (error) {
    console.error('Error aggregating podcasts:', error);
    res.status(500).json({ error: 'Failed to aggregate podcasts', details: error.message });
  }
});

/**
 * GET /api/podcasts/:id - Get specific podcast
 */
app.get('/api/podcasts/:id', (req, res) => {
  const podcast = podcastsCache.find(p => p.id === req.params.id);
  
  if (!podcast) {
    return res.status(404).json({ error: 'Podcast not found' });
  }
  
  res.json(podcast);
});

/**
 * GET /api/podcasts/:id/breakdown - Get detailed breakdown of a video/podcast
 */
app.get('/api/podcasts/:id/breakdown', async (req, res) => {
  try {
    const podcast = podcastsCache.find(p => p.id === req.params.id);
    
    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    
    // Check if breakdown already exists in metadata
    if (podcast.breakdown) {
      return res.json(podcast.breakdown);
    }
    
    // If breakdown doesn't exist, try to generate it
    // This requires the transcript, which might not be cached
    if (podcast.metadata?.transcript) {
      const { generateVideoBreakdown } = await import('./services/videoBreakdownService.js');
      const breakdown = await generateVideoBreakdown(
        podcast.id,
        podcast.metadata.transcript,
        {
          title: podcast.title,
          channel: podcast.podcast,
          duration: podcast.metadata?.duration
        }
      );
      
      if (breakdown) {
        // Store breakdown in podcast metadata
        if (!podcast.metadata) podcast.metadata = {};
        podcast.breakdown = breakdown;
        return res.json(breakdown);
      }
    }
    
    return res.status(404).json({ error: 'Breakdown not available. Transcript may not be stored.' });
  } catch (error) {
    console.error('Error fetching breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown', message: error.message });
  }
});

/**
 * POST /api/channels - Add a new channel
 */
app.post('/api/channels', async (req, res) => {
  try {
    const { channelId, name, autoProcess = true, maxVideosPerCheck = 5 } = req.body;
    
    if (!channelId || !name) {
      return res.status(400).json({ error: 'channelId and name are required' });
    }
    
    // Extract actual channel ID
    const actualChannelId = extractChannelId(channelId);
    
    // Check if channel already exists
    const existing = channelsConfig.channels.find(c => c.channelId === actualChannelId);
    if (existing) {
      return res.status(400).json({ error: 'Channel already exists' });
    }
    
    const newChannel = {
      id: `channel_${Date.now()}`,
      channelId: actualChannelId,
      name,
      enabled: true,
      lastChecked: null,
      lastVideoId: null,
      processedVideoIds: [],
      autoProcess,
      maxVideosPerCheck,
      minVideoLength: channelsConfig.settings.minVideoLength || 300 // 5 minutes default
    };
    
    channelsConfig.channels.push(newChannel);
    await saveChannelsConfig();
    
    res.json({ success: true, channel: newChannel });
  } catch (error) {
    console.error('Error adding channel:', error);
    res.status(500).json({ error: 'Failed to add channel', details: error.message });
  }
});

/**
 * GET /api/channels - List all channels
 */
app.get('/api/channels', (req, res) => {
  res.json({
    channels: channelsConfig.channels,
    settings: channelsConfig.settings
  });
});

/**
 * PUT /api/channels/:id - Update channel
 */
app.put('/api/channels/:id', async (req, res) => {
  try {
    const channel = channelsConfig.channels.find(c => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    Object.assign(channel, req.body);
    await saveChannelsConfig();
    
    res.json({ success: true, channel });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

/**
 * DELETE /api/channels/:id - Remove channel
 */
app.delete('/api/channels/:id', async (req, res) => {
  try {
    const index = channelsConfig.channels.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    channelsConfig.channels.splice(index, 1);
    await saveChannelsConfig();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove channel' });
  }
});

/**
 * POST /api/channels/:id/check - Manually check channel for new videos
 */
app.post('/api/channels/:id/check', async (req, res) => {
  try {
    const channel = channelsConfig.channels.find(c => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const processedVideoIds = channel.processedVideoIds || [];
    const result = await checkChannelForNewVideos(channel, processedVideoIds, podcastsCache);
    
    // Update channel
    channel.lastChecked = new Date().toISOString();
    channel.processedVideoIds = processedVideoIds;
    await saveChannelsConfig();
    
    // Save podcasts
    await savePodcastsToDB();
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error checking channel:', error);
    res.status(500).json({ error: 'Failed to check channel', details: error.message });
  }
});

/**
 * POST /api/channels/check-all - Manually check all enabled channels
 */
app.post('/api/channels/check-all', async (req, res) => {
  try {
    await checkAllChannelsForNewVideos();
    res.json({ success: true, message: 'All channels checked' });
  } catch (error) {
    console.error('Error checking all channels:', error);
    res.status(500).json({ error: 'Failed to check channels', details: error.message });
  }
});

/**
 * GET /api/channels/:id/videos - Get videos from a channel with insights
 */
app.get('/api/channels/:id/videos', async (req, res) => {
  try {
    const channel = channelsConfig.channels.find(c => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const { limit = 10 } = req.query;
    
    // Fetch recent videos (will filter out Shorts and videos < 5 minutes)
    const minVideoLength = channel.minVideoLength || 300; // 5 minutes default
    const videos = await fetchChannelVideos(
      channel.channelId,
      parseInt(limit),
      null, // No date filter, get most recent
      minVideoLength // Filter out videos shorter than this
    );
    
    // Get insights for each video, and process unprocessed ones
    const videosWithInsights = await Promise.all(
      videos.map(async (video) => {
        // Check if we already have this video processed
        let existingPodcast = null;
        
        // Try Supabase first
        if (isSupabaseConfigured()) {
          try {
            existingPodcast = await podcastsDB.getByVideoId(video.videoId);
          } catch (error) {
            console.error('Error checking Supabase for existing podcast:', error);
          }
        }
        
        // Fallback to cache if not found in Supabase
        if (!existingPodcast) {
          existingPodcast = podcastsCache.find(p => 
            p.link && p.link.includes(video.videoId)
          );
        }
        
        if (existingPodcast) {
          // Use existing insights
          return {
            videoId: video.videoId,
            title: video.title,
            publishedAt: video.publishedAt,
            thumbnail: video.thumbnail,
            link: `https://www.youtube.com/watch?v=${video.videoId}`,
            duration: video.duration,
            viewCount: video.viewCount,
            insights: {
              technologies: existingPodcast.technologies || [],
              companies: existingPodcast.companies || [],
              keyQuotes: existingPodcast.metadata?.keyQuotes || [],
              stanceDistribution: existingPodcast.metadata?.stanceDistribution || {},
              summary: existingPodcast.metadata?.summary || 
                (existingPodcast.metadata?.aggregatedInsights ? 
                  `This video discusses ${existingPodcast.technologies.length} technologies with ${existingPodcast.metadata.keyQuotes.length} key insights.` :
                  'Processing insights...')
            },
            processed: true
          };
        } else {
          // Auto-process video if autoProcess is enabled
          if (channel.autoProcess) {
            try {
              console.log(`🔄 Auto-processing video: ${video.title}`);
              const processedPodcast = await processYouTubeVideo(video.videoId, {
                title: video.title,
                published: video.publishedAt,
                source: 'YouTube',
                sourceId: 'youtube',
                link: `https://www.youtube.com/watch?v=${video.videoId}`,
                podcast: channel.name,
                episode: video.title
              });
              
              if (processedPodcast) {
                // Check if processing actually succeeded (has content)
                const hasContent = processedPodcast.content && processedPodcast.content.length > 0;
                
                if (!hasContent) {
                  // Transcript not available - don't save to cache, just return unprocessed
                  console.log(`   ⚠️ Skipping video (no transcript available): ${video.title}`);
                  return {
                    videoId: video.videoId,
                    title: video.title,
                    publishedAt: video.publishedAt,
                    thumbnail: video.thumbnail,
                    link: `https://www.youtube.com/watch?v=${video.videoId}`,
                    duration: video.duration,
                    viewCount: video.viewCount,
                    insights: null,
                    processed: false,
                    error: 'Transcript not available'
                  };
                }
                
                // Add to cache
                const existingIndex = podcastsCache.findIndex(p => p.id === processedPodcast.id);
                if (existingIndex >= 0) {
                  podcastsCache[existingIndex] = processedPodcast;
                } else {
                  podcastsCache.push(processedPodcast);
                }
                
                // Save to database
                await savePodcastsToDB();
                
                return {
                  videoId: video.videoId,
                  title: video.title,
                  publishedAt: video.publishedAt,
                  thumbnail: video.thumbnail,
                  link: `https://www.youtube.com/watch?v=${video.videoId}`,
                  duration: video.duration,
                  viewCount: video.viewCount,
                  insights: {
                    technologies: processedPodcast.technologies || [],
                    companies: processedPodcast.companies || [],
                    keyQuotes: processedPodcast.metadata?.keyQuotes || [],
                    stanceDistribution: processedPodcast.metadata?.stanceDistribution || {},
                    summary: processedPodcast.metadata?.summary || 
                      (processedPodcast.metadata?.aggregatedInsights ? 
                        `This video discusses ${processedPodcast.technologies.length} technologies with ${processedPodcast.metadata.keyQuotes.length} key insights.` :
                        'Processing complete')
                  },
                  processed: true
                };
              }
            } catch (error) {
              console.error(`Error auto-processing video ${video.videoId}:`, error.message);
              // Fall through to return unprocessed video
            }
          }
          
          // Return video info without insights (processing failed or disabled)
          return {
            videoId: video.videoId,
            title: video.title,
            publishedAt: video.publishedAt,
            thumbnail: video.thumbnail,
            link: `https://www.youtube.com/watch?v=${video.videoId}`,
            duration: video.duration,
            viewCount: video.viewCount,
            insights: null,
            processed: false
          };
        }
      })
    );
    
    res.json({
      channel: {
        id: channel.id,
        name: channel.name,
        channelId: channel.channelId
      },
      videos: videosWithInsights,
      total: videosWithInsights.length
    });
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    res.status(500).json({ error: 'Failed to fetch channel videos', details: error.message });
  }
});

/**
 * POST /api/channels/:id/videos/process - Manually process all unprocessed videos from a channel
 */
app.post('/api/channels/:id/videos/process', async (req, res) => {
  try {
    const channel = channelsConfig.channels.find(c => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const { limit = 10 } = req.query;
    
    // Fetch recent videos
    const videos = await fetchChannelVideos(
      channel.channelId,
      parseInt(limit),
      null
    );
    
    // Filter out already processed videos
    const unprocessedVideos = [];
    for (const video of videos) {
      let existingPodcast = null;
      
      // Try Supabase first
      if (isSupabaseConfigured()) {
        try {
          existingPodcast = await podcastsDB.getByVideoId(video.videoId);
        } catch (error) {
          console.error('Error checking Supabase for existing podcast:', error);
        }
      }
      
      // Fallback to cache if not found in Supabase
      if (!existingPodcast) {
        existingPodcast = podcastsCache.find(p => 
          p.link && p.link.includes(video.videoId)
        );
      }
      
      if (!existingPodcast) {
        unprocessedVideos.push(video);
      }
    }
    
    if (unprocessedVideos.length === 0) {
      return res.json({
        success: true,
        message: 'All videos are already processed',
        processed: 0,
        total: videos.length
      });
    }
    
    console.log(`🔄 Processing ${unprocessedVideos.length} videos from ${channel.name}...`);
    
    const processedVideos = [];
    const errors = [];
    
    for (const video of unprocessedVideos) {
      try {
        console.log(`   Processing: ${video.title}`);
        const processedPodcast = await processYouTubeVideo(video.videoId, {
          title: video.title,
          published: video.publishedAt,
          source: 'YouTube',
          sourceId: 'youtube',
          link: `https://www.youtube.com/watch?v=${video.videoId}`,
          podcast: channel.name,
          episode: video.title
        });
        
        if (processedPodcast) {
          const existingIndex = podcastsCache.findIndex(p => p.id === processedPodcast.id);
          if (existingIndex >= 0) {
            podcastsCache[existingIndex] = processedPodcast;
          } else {
            podcastsCache.push(processedPodcast);
          }
          processedVideos.push(video.videoId);
        } else {
          errors.push({ videoId: video.videoId, error: 'Processing returned null' });
        }
        
        // Rate limiting: wait 2 seconds between videos
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`   Error processing ${video.videoId}:`, error.message);
        errors.push({ videoId: video.videoId, error: error.message });
      }
    }
    
    // Save to database
    await savePodcastsToDB();
    
    res.json({
      success: true,
      processed: processedVideos.length,
      errorCount: errors.length,
      total: videos.length,
      processedVideoIds: processedVideos,
      errors: errors
    });
  } catch (error) {
    console.error('Error processing channel videos:', error);
    res.status(500).json({ error: 'Failed to process videos', details: error.message });
  }
});

async function generateTechnologyReads({ force = false, reason = 'api' } = {}) {
  await loadTechnologyReadsSnapshot();

  // Check cache freshness
  const now = new Date();
  const lastGenerated = technologyReadsCache.lastGenerated 
    ? new Date(technologyReadsCache.lastGenerated)
    : null;
  
  const isSameDay = lastGenerated && 
    lastGenerated.getDate() === now.getDate() &&
    lastGenerated.getMonth() === now.getMonth() &&
    lastGenerated.getFullYear() === now.getFullYear();
  
  if (!force && isSameDay && technologyReadsCache.reads.length >= technologyReadsCache.dailyLimit) {
    console.log(`📚 Returning cached reads (${technologyReadsCache.reads.length}) for reason=${reason}`);
    return {
      reads: technologyReadsCache.reads,
      totalTechnologies: technologyReadsCache.reads.length,
      lastUpdate: technologyReadsCache.lastGenerated,
      cached: true,
      message: `Showing ${technologyReadsCache.reads.length} detailed reads generated today. New reads will be generated tomorrow.`
    };
  }
  
  console.log(`📚 Generating detailed technology reads from ${papersCache.length} papers (force=${force}, reason=${reason})...`);
  console.log(`🎯 Daily limit: ${technologyReadsCache.dailyLimit} reads (very detailed)`);
  
  if (papersCache.length === 0) {
    console.log('⚠️ No papers in cache');
    return {
      reads: [],
      totalTechnologies: 0,
      lastUpdate: lastFetchTime || new Date().toISOString(),
      message: 'No papers available yet. Please wait for papers to be fetched.'
    };
  }
  
  const technologies = extractTechnologiesFromPapers(papersCache);
  console.log(`📊 Found ${technologies.length} unique technologies`);
  
  if (technologies.length === 0) {
    console.log('⚠️ No technologies extracted. Sample paper tags:', 
      papersCache.slice(0, 3).map(p => ({ 
        title: p.title?.substring(0, 50), 
        tags: p.tags?.slice(0, 3),
        categories: p.categories?.slice(0, 3)
      }))
    );
    return {
      reads: [],
      totalTechnologies: 0,
      lastUpdate: lastFetchTime || new Date().toISOString(),
      message: 'No technologies found in papers. Papers may not have tags or categories.'
    };
  }
  
  const minPapers = papersCache.length > 200 ? 5 : 3;
  const allTechs = Array.from(technologies.values());
  
  const emerging = allTechs
    .filter(tech => tech.count >= minPapers)
    .sort((a, b) => {
      const scoreA = (a.count * 2) + (a.recentCount * 5) + (a.avgCitations * 0.2) + (a.growthRate * 0.5) + (a.papers.length * 0.1);
      const scoreB = (b.count * 2) + (b.recentCount * 5) + (b.avgCitations * 0.2) + (b.growthRate * 0.5) + (b.papers.length * 0.1);
      return scoreB - scoreA;
    })
    .slice(0, technologyReadsCache.dailyLimit);
  
  console.log(`🚀 Identified ${emerging.length} high-quality technologies for detailed reads (min papers: ${minPapers}, total techs: ${allTechs.length})`);
  
  const buildResponse = (reads, totalTechs, cached = false, message) => ({
    reads,
    totalTechnologies: totalTechs,
    lastUpdate: technologyReadsCache.lastGenerated || now.toISOString(),
    cached,
    message,
    dailyLimit: technologyReadsCache.dailyLimit
  });
  
  if (emerging.length === 0) {
    console.log('📋 Using fallback: top technologies by count');
    const fallback = allTechs
      .sort((a, b) => b.count - a.count)
      .slice(0, technologyReadsCache.dailyLimit);
    
    if (fallback.length === 0) {
      return {
        reads: [],
        totalTechnologies: technologies.length,
        lastUpdate: lastFetchTime || new Date().toISOString(),
        message: 'No technologies found matching criteria.',
        dailyLimit: technologyReadsCache.dailyLimit
      };
    }
    
    const allSignals = await getAllSignals();
    console.log(`✨ Generating ${fallback.length} detailed reads (fallback)...`);
    
    const reads = await Promise.all(
      fallback.map(async (tech, index) => {
        try {
          console.log(`   [${index + 1}/${fallback.length}] Generating detailed read for: ${tech.name}`);
          return await generateTechnologyRead(tech, allSignals, papersCache);
        } catch (error) {
          console.error(`Error generating read for ${tech.name}:`, error.message);
          return null;
        }
      })
    );
    
    const validReads = reads.filter(read => read !== null)
      .sort((a, b) => (b.predictionScore || 0) - (a.predictionScore || 0));
    
    technologyReadsCache.reads = validReads;
    technologyReadsCache.lastGenerated = now.toISOString();
    await saveTechnologyReadsSnapshot();
    
    return buildResponse(validReads, technologies.length);
  }
  
  const allSignals = await getAllSignals();
  console.log(`✨ Generating ${emerging.length} very detailed reads (reason=${reason})...`);
  
  const reads = await Promise.all(
    emerging.map(async (tech, index) => {
      try {
        console.log(`   [${index + 1}/${emerging.length}] Generating detailed read for: ${tech.name}`);
        return await generateTechnologyRead(tech, allSignals, papersCache);
      } catch (error) {
        console.error(`Error generating read for ${tech.name}:`, error.message);
        console.error('Stack:', error.stack);
        return null;
      }
    })
  );
  
  const validReads = reads.filter(read => read !== null)
    .sort((a, b) => (b.predictionScore || 0) - (a.predictionScore || 0));
  
  technologyReadsCache.reads = validReads;
  technologyReadsCache.lastGenerated = now.toISOString();
  await saveTechnologyReadsSnapshot();
  
  console.log(`✅ Generated ${validReads.length} detailed technology reads (cached for today)`);
  
  return buildResponse(validReads, technologies.length);
}

/**
 * GET /api/insights/technology-reads - Get comprehensive reads on emerging technologies
 * Analyzes all papers to find technologies and generates detailed insights
 * LIMITED TO 20 READS PER DAY - Very detailed, high-quality reads
 */
app.get('/api/insights/technology-reads', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const result = await generateTechnologyReads({ force, reason: 'api' });
    res.json(result);
  } catch (error) {
    console.error('Error generating technology reads:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate technology reads', details: error.message });
  }
});

/**
 * GET /api/insights/combined-signal - Get combined signal strength for a technology
 */
app.get('/api/insights/combined-signal', async (req, res) => {
  try {
    const technology = req.query.technology;
    
    if (!technology) {
      return res.status(400).json({ error: 'Technology parameter required' });
    }
    
    const allSignals = await getAllSignals();
    const signalStrength = calculateCombinedSignalStrength(technology, allSignals);
    
    res.json({
      technology: technology,
      signalStrength: signalStrength,
      lastUpdate: insightsCache.lastUpdate
    });
  } catch (error) {
    console.error('Error fetching combined signal:', error);
    res.status(500).json({ error: 'Failed to fetch combined signal' });
  }
});

/**
 * Helper function to get all signals (papers + other sources + podcasts)
 */
async function getAllSignals() {
  // Always include fresh papers
  const paperSignals = papersCache.map(paper => ({
    ...paper,
    type: 'paper'
  }));
  
  // Include podcasts
  const podcastSignals = podcastsCache.map(podcast => ({
    ...podcast,
    type: 'podcast',
    published: podcast.published || new Date().toISOString()
  }));
  
  // Get other signals from cache or fetch fresh
  let otherSignals = [];
  if (allSignalsCache.length === 0 || 
      !insightsCache.lastUpdate || 
      Date.now() - new Date(insightsCache.lastUpdate).getTime() > 6 * 60 * 60 * 1000) {
    // Fetch fresh signals
    otherSignals = await aggregateAllSignals(30);
    // Update cache (excluding papers and podcasts, as they're added fresh each time)
    allSignalsCache = otherSignals.filter(s => s.type !== 'paper' && s.type !== 'podcast');
    insightsCache.lastUpdate = new Date().toISOString();
  } else {
    // Use cached other signals
    otherSignals = allSignalsCache;
  }
  
  // Always combine fresh papers, podcasts, and other signals
  return [...paperSignals, ...podcastSignals, ...otherSignals];
}

// ============================================
// META-NARRATIVE & GRAPH API
// ============================================

/**
 * GET /api/narratives - Get synthesized meta-narratives
 */
app.get('/api/narratives', async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.json({ narratives: [], error: 'Supabase not configured' });
  }
  
  try {
    const { supabase } = await import('./services/supabaseService.js');
    const { data, error } = await supabase
      .from('meta_narratives')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (error) throw error;
    res.json({ narratives: data || [] });
  } catch (error) {
    console.error('Error fetching narratives:', error);
    res.status(500).json({ error: 'Failed to fetch narratives' });
  }
});

/**
 * POST /api/narratives/generate - Manually trigger synthesis for a topic
 */
app.post('/api/narratives/generate', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic required' });
  
  try {
    const { generateMetaNarrativeForTopic } = await import('./services/synthesisService.js');
    const narrative = await generateMetaNarrativeForTopic(topic);
    
    if (narrative) {
      res.json({ success: true, narrative });
    } else {
      res.status(404).json({ error: 'Could not generate narrative (insufficient data)' });
    }
  } catch (error) {
    console.error('Error generating narrative:', error);
    res.status(500).json({ error: 'Failed to generate narrative' });
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
  console.log('🚀 Starting Insider Info Backend Server...');
  
  // Check and free port if needed
  await checkAndFreePort(PORT);
  
  // STEP 1: Load papers from database FIRST
  await loadPapersFromDB();
  await loadPodcastsFromDB();
  
  // STEP 2: Load channels config (needed for video fetching)
  await loadChannelsConfig();
  await loadTechnologyReadsSnapshot();
  await loadTechnologyPredictionsSnapshot();
  
  // STEP 3: Start server
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📚 Serving ${papersCache.length} papers`);
    console.log(`🎥 Serving ${podcastsCache.length} videos/podcasts`);
  });
  
  // STEP 4: Set up cron jobs for automated paper fetching
  // Daily paper fetch at 8:00 AM (UTC) - adjust timezone as needed
  // Note: Render uses UTC timezone, so 8 AM UTC = 12 AM PST / 3 AM EST
  // To run at 8 AM PST, use: '0 8 * * *' and set TZ=America/Los_Angeles in Render env
  const paperFetchCron = process.env.PAPER_FETCH_CRON || '0 8 * * *'; // Default: 8 AM UTC
  cron.schedule(paperFetchCron, async () => {
    console.log('⏰ Daily paper fetch triggered at 8 AM');
    try {
      await updatePapers();
      console.log('✅ Daily paper fetch completed');
    } catch (error) {
      console.error('❌ Error in daily paper fetch:', error.message);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC'
  });
  console.log(`⏰ Daily paper fetch scheduled: ${paperFetchCron} (${process.env.TZ || 'UTC'})`);
  
  // STEP 5: Schedule daily technology reads generation
  const techReadsCron = process.env.TECH_READS_CRON || '0 8 * * *'; // Default 8 AM UTC
  cron.schedule(techReadsCron, async () => {
    console.log('📖 Daily technology reads generation triggered at 8 AM');
    try {
      const result = await generateTechnologyReads({ force: true, reason: 'cron' });
      console.log(`✅ Daily technology reads generated: ${result.reads.length} reads`);
    } catch (error) {
      console.error('❌ Error generating daily technology reads:', error.message);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC'
  });
  console.log(`📖 Daily technology reads scheduled: ${techReadsCron} (${process.env.TZ || 'UTC'})`);

  // STEP 6: Schedule Daily Meta-Narrative Synthesis
  const synthesisCron = process.env.SYNTHESIS_CRON || '0 9 * * *'; // 9 AM UTC
  cron.schedule(synthesisCron, async () => {
    console.log('🧠 Daily Meta-Narrative Synthesis triggered at 9 AM');
    try {
      await runDailySynthesis();
      console.log('✅ Daily Synthesis complete');
    } catch (error) {
      console.error('❌ Error in Daily Synthesis:', error.message);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC'
  });
  console.log(`🧠 Daily Meta-Narrative Synthesis scheduled: ${synthesisCron} (${process.env.TZ || 'UTC'})`);
  
  // STEP 7: Warm-up tasks when server wakes up
  setImmediate(async () => {
    console.log('🔥 Running startup warm-up tasks...');
    try {
      console.log('📚 Refreshing papers on startup...');
      await updatePapers();
      console.log('✅ Papers refreshed on startup');
    } catch (error) {
      console.error('❌ Failed to refresh papers on startup:', error.message);
    }
    
    try {
      console.log('🧠 Generating daily technology reads on startup...');
      const result = await generateTechnologyReads({ force: true, reason: 'startup' });
      console.log(`✅ Startup technology reads ready (${result.reads.length} reads cached)`);
    } catch (error) {
      console.error('❌ Failed to generate technology reads on startup:', error.message);
    }
    
    try {
      console.log('📺 Checking channels for new videos on startup...');
      const enabledChannels = channelsConfig.channels.filter(c => c.enabled);
      if (enabledChannels.length > 0) {
        await checkAllChannelsForNewVideos();
        console.log('✅ Startup video fetch complete');
      } else {
        console.log('⚠️ No enabled channels found. Skipping video fetch.');
      }
    } catch (error) {
      console.error('❌ Error fetching videos in background:', error.message);
      console.error(error.stack);
    }
    console.log('🔥 Startup warm-up tasks finished');
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
            console.log(`🎥 Serving ${podcastsCache.length} videos/podcasts`);
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

