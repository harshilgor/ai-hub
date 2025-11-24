import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

// AI-related arXiv categories (kept for backward compatibility and specific searches)
const AI_CATEGORIES = [
  'cs.AI',  // Artificial Intelligence
  'cs.LG',  // Machine Learning
  'cs.CV',  // Computer Vision
  'cs.CL',  // Computation and Language (NLP)
  'cs.NE',  // Neural and Evolutionary Computing
  'cs.RO',  // Robotics
  'stat.ML' // Machine Learning (Statistics)
];

// Major arXiv categories from all domains for comprehensive coverage
// This list includes key categories from each major subject class
const ALL_ARXIV_CATEGORIES = [
  // Computer Science (major categories)
  'cs.AI', 'cs.LG', 'cs.CV', 'cs.CL', 'cs.NE', 'cs.RO', 'cs.CR', 'cs.DS', 'cs.DB',
  'cs.SE', 'cs.PL', 'cs.AR', 'cs.OS', 'cs.NI', 'cs.DC', 'cs.SY', 'cs.IT', 'cs.CC',
  'cs.CG', 'cs.GT', 'cs.LO', 'cs.MA', 'cs.MM', 'cs.NA', 'cs.SI',
  // Mathematics (major categories)
  'math.AC', 'math.AG', 'math.AT', 'math.AP', 'math.CA', 'math.CO', 'math.CV',
  'math.DG', 'math.DS', 'math.FA', 'math.GN', 'math.GT', 'math.GR', 'math.IT',
  'math.LO', 'math.MP', 'math.MG', 'math.NT', 'math.OC', 'math.PR', 'math.RA',
  'math.RT', 'math.SP', 'math.ST', 'math.SG',
  // Physics (major categories)
  'physics.acc-ph', 'physics.ao-ph', 'physics.atom-ph', 'physics.bio-ph',
  'physics.chem-ph', 'physics.class-ph', 'physics.comp-ph', 'physics.flu-dyn',
  'physics.gen-ph', 'physics.geo-ph', 'physics.optics', 'physics.plasm-ph',
  'physics.space-ph',
  // Quantitative Biology
  'q-bio.BM', 'q-bio.CB', 'q-bio.GN', 'q-bio.MN', 'q-bio.NC', 'q-bio.PE', 'q-bio.QM',
  // Quantitative Finance
  'q-fin.CP', 'q-fin.EC', 'q-fin.GN', 'q-fin.MF', 'q-fin.PM', 'q-fin.PR', 'q-fin.RM', 'q-fin.ST', 'q-fin.TR',
  // Statistics
  'stat.AP', 'stat.CO', 'stat.ME', 'stat.ML', 'stat.TH',
  // Economics
  'econ.EM', 'econ.GN', 'econ.TH',
  // Electrical Engineering
  'eess.AS', 'eess.IV', 'eess.SP', 'eess.SY'
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
 * Fetch recent papers from arXiv (ALL domains, not just AI)
 * @param {number} maxResults - Maximum number of papers to fetch
 * @param {number} daysBack - How many days back to search
 */
export async function fetchArXivPapers(maxResults = 300, daysBack = 7) {
  try {
    // Fetch papers from all major domains (not just AI)
    // Query all major arXiv categories across all subject classes
    // Use a larger limit to get more papers (arXiv allows up to 2000)
    const fetchLimit = Math.min(maxResults * 2, 1000);
    const searchQuery = ALL_ARXIV_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ');
    
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

    const papers = result.feed.entry.map(parseArXivEntry).slice(0, maxResults);

    console.log(`✅ Fetched ${papers.length} papers from arXiv (all domains)`);
    return papers;

  } catch (error) {
    console.error('❌ Error fetching from arXiv:', error.message);
    return [];
  }
}

/**
 * Fetch latest papers from arXiv (ALL domains, last N hours or after date threshold)
 * @param {number} maxResults - Maximum number of papers to fetch
 * @param {number|Date} hoursBackOrDate - How many hours back to search, or a Date threshold
 */
export async function fetchArXivLatest(maxResults = 100, hoursBackOrDate = 24) {
  try {
    // Calculate cutoff time
    let cutoffTime;
    if (hoursBackOrDate instanceof Date) {
      cutoffTime = hoursBackOrDate;
    } else {
      const now = new Date();
      cutoffTime = new Date(now.getTime() - hoursBackOrDate * 60 * 60 * 1000);
    }
    
    // Fetch more than needed to account for filtering (arXiv has many papers daily)
    // arXiv API allows up to 2000 results per query, but we'll use 1000 for safety
    const fetchLimit = Math.min(maxResults * 5, 1000); // Increased limit to get more papers
    
    // Query all major arXiv categories from all domains
    const searchQuery = ALL_ARXIV_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ');
    
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
    
    console.log(`✅ Fetched ${papers.length} latest papers from arXiv (all domains, last ${hoursBack} hours)`);
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
      // Default to all major categories from all domains if no specific query or category
      searchQuery = ALL_ARXIV_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ');
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
      // Default to all major categories from all domains if no search criteria provided
      searchQuery = ALL_ARXIV_CATEGORIES.map(cat => `cat:${cat}`).join(' OR ');
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
 * Now supports all major arXiv subject classes
 */
function categoriesToTags(categories) {
  const tagMap = {
    // Computer Science
    'cs.AI': 'Artificial Intelligence',
    'cs.LG': 'Machine Learning',
    'cs.CV': 'Computer Vision',
    'cs.CL': 'NLP',
    'cs.NE': 'Neural Networks',
    'cs.RO': 'Robotics',
    'cs.CR': 'Security',
    'cs.HC': 'Human-Computer Interaction',
    'cs.CY': 'Computers and Society',
    'cs.DS': 'Data Structures',
    'cs.DB': 'Databases',
    'cs.SE': 'Software Engineering',
    'cs.PL': 'Programming Languages',
    'cs.AR': 'Hardware Architecture',
    'cs.OS': 'Operating Systems',
    'cs.NI': 'Networking',
    'cs.DC': 'Distributed Computing',
    'cs.SY': 'Systems and Control',
    'cs.IT': 'Information Theory',
    'cs.CC': 'Computational Complexity',
    'cs.CG': 'Computational Geometry',
    'cs.GT': 'Game Theory',
    'cs.LO': 'Logic in Computer Science',
    'cs.MA': 'Multiagent Systems',
    'cs.MM': 'Multimedia',
    'cs.MS': 'Mathematical Software',
    'cs.NA': 'Numerical Analysis',
    'cs.SC': 'Symbolic Computation',
    'cs.SD': 'Sound',
    'cs.SI': 'Social and Information Networks',
    // Mathematics
    'math.AC': 'Commutative Algebra',
    'math.AG': 'Algebraic Geometry',
    'math.AT': 'Algebraic Topology',
    'math.AP': 'Analysis of PDEs',
    'math.CT': 'Category Theory',
    'math.CA': 'Classical Analysis',
    'math.CO': 'Combinatorics',
    'math.AC': 'Commutative Algebra',
    'math.CV': 'Complex Variables',
    'math.DG': 'Differential Geometry',
    'math.DS': 'Dynamical Systems',
    'math.FA': 'Functional Analysis',
    'math.GM': 'General Mathematics',
    'math.GN': 'General Topology',
    'math.GT': 'Geometric Topology',
    'math.GR': 'Group Theory',
    'math.HO': 'History and Overview',
    'math.IT': 'Information Theory',
    'math.KT': 'K-Theory and Homology',
    'math.LO': 'Logic',
    'math.MP': 'Mathematical Physics',
    'math.MG': 'Metric Geometry',
    'math.NT': 'Number Theory',
    'math.OA': 'Operator Algebras',
    'math.OC': 'Optimization and Control',
    'math.PR': 'Probability',
    'math.QA': 'Quantum Algebra',
    'math.RT': 'Representation Theory',
    'math.RA': 'Rings and Algebras',
    'math.SP': 'Spectral Theory',
    'math.ST': 'Statistics Theory',
    'math.SG': 'Symplectic Geometry',
    // Physics
    'physics.acc-ph': 'Accelerator Physics',
    'physics.ao-ph': 'Atmospheric and Oceanic Physics',
    'physics.atom-ph': 'Atomic Physics',
    'physics.atm-clus': 'Atomic and Molecular Clusters',
    'physics.bio-ph': 'Biological Physics',
    'physics.chem-ph': 'Chemical Physics',
    'physics.class-ph': 'Classical Physics',
    'physics.comp-ph': 'Computational Physics',
    'physics.data-an': 'Data Analysis',
    'physics.flu-dyn': 'Fluid Dynamics',
    'physics.gen-ph': 'General Physics',
    'physics.geo-ph': 'Geophysics',
    'physics.hist-ph': 'History and Philosophy of Physics',
    'physics.ins-det': 'Instrumentation and Detectors',
    'physics.med-ph': 'Medical Physics',
    'physics.optics': 'Optics',
    'physics.ed-ph': 'Physics Education',
    'physics.soc-ph': 'Physics and Society',
    'physics.plasm-ph': 'Plasma Physics',
    'physics.pop-ph': 'Popular Physics',
    'physics.space-ph': 'Space Physics',
    // Quantitative Biology
    'q-bio.BM': 'Biomolecules',
    'q-bio.CB': 'Cell Behavior',
    'q-bio.GN': 'Genomics',
    'q-bio.MN': 'Molecular Networks',
    'q-bio.NC': 'Neurons and Cognition',
    'q-bio.OT': 'Other',
    'q-bio.PE': 'Populations and Evolution',
    'q-bio.QM': 'Quantitative Methods',
    'q-bio.SC': 'Subcellular Processes',
    'q-bio.TO': 'Tissues and Organs',
    // Quantitative Finance
    'q-fin.CP': 'Computational Finance',
    'q-fin.EC': 'Economics',
    'q-fin.GN': 'General Finance',
    'q-fin.MF': 'Mathematical Finance',
    'q-fin.PM': 'Portfolio Management',
    'q-fin.PR': 'Pricing of Securities',
    'q-fin.RM': 'Risk Management',
    'q-fin.ST': 'Statistical Finance',
    'q-fin.TR': 'Trading and Market Microstructure',
    // Statistics
    'stat.AP': 'Applications',
    'stat.CO': 'Computation',
    'stat.ME': 'Methodology',
    'stat.ML': 'Machine Learning',
    'stat.OT': 'Other',
    'stat.TH': 'Theory',
    // Economics
    'econ.EM': 'Econometrics',
    'econ.GN': 'General Economics',
    'econ.TH': 'Theoretical Economics',
    // Electrical Engineering
    'eess.AS': 'Audio and Speech Processing',
    'eess.IV': 'Image and Video Processing',
    'eess.SP': 'Signal Processing',
    'eess.SY': 'Systems and Control'
  };

  const tags = new Set();
  
  // Map of subject class prefixes to general domain tags
  const subjectDomainMap = {
    'cs': 'Computer Science',
    'math': 'Mathematics',
    'physics': 'Physics',
    'q-bio': 'Biology',
    'q-fin': 'Finance',
    'stat': 'Statistics',
    'econ': 'Economics',
    'eess': 'Electrical Engineering'
  };
  
  categories.forEach(cat => {
    // Handle both full category (e.g., 'cs.AI') and subject class (e.g., 'cs')
    const parts = cat.split('.');
    const subjectClass = parts[0];
    
    // First, add the general domain tag (e.g., "Mathematics" for all math.* categories)
    if (subjectDomainMap[subjectClass]) {
      tags.add(subjectDomainMap[subjectClass]);
    }
    
    // Then add specific category tags
    if (parts.length >= 2) {
      const mainCat = parts[0] + '.' + parts[1];
      if (tagMap[mainCat]) {
        tags.add(tagMap[mainCat]);
      }
    } else {
      // Single part category (e.g., just 'cs')
      if (subjectDomainMap[cat]) {
        tags.add(subjectDomainMap[cat]);
      }
    }
  });

  return Array.from(tags);
}

/**
 * Categorize papers by industry/domain - expanded to include all research domains
 */
export function categorizePapersByIndustry(papers) {
  const industryKeywords = {
    // AI & ML Industries
    'Healthcare AI': ['medical', 'health', 'diagnosis', 'clinical', 'patient', 'disease', 'drug', 'biomedical'],
    'Finance': ['financial', 'trading', 'market', 'portfolio', 'risk', 'fraud', 'banking', 'investment'],
    'Robotics': ['robot', 'autonomous', 'manipulation', 'navigation', 'control', 'robotic'],
    'NLP': ['language', 'text', 'translation', 'nlp', 'bert', 'gpt', 'transformer', 'natural language'],
    'Computer Vision': ['image', 'visual', 'detection', 'segmentation', 'recognition', 'video', 'vision'],
    'Agents': ['agent', 'reinforcement', 'planning', 'reasoning', 'decision', 'multi-agent'],
    'LLMs': ['language model', 'llm', 'gpt', 'bert', 'transformer', 'pretraining', 'large language'],
    // Mathematics
    'Mathematics': ['mathematics', 'math', 'algebra', 'geometry', 'topology', 'analysis', 'number theory', 'combinatorics', 'differential', 'calculus'],
    'Statistics': ['statistics', 'statistical', 'probability', 'stochastic', 'inference', 'estimation'],
    // Physics
    'Physics': ['physics', 'quantum', 'optics', 'plasma', 'condensed matter', 'high energy', 'particle', 'electromagnetic'],
    // Economics & Finance
    'Economics': ['economics', 'econometric', 'economic', 'macroeconomic', 'microeconomic', 'economy'],
    'Quantitative Finance': ['quantitative finance', 'mathematical finance', 'derivatives', 'option pricing', 'risk management'],
    // Biology & Life Sciences
    'Biology': ['biology', 'genomic', 'genome', 'dna', 'rna', 'protein', 'molecular biology', 'cellular'],
    'Neuroscience': ['neuroscience', 'neural', 'brain', 'cognitive', 'neuron', 'synapse'],
    // Computer Science (non-AI)
    'Computer Science': ['algorithm', 'data structure', 'complexity', 'computing', 'system', 'network', 'protocol'],
    'Security': ['security', 'cryptography', 'encryption', 'cybersecurity', 'privacy', 'authentication'],
    // Engineering
    'Electrical Engineering': ['electrical engineering', 'signal processing', 'control system', 'circuit', 'electronic'],
    // Other
    'Other': [] // Papers that don't match any category
  };

  const categories = {};

  papers.forEach(paper => {
    const text = ((paper.title || '') + ' ' + (paper.summary || '')).toLowerCase();
    const paperTags = (paper.tags || []).map(t => t.toLowerCase());
    const allText = text + ' ' + paperTags.join(' ');
    
    let matched = false;
    
    Object.entries(industryKeywords).forEach(([industry, keywords]) => {
      if (industry === 'Other') return; // Skip 'Other' category
      
      // Check if paper matches this industry
      const matches = keywords.some(keyword => allText.includes(keyword.toLowerCase()));
      
      if (matches) {
        if (!categories[industry]) {
          categories[industry] = 0;
        }
        categories[industry]++;
        matched = true;
        
        // Add industry tag if not already present
        if (paper.tags && !paper.tags.includes(industry)) {
          paper.tags.push(industry);
        }
      }
    });
    
    // If no match, count as 'Other' (optional - you can remove this if you don't want an 'Other' category)
    // if (!matched && industryKeywords['Other']) {
    //   if (!categories['Other']) {
    //     categories['Other'] = 0;
    //   }
    //   categories['Other']++;
    // }
  });

  return categories;
}

