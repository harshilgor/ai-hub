/**
 * Technology Reads Engine - Generates comprehensive "reads" on emerging technologies
 * Analyzes all data sources to create detailed insights and predictions
 */

import { calculateTechnologyMomentum } from './insightEngine.js';
import { generateAITechnologyOverview } from './aiContentService.js';

/**
 * Extract all unique technologies from papers
 */
export function extractTechnologiesFromPapers(papers) {
  const technologies = new Map(); // technology -> { count, papers, categories }
  
  papers.forEach(paper => {
    // Extract from tags
    (paper.tags || []).forEach(tag => {
      if (tag && tag.length > 2 && tag.length < 50) {
        const normalized = normalizeTechnologyName(tag);
        if (!technologies.has(normalized)) {
          technologies.set(normalized, {
            name: normalized,
            count: 0,
            papers: [],
            categories: new Set(),
            venues: new Set(),
            citations: 0,
            recentCount: 0
          });
        }
        const tech = technologies.get(normalized);
        tech.count++;
        tech.papers.push(paper);
        (paper.categories || []).forEach(cat => tech.categories.add(cat));
        if (paper.venue) tech.venues.add(paper.venue);
        tech.citations += paper.citations || 0;
        
        // Check if recent (last 6 months)
        const paperDate = new Date(paper.published || paper.updated || 0);
        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        if (paperDate >= sixMonthsAgo) {
          tech.recentCount++;
        }
      }
    });
    
    // Extract from categories
    (paper.categories || []).forEach(category => {
      if (category && category.length > 2 && category.length < 50) {
        const normalized = normalizeTechnologyName(category);
        if (!technologies.has(normalized)) {
          technologies.set(normalized, {
            name: normalized,
            count: 0,
            papers: [],
            categories: new Set(),
            venues: new Set(),
            citations: 0,
            recentCount: 0
          });
        }
        const tech = technologies.get(normalized);
        tech.count++;
        tech.papers.push(paper);
        tech.categories.add(category);
        if (paper.venue) tech.venues.add(paper.venue);
        tech.citations += paper.citations || 0;
        
        const paperDate = new Date(paper.published || paper.updated || 0);
        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        if (paperDate >= sixMonthsAgo) {
          tech.recentCount++;
        }
      }
    });
    
    // Extract from title (look for common tech keywords)
    const title = (paper.title || '').toLowerCase();
    const techKeywords = {
      'Autonomous AI Agents': ['autonomous agent', 'ai agent', 'agentic', 'multi-agent'],
      'Large Language Models': ['llm', 'large language model', 'language model', 'transformer'],
      'Computer Vision': ['computer vision', 'cv', 'image recognition', 'object detection', 'visual'],
      'Reinforcement Learning': ['reinforcement learning', 'rl', 'q-learning', 'policy gradient'],
      'Multimodal AI': ['multimodal', 'vision-language', 'text-image', 'cross-modal'],
      'Robotics': ['robotics', 'robot', 'robotic', 'manipulation', 'navigation'],
      'Generative AI': ['generative', 'gan', 'diffusion', 'generation', 'synthesis'],
      'Neural Architecture Search': ['nas', 'neural architecture', 'architecture search'],
      'Federated Learning': ['federated learning', 'distributed learning', 'privacy-preserving'],
      'Quantum Machine Learning': ['quantum', 'qml', 'quantum computing', 'quantum ml']
    };
    
    Object.entries(techKeywords).forEach(([techName, keywords]) => {
      if (keywords.some(keyword => title.includes(keyword))) {
        const normalized = normalizeTechnologyName(techName);
        if (!technologies.has(normalized)) {
          technologies.set(normalized, {
            name: normalized,
            count: 0,
            papers: [],
            categories: new Set(),
            venues: new Set(),
            citations: 0,
            recentCount: 0
          });
        }
        const tech = technologies.get(normalized);
        if (!tech.papers.find(p => p.id === paper.id)) {
          tech.count++;
          tech.papers.push(paper);
          (paper.categories || []).forEach(cat => tech.categories.add(cat));
          if (paper.venue) tech.venues.add(paper.venue);
          tech.citations += paper.citations || 0;
          
          const paperDate = new Date(paper.published || paper.updated || 0);
          const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
          if (paperDate >= sixMonthsAgo) {
            tech.recentCount++;
          }
        }
      }
    });
  });
  
  // Convert to array and calculate metrics
  return Array.from(technologies.values()).map(tech => ({
    ...tech,
    categories: Array.from(tech.categories),
    venues: Array.from(tech.venues),
    growthRate: tech.count > 0 ? (tech.recentCount / tech.count) * 100 : 0,
    avgCitations: tech.papers.length > 0 ? tech.citations / tech.papers.length : 0
  }));
}

