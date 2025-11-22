import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

// AI-related arXiv categories
const AI_CATEGORIES = [
  'cs.AI',  // Artificial Intelligence
  'cs.LG',  // Machine Learning
  'cs.CV',  // Computer Vision
  'cs.CL',  // Computation and Language (NLP)
  'cs.NE',  // Neural and Evolutionary Computing
  'cs.RO',  // Robotics
  'stat.ML' // Machine Learning (Statistics)
];

/**
 * Parse arXiv XML entry to paper object
 */
function parseArXivEntry(entry) {
  const categories = Array.isArray(entry.category) 
    ? entry.category.map(cat => cat.$.term)
    : [entry.category.$.term];

  const tags = categoriesToTags(categories);
  const arxivId = entry.id[0].split('/abs/')[1];

  return {
    id: arxivId,
    arxivId: arxivId,
    title: entry.title[0].replace(/\n/g, ' ').trim(),
    authors: entry.author.map(a => a.name[0]),
    summary: entry.summary[0].replace(/\n/g, ' ').trim(),
    published: entry.published[0],
    updated: entry.updated[0],
    link: entry.id[0],
    pdfLink: entry.link.find(l => l.$.title === 'pdf')?.$.href || '',
    categories: categories,
    tags: tags,
    venue: 'arXiv',
    citations: 0, // Will be enriched by Semantic Scholar
    relatedStartups: [], // Will be populated by matching logic
    date: new Date(entry.published[0]).getFullYear().toString(),
    year: new Date(entry.published[0]).getFullYear()
  };
}

/**
 * Fetch recent papers from arXiv
 * @param {number} maxResults - Maximum number of papers to fetch
 * @param {number} daysBack - How many days back to search
 */
export async function fetchArXivPapers(maxResults = 100, daysBack = 7) {
  try {
    const searchQuery = AI_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ');
    
    const url = 'http://export.arxiv.org/api/query';
    const params = {
      search_query: searchQuery,
      sortBy: 'submittedDate',
      sortOrder: 'descending',
      max_results: maxResults
    };

    const response = await axios.get(url, { params });
    const result = await parseXML(response.data);

    if (!result.feed || !result.feed.entry) {
      return [];
    }

    const papers = result.feed.entry.map(parseArXivEntry);

    console.log(`✅ Fetched ${papers.length} papers from arXiv`);
    return papers;

  } catch (error) {
    console.error('❌ Error fetching from arXiv:', error.message);
    return [];
  }
}

/**
 * Fetch latest papers from arXiv (last N hours or after date threshold)
 * @param {number} maxResults - Maximum number of papers to fetch
 * @param {number|Date} hoursBackOrDate - How many hours back to search, or a Date threshold
 */
export async function fetchArXivLatest(maxResults = 100, hoursBackOrDate = 24) {
  try {
    const searchQuery = AI_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ');
    
    // Calculate cutoff time
    let cutoffTime;
    if (hoursBackOrDate instanceof Date) {
      cutoffTime = hoursBackOrDate;
    } else {
      const now = new Date();
      cutoffTime = new Date(now.getTime() - hoursBackOrDate * 60 * 60 * 1000);
    }
    
    // Fetch more than needed to account for filtering
    const fetchLimit = Math.min(maxResults * 2, 200);
    
    const url = 'http://export.arxiv.org/api/query';
    const params = {
      search_query: searchQuery,
      sortBy: 'submittedDate',
      sortOrder: 'descending',
      max_results: fetchLimit
    };

    const response = await axios.get(url, { params });
    const result = await parseXML(response.data);

    if (!result.feed || !result.feed.entry) {
      return [];
    }

    // Filter by date threshold
    const papers = result.feed.entry
      .map(parseArXivEntry)
      .filter(paper => {
        const published = new Date(paper.published);
        return published >= cutoffTime;
      })
      .slice(0, maxResults);

    const hoursBack = hoursBackOrDate instanceof Date 
      ? Math.ceil((Date.now() - cutoffTime.getTime()) / (1000 * 60 * 60))
      : hoursBackOrDate;
    
    console.log(`✅ Fetched ${papers.length} latest papers from arXiv (last ${hoursBack} hours)`);
    return papers;

  } catch (error) {
    console.error('❌ Error fetching latest from arXiv:', error.message);
    return [];
  }
}

/**
 * Advanced arXiv search
 * @param {Object} options - Search options
 */
