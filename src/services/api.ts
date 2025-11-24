const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Paper {
  id: string;
  arxivId: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  updated?: string;
  link: string;
  pdfLink: string | null;
  categories: string[];
  tags: string[];
  venue: string;
  citations: number;
  influentialCitations?: number;
  semanticScholarId?: string;
  year?: number;
  date?: string;
  relatedStartups: string[];
  source?: string;
  sourceId?: string;
}

export interface PapersResponse {
  papers: Paper[];
  total: number;
  sources?: {
    arxiv: number;
    'semantic-scholar': number;
    total: number;
  };
  lastUpdate: string;
  hasMore: boolean;
}

export interface StatsResponse {
  industryStats: Record<string, number>;
  totalPapers: number;
  period?: string;
  lastUpdate: string;
}

export interface TrendsResponse {
  trends: Array<{
    month: string;
    NLP: number;
    'Computer Vision': number;
    LLMs: number;
    Agents: number;
    Robotics: number;
    'Healthcare AI': number;
  }>;
  period: string;
  fields: string[];
  totalPapers: number;
  lastUpdate: string;
}

/**
 * Fetch papers with optional filters
 */
export async function fetchPapers(options: {
  category?: string;
  venue?: string;
  search?: string;
  source?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<PapersResponse> {
  const params = new URLSearchParams();
  
  if (options.category) params.append('category', options.category);
  if (options.venue) params.append('venue', options.venue);
  if (options.search) params.append('search', options.search);
  if (options.source) params.append('source', options.source);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  // Add cache-busting timestamp to prevent stale data
  params.append('_t', Date.now().toString());
  
  const response = await fetch(`${API_BASE_URL}/papers?${params}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch papers: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch paper statistics by industry
 * @param period - Time period: 'all', 'month', 'quarter', 'year'
 */
export async function fetchPaperStats(period: string = 'all'): Promise<StatsResponse> {
  const params = new URLSearchParams();
  if (period) params.append('period', period);
  
  const response = await fetch(`${API_BASE_URL}/papers/stats?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch monthly trend data by field
 * @param period - Time period: '3m', '6m', '12m', 'all'
 * @param fields - Comma-separated field names or 'all'
 */
export async function fetchPaperTrends(period: string = '12m', fields: string = 'all'): Promise<TrendsResponse> {
  const params = new URLSearchParams();
  if (period) params.append('period', period);
  if (fields) params.append('fields', fields);
  
  const response = await fetch(`${API_BASE_URL}/papers/trends?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch trends: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a specific paper by ID
 */
export async function fetchPaper(id: string): Promise<Paper> {
  const response = await fetch(`${API_BASE_URL}/papers/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch paper: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Trigger manual refresh of papers
 */
export async function refreshPapers(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/papers/refresh`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to refresh papers: ${response.statusText}`);
  }
}

/**
 * Get autocomplete suggestions for paper search
 */
export async function getPaperAutocomplete(query: string): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/papers/autocomplete?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get autocomplete: ${response.statusText}`);
  }

  const data = await response.json();
  return data.suggestions || [];
}

/**
 * Fetch multiple papers by IDs using batch API
 */
export async function fetchPapersBatch(ids: string[]): Promise<Paper[]> {
  const response = await fetch(`${API_BASE_URL}/papers/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch papers batch: ${response.statusText}`);
  }

  const data = await response.json();
  return data.papers || [];
}

/**
 * Get total paper count in database (unfiltered)
 */
export async function getTotalPaperCount(): Promise<{
  total: number;
  lastUpdate: string;
  oldestPaperDate?: string;
  newestPaperDate?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/papers/total`);
  
  if (!response.ok) {
    throw new Error(`Failed to get total count: ${response.statusText}`);
  }

  return response.json();
}

// Insights API Types
export interface TechnologyInsight {
  technology: string;
  momentum: number;
  velocity: number;
  confidence: number;
  signalCount: number;
  signalStrength: number;
  sourceBreakdown: {
    papers: number;
    patents: number;
    news: number;
    podcasts: number;
    github: number;
  };
}

export interface IndustryInsight {
  industry: string;
  growthRate: number;
  growthScore: number;
  confidence: number;
  signalCount: number;
  monthlyTrend: Record<string, number>;
}

export interface EmergingTechnology {
  technology: string;
  emergingScore: number;
  velocity: number;
  signalCount: number;
  totalSignals: number;
  leaderMentions: number;
  confidence: number;
}

export interface TechnologyPrediction {
  technology: string;
  predictionScore: number;
  momentum: number;
  confidence: number;
  isEarlyStage: boolean;
  leaderMentions?: number;
  patentCount?: number;
  signalCount: number;
  whyItWillBeBig?: {
    summary: string;
    keyAspects?: string[]; // What specific aspect is becoming big
    companies?: string[]; // Companies/startups working on it
    whatsNext?: string[]; // What's going to happen next
    evidence: {
      research: {
        count: number;
        trend: string;
        keyExamples: Array<{
          title: string;
          venue?: string;
          citations?: number;
          date?: string;
        }>;
      };
      commercial: {
        count: number;
        trend: string;
        keyExamples: Array<{
          title: string;
          source?: string;
          date?: string;
        }>;
      };
      patents: {
        count: number;
        trend: string;
        keyExamples: Array<{
          title: string;
          assignee?: string;
          date?: string;
        }>;
      };
      developer: {
        count: number;
        trend: string;
        keyExamples: Array<{
          name: string;
          stars?: number;
          date?: string;
        }>;
      };
    };
    connections: Array<{
      type: string;
      description: string;
      sources: Array<{
        type: string;
        id: string;
        title: string;
      }>;
      strength: number;
    }>;
    timeline: Array<{
      date: string;
      event: string;
      type: string;
      source: string;
    }>;
    risks: string[];
    confidenceFactors: string[];
  };
}

export interface LeaderQuote {
  text: string;
  technologies: string[];
  source: string;
  published: string;
  confidence: number;
}

// Insights API Functions
export async function getTechnologyInsights(timeWindow: number = 30): Promise<{
  technologies: TechnologyInsight[];
  timeWindow: number;
  lastUpdate: string;
}> {
  const response = await fetch(`${API_BASE_URL}/insights/technologies?timeWindow=${timeWindow}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get technology insights: ${response.statusText}`);
  }

  return response.json();
}

export async function getIndustryInsights(timeWindow: number = 90): Promise<{
  industries: IndustryInsight[];
  timeWindow: number;
  lastUpdate: string;
}> {
  const response = await fetch(`${API_BASE_URL}/insights/industries?timeWindow=${timeWindow}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get industry insights: ${response.statusText}`);
  }

  return response.json();
}