/**
 * Normalize technology name
 */
function normalizeTechnologyName(name) {
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate comprehensive read for a technology
 */
export async function generateTechnologyRead(technology, allSignals, papersCache) {
  const techData = technology; // Already has papers, count, etc.
  const techName = techData.name;
  
  // Get all signals for this technology
  const techSignals = allSignals.filter(s => 
    (s.technologies || []).includes(techName) ||
    (s.title || '').toLowerCase().includes(techName.toLowerCase())
  );
  
  // Combine with papers
  const allTechPapers = techData.papers || [];
  const allTechData = [...techSignals, ...allTechPapers.map(p => ({ ...p, type: 'paper' }))];
  
  // Categorize by source
  const evidence = {
    research: allTechData.filter(s => s.type === 'paper' || !s.type),
    commercial: allTechData.filter(s => s.type === 'news'),
    patents: allTechData.filter(s => s.type === 'patent'),
    developer: allTechData.filter(s => s.type === 'github'),
    jobs: allTechData.filter(s => s.type === 'job')
  };
  
  // Calculate momentum
  const momentum = calculateTechnologyMomentum(techName, allTechData);
  
  // Extract key insights
  const keyInsights = extractKeyInsights(techData, evidence);
  
  // Identify what to build
  const whatToBuild = identifyWhatToBuild(techData, evidence, keyInsights);
  
  // Generate detailed narrative (with AI if available, otherwise template-based)
  const narrative = await generateAITechnologyOverview(techName, techData, evidence, keyInsights, whatToBuild);
  
  // Extract companies/startups
  const companies = extractCompaniesFromSignals(evidence);
  
  // Get top papers
  const topPapers = allTechPapers
    .sort((a, b) => (b.citations || 0) - (a.citations || 0))
    .slice(0, 5);
  
  // Calculate trend indicators
  const trends = calculateTrends(techData, evidence);
  
  return {
    technology: techName,
    title: `Why ${techName} is the Next Big Thing`,
    summary: narrative.summary,
    fullRead: narrative.fullRead || [],
    generatedBy: narrative.generatedBy || 'Template',
    model: narrative.model || 'template-based',
    keyInsights: keyInsights,
    whatToBuild: whatToBuild,
    companies: companies,
    topPapers: topPapers.map(p => ({
      title: p.title,
      authors: p.authors,
      venue: p.venue,
      citations: p.citations,
      published: p.published,
      link: p.link
    })),
    metrics: {
      totalPapers: techData.count,
      recentPapers: techData.recentCount,
      growthRate: techData.growthRate,
      avgCitations: techData.avgCitations,
      momentum: momentum.momentum,
      confidence: momentum.confidence,
      signalCount: allTechData.length
    },
    trends: trends,
    categories: techData.categories,
    venues: techData.venues,
    predictionScore: calculatePredictionScore(techData, evidence, momentum, trends)
  };
}

/**
 * Extract key insights from technology data
 */
function extractKeyInsights(techData, evidence) {
  const insights = [];
  
  // Research velocity
  if (techData.recentCount > 0) {
    const velocity = (techData.recentCount / techData.count) * 100;
    if (velocity > 50) {
      insights.push({
        type: 'research_velocity',
        title: 'Rapid Research Acceleration',
        description: `${Math.round(velocity)}% of all papers published in the last 6 months, indicating explosive growth in research interest.`,
        impact: 'high'
      });
    }
  }
  
  // High citation papers
  const highCitationPapers = techData.papers.filter(p => (p.citations || 0) > 50);
  if (highCitationPapers.length > 0) {
    insights.push({
      type: 'high_impact',
      title: 'High-Impact Research',
      description: `${highCitationPapers.length} papers with 50+ citations, showing strong academic validation and influence.`,
      impact: 'high'
    });
  }
  
  // Top venues
  if (techData.venues.length > 0) {
    const topVenues = techData.venues.slice(0, 3);
    insights.push({
      type: 'prestige',
      title: 'Top-Tier Publications',
      description: `Research published in ${topVenues.join(', ')} and other leading venues, indicating mainstream acceptance.`,
      impact: 'medium'
    });
  }
  
  // Commercial activity
  if (evidence.commercial.length > 0) {
    const fundingNews = evidence.commercial.filter(n => {
      const title = (n.title || '').toLowerCase();
      return title.includes('funding') || title.includes('raise');
    });
    if (fundingNews.length > 0) {
      insights.push({
        type: 'commercial',
        title: 'Strong Commercial Interest',
        description: `${fundingNews.length} funding announcement${fundingNews.length > 1 ? 's' : ''} in recent months, showing investor confidence.`,
        impact: 'high'
      });
    }
  }
  
  // Patent activity
  if (evidence.patents.length > 0) {
    insights.push({
      type: 'ip',
      title: 'Active IP Landscape',
      description: `${evidence.patents.length} patent${evidence.patents.length > 1 ? 's' : ''} filed, indicating serious commercial development.`,
      impact: 'medium'
    });
  }
  
  return insights;
}

/**
 * Identify what to build next
 */
function identifyWhatToBuild(techData, evidence, keyInsights) {
  const opportunities = [];
  
  // Analyze gaps in research
  const researchGaps = identifyResearchGaps(techData, evidence);
  opportunities.push(...researchGaps);
  
  // Commercial opportunities
  const commercialOpportunities = identifyCommercialOpportunities(techData, evidence);
  opportunities.push(...commercialOpportunities);
  
  // Developer opportunities
  const devOpportunities = identifyDeveloperOpportunities(techData, evidence);
  opportunities.push(...devOpportunities);
  
  return opportunities.slice(0, 5); // Top 5 opportunities
}

/**
 * Identify research gaps
 */
function identifyResearchGaps(techData, evidence) {
  const gaps = [];
  
  // Check for areas with low paper count but high interest
  const categories = techData.categories || [];
  categories.forEach(cat => {
    const catPapers = techData.papers.filter(p => (p.categories || []).includes(cat));
    if (catPapers.length < 5 && techData.count > 20) {
      gaps.push({
        type: 'research',
        title: `${cat} Applications`,
        description: `Limited research in ${cat} applications (${catPapers.length} papers), but strong overall interest suggests untapped potential.`,
        opportunity: 'high',
        action: `Focus research on ${cat} use cases for ${techData.name}`
      });
    }
  });
  
  return gaps;
}

/**
 * Identify commercial opportunities
 */
function identifyCommercialOpportunities(techData, evidence) {
  const opportunities = [];
  
  // If high research but low commercial activity
  if (techData.count > 30 && evidence.commercial.length < 5) {
    opportunities.push({
      type: 'commercial',
      title: 'Early Commercial Opportunity',
      description: `Strong research foundation (${techData.count} papers) but limited commercial activity (${evidence.commercial.length} news items), indicating a gap in the market.`,
      opportunity: 'high',
      action: `Build commercial applications leveraging the ${techData.count}+ research papers`
    });
  }
  
  // If patents exist but no major products
  if (evidence.patents.length > 0 && evidence.commercial.length < 3) {
    opportunities.push({
      type: 'product',
      title: 'Product Development Window',
      description: `Patents filed (${evidence.patents.length}) but no major product announcements, suggesting an opportunity to build first-to-market solutions.`,
      opportunity: 'medium',
      action: `Develop products based on existing patents and research`
    });
  }
  
  return opportunities;
}

/**
 * Identify developer opportunities
 */
function identifyDeveloperOpportunities(techData, evidence) {
  const opportunities = [];
  
  // If high research but low developer activity
  if (techData.count > 20 && evidence.developer.length < 3) {
    opportunities.push({
      type: 'developer',
      title: 'Open Source Opportunity',
      description: `Strong research (${techData.count} papers) but limited open-source implementations (${evidence.developer.length} repos), creating an opportunity for developer tools and libraries.`,
      opportunity: 'high',
      action: `Create open-source tools and frameworks for ${techData.name}`
    });
  }
  
  return opportunities;
}

/**
 * Generate detailed narrative
 */
function generateDetailedNarrative(techName, techData, evidence, keyInsights, whatToBuild) {
  const summary = `${techName} is emerging as a critical technology with ${techData.count} research papers, ${techData.recentCount} published in the last 6 months, and growing commercial interest.`;
  
  const sections = [];
  
  // Introduction
  sections.push({
    heading: 'What is it?',
    content: `${techName} represents a significant advancement in the field, with research spanning ${techData.categories.length} categories and publications in ${techData.venues.length} venues including ${techData.venues.slice(0, 3).join(', ')}.`
  });
  
  // Research foundation
  if (techData.count > 0) {
    const topPaper = techData.papers.sort((a, b) => (b.citations || 0) - (a.citations || 0))[0];
    sections.push({
      heading: 'Research Foundation',
      content: `The field is built on ${techData.count} research papers, with the most cited work "${topPaper.title?.substring(0, 100)}..." receiving ${topPaper.citations || 0} citations. Recent acceleration shows ${Math.round(techData.growthRate)}% of papers published in the last 6 months, indicating rapid evolution.`
    });
  }
  
  // Key insights
  if (keyInsights.length > 0) {
    const topInsight = keyInsights[0];
    sections.push({
      heading: 'Why Now?',
      content: topInsight.description
    });
  }
  
  // Commercial landscape
  if (evidence.commercial.length > 0) {
    sections.push({
      heading: 'Commercial Landscape',
      content: `Commercial interest is growing with ${evidence.commercial.length} news articles and announcements. ${evidence.commercial.filter(n => (n.title || '').toLowerCase().includes('funding')).length} funding rounds indicate strong investor confidence.`
    });
  }
  
  // What to build
  if (whatToBuild.length > 0) {
    const topOpportunity = whatToBuild[0];
    sections.push({
      heading: 'What to Build Next',
      content: `${topOpportunity.description} ${topOpportunity.action}`
    });
  }
  
  return {
    summary,
    fullRead: sections
  };
}

/**
 * Extract companies from signals
 */
function extractCompaniesFromSignals(evidence) {
  const companies = new Set();
  
  evidence.commercial.forEach(news => {
    const title = news.title || '';
    const patterns = [
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:raises|announces|launches|secures)/i,
      /(?:from|by|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i
    ];
    
    patterns.forEach(pattern => {
      const match = title.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        if (company.length > 2 && company.length < 50) {
          companies.add(company);
        }
      }
    });
  });
  
  evidence.patents.forEach(patent => {
    if (patent.assignee && patent.assignee !== 'Unknown') {
      companies.add(patent.assignee);
    }
  });
  
  return Array.from(companies).slice(0, 10);
}

