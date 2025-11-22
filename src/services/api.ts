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
}

export interface PapersResponse {
  papers: Paper[];
  total: number;
  lastUpdate: string;
  hasMore: boolean;
}

export interface StatsResponse {
  industryStats: Record<string, number>;
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
  limit?: number;
  offset?: number;
} = {}): Promise<PapersResponse> {
  const params = new URLSearchParams();
  
  if (options.category) params.append('category', options.category);
  if (options.venue) params.append('venue', options.venue);
  if (options.search) params.append('search', options.search);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  const response = await fetch(`${API_BASE_URL}/papers?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch papers: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch paper statistics by industry
 */
export async function fetchPaperStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE_URL}/papers/stats`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
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

