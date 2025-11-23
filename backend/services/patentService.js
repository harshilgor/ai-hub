import axios from 'axios';

/**
 * Patent Service - Fetches patent data from public APIs
 */

// Rate limiter for patent APIs
class PatentRateLimiter {
  constructor(requestsPerSecond = 1) {
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequestTime = 0;
  }

  async waitForNextSlot() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  async execute(requestFn) {
    await this.waitForNextSlot();
    return await requestFn();
  }
}

const rateLimiter = new PatentRateLimiter(1);

/**
 * Extract technologies from patent title/abstract
 */
function extractTechnologies(title, abstract) {
  const text = `${title} ${abstract}`.toLowerCase();
  const technologies = [];
  
  const techKeywords = {
    'AI': ['artificial intelligence', 'ai', 'machine learning', 'neural network'],
    'LLM': ['language model', 'llm', 'transformer', 'natural language'],
    'Computer Vision': ['image processing', 'computer vision', 'visual recognition'],
    'Robotics': ['robot', 'robotic', 'automation'],
    'Quantum': ['quantum', 'qubit'],
    'Blockchain': ['blockchain', 'distributed ledger'],
    'IoT': ['internet of things', 'iot'],
    'Edge Computing': ['edge computing', 'edge device'],
    'Biotech': ['biotechnology', 'gene', 'dna', 'protein'],
    'Clean Energy': ['solar', 'wind', 'battery', 'renewable'],
  };
  
  Object.entries(techKeywords).forEach(([tech, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      technologies.push(tech);
    }
  });
  
  return [...new Set(technologies)];
}

/**
 * Extract industries from patent
 */
function extractIndustries(title, abstract) {
  const text = `${title} ${abstract}`.toLowerCase();
  const industries = [];
  
  const industryKeywords = {
    'Healthcare': ['medical', 'health', 'pharmaceutical', 'diagnostic'],
    'Finance': ['financial', 'payment', 'transaction', 'banking'],
    'Transportation': ['vehicle', 'transportation', 'automotive'],
    'Energy': ['energy', 'power', 'electric', 'battery'],
    'Manufacturing': ['manufacturing', 'production', 'industrial'],
    'Telecommunications': ['communication', 'wireless', 'network'],
  };
  
  Object.entries(industryKeywords).forEach(([industry, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      industries.push(industry);
    }
  });
  
  return [...new Set(industries)];
}

/**
 * Fetch patents from PatentsView API (free, no API key required)
 */
export async function fetchPatentsFromPatentsView(limit = 50, dateThreshold = null) {
  try {
    const allPatents = [];
    
    // Technology-related CPC codes (patent classifications)
    const cpcCodes = [
      'G06N', // Computing arrangements based on specific computational models (AI/ML)
      'G06F', // Electric digital data processing
      'G05B', // Control systems
      'H04L', // Transmission of digital information
    ];
    
    // Build date filter
    let dateFilter = '';
    if (dateThreshold) {
      const year = new Date(dateThreshold).getFullYear();
      dateFilter = `&patent_date=${year}-01-01:${new Date().getFullYear()}-12-31`;
    } else {
      // Default: last 2 years
      const currentYear = new Date().getFullYear();
      dateFilter = `&patent_date=${currentYear - 1}-01-01:${currentYear}-12-31`;
    }
    
    for (const cpcCode of cpcCodes.slice(0, 2)) { // Limit to 2 codes to avoid too many requests
      try {
        const response = await rateLimiter.execute(async () => {
          return await axios.get('https://api.patentsview.org/patents/query', {
            params: {
              q: JSON.stringify({
                _and: [
                  { cpc_subsection_id: cpcCode },
                  { _gte: { patent_date: dateThreshold ? new Date(dateThreshold).toISOString().split('T')[0] : `${new Date().getFullYear() - 1}-01-01` } }
                ]
              }),
              f: JSON.stringify([
                'patent_number',
                'patent_title',
                'patent_abstract',
                'patent_date',
                'assignee_organization',
                'cpc_subsection_id'
              ]),
              o: JSON.stringify({
                per_page: Math.min(limit, 25),
                page: 1
              })
            }
          });
        });
        
        if (response.data && response.data.patents) {
          response.data.patents.forEach(patent => {
            const title = patent.patent_title || 'Untitled Patent';
            const abstract = patent.patent_abstract || '';
            const patentDate = patent.patent_date || new Date().toISOString();
            const assignee = patent.assignee_organization?.[0] || 'Unknown';
            
            // Filter by date threshold
            if (dateThreshold && new Date(patentDate) < dateThreshold) {
              return;
            }
            
            const technologies = extractTechnologies(title, abstract);
            const industries = extractIndustries(title, abstract);
            
            allPatents.push({
              id: `patent_${patent.patent_number}`,
              type: 'patent',
              title: title,
              content: abstract,
              published: patentDate,
              source: 'PatentsView',
              sourceId: 'patentsview',
              link: `https://patentsview.org/patent/${patent.patent_number}`,
              technologies: technologies,
              industries: industries,
              sentiment: 0.3, // Patents are generally neutral/positive
              confidence: technologies.length > 0 ? 0.8 : 0.5,
              metadata: {
                patentNumber: patent.patent_number,
                assignee: assignee,
                cpcCode: cpcCode
              }
            });
          });
        }
        
        // Delay between CPC codes
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error fetching patents for CPC ${cpcCode}:`, error.message);
        continue;
      }
    }
    
    // Remove duplicates
    const uniquePatents = [];
    const seenNumbers = new Set();
    
    allPatents.forEach(patent => {
      const patentNum = patent.metadata?.patentNumber;
      if (patentNum && !seenNumbers.has(patentNum)) {
        seenNumbers.add(patentNum);
        uniquePatents.push(patent);
      }
    });
    
    // Sort by date
    uniquePatents.sort((a, b) => new Date(b.published) - new Date(a.published));
    
    console.log(`✅ Fetched ${uniquePatents.slice(0, limit).length} patents from PatentsView`);
    return uniquePatents.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Error fetching patents from PatentsView:', error.message);
    return [];
  }
}

/**
 * Fetch latest patents
 */
export async function fetchLatestPatents(limit = 50, dateThreshold = null) {
  try {
    const patents = await fetchPatentsFromPatentsView(limit, dateThreshold);
    return patents;
  } catch (error) {
    console.error('❌ Error fetching latest patents:', error.message);
    return [];
  }
}