/**
 * Calculate trends
 */
function calculateTrends(techData, evidence) {
  const trends = {
    research: {
      direction: techData.growthRate > 30 ? 'up' : techData.growthRate > 0 ? 'stable' : 'down',
      rate: techData.growthRate,
      description: techData.growthRate > 30 ? 'Rapidly accelerating' : techData.growthRate > 0 ? 'Steadily growing' : 'Declining'
    },
    commercial: {
      direction: evidence.commercial.length > 5 ? 'up' : evidence.commercial.length > 0 ? 'stable' : 'down',
      rate: evidence.commercial.length,
      description: evidence.commercial.length > 5 ? 'Strong commercial interest' : evidence.commercial.length > 0 ? 'Emerging commercial activity' : 'Limited commercial activity'
    },
    developer: {
      direction: evidence.developer.length > 3 ? 'up' : evidence.developer.length > 0 ? 'stable' : 'down',
      rate: evidence.developer.length,
      description: evidence.developer.length > 3 ? 'Active developer community' : evidence.developer.length > 0 ? 'Growing developer interest' : 'Limited developer adoption'
    }
  };
  
  return trends;
}

/**
 * Calculate prediction score
 */
function calculatePredictionScore(techData, evidence, momentum, trends) {
  let score = 0;
  
  // Research foundation (0-30 points)
  score += Math.min(techData.count / 10, 1) * 30;
  
  // Growth rate (0-25 points)
  score += Math.min(techData.growthRate / 100, 1) * 25;
  
  // Momentum (0-20 points)
  score += (momentum.momentum / 100) * 20;
  
  // Commercial activity (0-15 points)
  score += Math.min(evidence.commercial.length / 10, 1) * 15;
  
  // Citations (0-10 points)
  score += Math.min(techData.avgCitations / 100, 1) * 10;
  
  return Math.min(100, Math.round(score));
}

