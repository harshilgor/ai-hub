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