export async function searchArXiv({
  query = '',
  category = '',
  author = '',
  dateFrom = null,
  dateTo = null,
  sortBy = 'submittedDate',
  sortOrder = 'descending',
  maxResults = 100
} = {}) {
  try {
    let searchQuery = '';
    
    // Build search query
    if (category) {
      searchQuery = `cat:${category}`;
    } else if (!query && !author) {
      // Default to AI categories if no specific query
      searchQuery = AI_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ');
    }
    
    if (author) {
      const authorQuery = `au:${author.replace(/\s+/g, '+')}`;
      searchQuery = searchQuery ? `${searchQuery}+AND+${authorQuery}` : authorQuery;
    }
    
    if (query) {
      const queryStr = query.replace(/\s+/g, '+');
      searchQuery = searchQuery ? `${searchQuery}+AND+all:${queryStr}` : `all:${queryStr}`;
    }
    
    if (!searchQuery) {
      searchQuery = AI_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ');
    }
    
    const url = 'http://export.arxiv.org/api/query';
    const params = {
      search_query: searchQuery,
      sortBy: sortBy,
      sortOrder: sortOrder,
      max_results: maxResults,
      start: 0
    };

    const response = await axios.get(url, { params });
    const result = await parseXML(response.data);

    if (!result.feed || !result.feed.entry) {
      return [];
    }

    let papers = result.feed.entry.map(parseArXivEntry);
    
    // Filter by date range if provided
    if (dateFrom || dateTo) {
      papers = papers.filter(paper => {
        const published = new Date(paper.published);
        if (dateFrom && published < new Date(dateFrom)) return false;
        if (dateTo && published > new Date(dateTo)) return false;
        return true;
      });
    }

    console.log(`✅ Searched arXiv: ${papers.length} papers found`);
    return papers.slice(0, maxResults);

  } catch (error) {
    console.error('❌ Error searching arXiv:', error.message);
    return [];
  }
}

/**
 * Fetch papers by specific category
 */
export async function fetchArXivByCategory(category, maxResults = 100) {
  return searchArXiv({
    category,
    sortBy: 'submittedDate',
    sortOrder: 'descending',
    maxResults
  });
}

/**
 * Fetch papers by keywords
 */
export async function fetchArXivByKeywords(keywords, maxResults = 100) {
  return searchArXiv({
    query: keywords,
    sortBy: 'submittedDate',
    sortOrder: 'descending',
    maxResults
  });
}

/**
 * Convert arXiv categories to user-friendly tags
 */
function categoriesToTags(categories) {
  const tagMap = {
    'cs.AI': 'Artificial Intelligence',
    'cs.LG': 'Machine Learning',
    'cs.CV': 'Computer Vision',
    'cs.CL': 'NLP',
    'cs.NE': 'Neural Networks',
    'cs.RO': 'Robotics',
    'cs.CR': 'Security',
    'cs.HC': 'Human-Computer Interaction',
    'stat.ML': 'Machine Learning',
    'cs.CY': 'Computers and Society'
  };

  const tags = new Set();
  
  categories.forEach(cat => {
    const mainCat = cat.split('.')[0] + '.' + cat.split('.')[1];
    if (tagMap[mainCat]) {
      tags.add(tagMap[mainCat]);
    }
  });

  // Add general tags based on keywords
  return Array.from(tags);
}

/**
 * Categorize papers by industry
 */
export function categorizePapersByIndustry(papers) {
  const industryKeywords = {
    'Healthcare AI': ['medical', 'health', 'diagnosis', 'clinical', 'patient', 'disease', 'drug'],
    'Finance': ['financial', 'trading', 'market', 'portfolio', 'risk', 'fraud'],
    'Robotics': ['robot', 'autonomous', 'manipulation', 'navigation', 'control'],
    'NLP': ['language', 'text', 'translation', 'nlp', 'bert', 'gpt', 'transformer'],
    'Computer Vision': ['image', 'visual', 'detection', 'segmentation', 'recognition', 'video'],
    'Agents': ['agent', 'reinforcement', 'planning', 'reasoning', 'decision'],
    'LLMs': ['language model', 'llm', 'gpt', 'bert', 'transformer', 'pretraining']
  };

  const categories = {};

  papers.forEach(paper => {
    const text = (paper.title + ' ' + paper.summary).toLowerCase();
    
    Object.entries(industryKeywords).forEach(([industry, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        if (!categories[industry]) {
          categories[industry] = 0;
        }
        categories[industry]++;
        
        // Add industry tag if not already present
        if (!paper.tags.includes(industry)) {
          paper.tags.push(industry);
        }
      }
    });
  });

  return categories;
}

