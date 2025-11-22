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
 * Fetch recent papers from arXiv
 * @param {number} maxResults - Maximum number of papers to fetch
 * @param {number} daysBack - How many days back to search
 */
export async function fetchArXivPapers(maxResults = 100, daysBack = 7) {
  try {
    const today = new Date();
    const pastDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
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

    const papers = result.feed.entry.map(entry => {
      const categories = Array.isArray(entry.category) 
        ? entry.category.map(cat => cat.$.term)
        : [entry.category.$.term];

      // Map arXiv categories to friendly names
      const tags = categoriesToTags(categories);

      return {
        id: entry.id[0].split('/abs/')[1],
        arxivId: entry.id[0].split('/abs/')[1],
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
        relatedStartups: [] // Will be populated by matching logic
      };
    });

    console.log(`✅ Fetched ${papers.length} papers from arXiv`);
    return papers;

  } catch (error) {
    console.error('❌ Error fetching from arXiv:', error.message);
    return [];
  }
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