export async function getEmergingTechnologies(timeWindow: number = 30): Promise<{
  emerging: EmergingTechnology[];
  timeWindow: number;
  lastUpdate: string;
}> {
  const response = await fetch(`${API_BASE_URL}/insights/emerging?timeWindow=${timeWindow}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get emerging technologies: ${response.statusText}`);
  }

  return response.json();
}

export async function getTechnologyPredictions(): Promise<{
  predictions: TechnologyPrediction[];
  lastUpdate: string;
}> {
  const response = await fetch(`${API_BASE_URL}/insights/predictions`);
  
  if (!response.ok) {
    throw new Error(`Failed to get predictions: ${response.statusText}`);
  }

  return response.json();
}

export async function getLeaderQuotes(): Promise<{
  quotes: LeaderQuote[];
  lastUpdate: string;
}> {
  const response = await fetch(`${API_BASE_URL}/insights/leader-quotes`);
  
  if (!response.ok) {
    throw new Error(`Failed to get leader quotes: ${response.statusText}`);
  }

  return response.json();
}

// Technology Reads Types
export interface TechnologyRead {
  technology: string;
  title: string;
  summary: string;
  fullRead: Array<{
    heading: string;
    content: string;
  }>;
  keyInsights: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
  }>;
  whatToBuild: Array<{
    type: string;
    title: string;
    description: string;
    opportunity: string;
    action: string;
  }>;
  companies: string[];
  topPapers: Array<{
    title: string;
    authors: string[];
    venue?: string;
    citations: number;
    published: string;
    link: string;
  }>;
  metrics: {
    totalPapers: number;
    recentPapers: number;
    growthRate: number;
    avgCitations: number;
    momentum: number;
    confidence: number;
    signalCount: number;
  };
  trends: {
    research: { direction: string; rate: number; description: string };
    commercial: { direction: string; rate: number; description: string };
    developer: { direction: string; rate: number; description: string };
  };
  categories: string[];
  venues: string[];
  predictionScore: number;
  generatedBy?: string;
  model?: string;
}

export async function getTechnologyReads(): Promise<{
  reads: TechnologyRead[];
  totalTechnologies: number;
  lastUpdate: string;
}> {
  const response = await fetch(`${API_BASE_URL}/insights/technology-reads`);
  
  if (!response.ok) {
    throw new Error(`Failed to get technology reads: ${response.statusText}`);
  }

  return response.json();
}

export async function getCombinedSignal(technology: string): Promise<{
  technology: string;
  signalStrength: {
    totalStrength: number;
    sourceBreakdown: Record<string, number>;
    signalCount: number;
  };
  lastUpdate: string;
}> {
  const response = await fetch(`${API_BASE_URL}/insights/combined-signal?technology=${encodeURIComponent(technology)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get combined signal: ${response.statusText}`);
  }

  return response.json();
}

export interface VideoInsight {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  link: string;
  duration: number;
  viewCount: number;
  insights: {
    technologies: string[];
    companies: string[];
    keyQuotes: Array<{
      text: string;
      speaker: string;
      technology: string;
      stance: string;
      confidence: number;
      timestamp: string;
    }>;
    stanceDistribution: {
      pro: number;
      con: number;
      neutral: number;
      mixed: number;
    };
    summary: string;
  } | null;
  processed: boolean;
}

export interface ChannelVideosResponse {
  channel: {
    id: string;
    name: string;
    channelId: string;
  };
  videos: VideoInsight[];
  total: number;
}

export async function getChannelVideos(channelId: string, limit: number = 10): Promise<ChannelVideosResponse> {
  const response = await fetch(`${API_BASE_URL}/channels/${channelId}/videos?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get channel videos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check API health
 */
export async function checkAPIHealth(): Promise<{
  status: string;
  papersCount: number;
  lastUpdate: string;
  uptime: number;
}> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error(`API health check failed: ${response.statusText}`);
  }

  return response.json();
}

