/**
 * Insight Engine - Calculates technology momentum, industry growth, and predictions
 */

/**
 * Calculate technology momentum score
 */
export function calculateTechnologyMomentum(technology, signals, timeWindow = 30) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000);
  
  // Filter signals within time window
  const recentSignals = signals.filter(s => new Date(s.published) >= cutoffDate);
  const olderSignals = signals.filter(s => {
    const signalDate = new Date(s.published);
    return signalDate >= new Date(cutoffDate.getTime() - timeWindow * 24 * 60 * 60 * 1000) && 
           signalDate < cutoffDate;
  });
  
  // Calculate velocity for each source type
  const sourceWeights = {
    papers: 0.3,
    patents: 0.25,
    news: 0.2,
    podcasts: 0.15,
    github: 0.1
  };
  
  let totalMomentum = 0;
  let totalWeight = 0;
  
  Object.entries(sourceWeights).forEach(([sourceType, weight]) => {
    const recentCount = recentSignals.filter(s => s.type === sourceType || 
      (sourceType === 'papers' && s.type === 'paper')).length;
    const olderCount = olderSignals.filter(s => s.type === sourceType || 
      (sourceType === 'papers' && s.type === 'paper')).length;
    
    // Calculate velocity (growth rate)
    let velocity = 0;
    if (olderCount > 0) {
      velocity = (recentCount - olderCount) / olderCount;
    } else if (recentCount > 0) {
      velocity = 1; // New technology
    }
    
    // Calculate acceleration (change in velocity)
    const acceleration = Math.max(0, velocity); // Simplified
    
    // Momentum = velocity * acceleration * weight
    const momentum = velocity * (1 + acceleration) * weight;
    totalMomentum += momentum;
    totalWeight += weight;
  });
  
  // Normalize momentum score (0-100)
  const normalizedMomentum = Math.min(100, Math.max(0, (totalMomentum / totalWeight) * 100));
  
  // Confidence based on signal count
  const signalCount = recentSignals.length + olderSignals.length;
  const confidence = Math.min(1, signalCount / 50); // Max confidence at 50+ signals
  
  return {
    momentum: normalizedMomentum,
    velocity: totalMomentum / totalWeight,
    confidence: confidence,
    signalCount: signalCount,
    recentSignals: recentSignals.length,
    olderSignals: olderSignals.length
  };
}

/**
 * Calculate industry growth score
 */
export function calculateIndustryGrowth(industry, signals, timeWindow = 90) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000);
  
  // Filter signals for this industry
  const industrySignals = signals.filter(s => 
    (s.industries || []).includes(industry) && new Date(s.published) >= cutoffDate
  );
  
  // Group by month
  const monthlyCounts = {};
  industrySignals.forEach(signal => {
    const date = new Date(signal.published);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
  });
  
  // Calculate growth rate
  const months = Object.keys(monthlyCounts).sort();
  if (months.length < 2) {
    return {
      growthRate: 0,
      growthScore: 0,
      confidence: 0.3,
      signalCount: industrySignals.length
    };
  }
  
  const recentMonths = months.slice(-3); // Last 3 months
  const olderMonths = months.slice(0, -3); // Previous months
  
  const recentAvg = recentMonths.reduce((sum, m) => sum + (monthlyCounts[m] || 0), 0) / recentMonths.length;
  const olderAvg = olderMonths.length > 0 
    ? olderMonths.reduce((sum, m) => sum + (monthlyCounts[m] || 0), 0) / olderMonths.length
    : recentAvg;
  
  const growthRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  
  // Growth score (0-100)
  const growthScore = Math.min(100, Math.max(0, 50 + growthRate));
  
  // Confidence based on signal count
  const confidence = Math.min(1, industrySignals.length / 100);
  
  return {
    growthRate: growthRate,
    growthScore: growthScore,
    confidence: confidence,
    signalCount: industrySignals.length,
    monthlyTrend: monthlyCounts
  };
}

/**
 * Predict next big technology (enhanced version with comprehensive insights)
 */
export function predictNextBigTechnology(technologies, allSignals, papersCache = []) {
  const predictions = technologies.map(tech => {
    // Use enhanced insight generation
    const insight = generateTechnologyInsight(tech, allSignals, papersCache);
    return insight;
  });
  
  // Sort by prediction score
  predictions.sort((a, b) => b.predictionScore - a.predictionScore);
  
  return predictions;
}

/**
 * Detect emerging technologies
 */
export function detectEmergingTechnologies(allSignals, timeWindow = 30) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000);
  
  // Get all unique technologies
  const allTechnologies = new Set();
  allSignals.forEach(signal => {
    (signal.technologies || []).forEach(tech => allTechnologies.add(tech));
  });
  
  const emerging = [];
  
  allTechnologies.forEach(tech => {
    const techSignals = allSignals.filter(s => 
      (s.technologies || []).includes(tech) && new Date(s.published) >= cutoffDate
    );
    
    // Low volume but high velocity
    const totalSignals = allSignals.filter(s => 
      (s.technologies || []).includes(tech)
    ).length;
    
    const recentCount = techSignals.length;
    const velocity = recentCount / Math.max(1, timeWindow);
    
    // Early stage (low total volume)
    const isLowVolume = totalSignals < 100;
    
    // High velocity
    const isHighVelocity = velocity > 0.5;
    
    // Leader mentions
    const leaderMentions = techSignals.filter(s => 
      s.type === 'podcast' && s.metadata?.quotes?.length > 0
    ).length;
    
    if (isLowVolume && isHighVelocity) {
      const emergingScore = (
        velocity * 40 +
        (isLowVolume ? 30 : 0) +
        leaderMentions * 20 +
        Math.min(recentCount * 2, 10)
      );
      
      emerging.push({
        technology: tech,
        emergingScore: emergingScore,
        velocity: velocity,
        signalCount: recentCount,
        totalSignals: totalSignals,
        leaderMentions: leaderMentions,
        confidence: Math.min(1, recentCount / 20)
      });
    }
  });
  
  // Sort by emerging score
  emerging.sort((a, b) => b.emergingScore - a.emergingScore);
  
  return emerging;
}

/**
 * Extract leader quotes about technologies
 */
export function extractLeaderQuotes(signals) {
  const quotes = [];
  
  signals.filter(s => s.type === 'podcast').forEach(signal => {
    // Use new enhanced metadata structure if available
    if (signal.metadata?.keyQuotes && Array.isArray(signal.metadata.keyQuotes)) {
      signal.metadata.keyQuotes.forEach(quote => {
        quotes.push({
          text: quote.text,
          speaker: quote.speaker,
          technologies: [quote.technology],
          source: signal.source,
          published: signal.published,
          timestamp: quote.timestamp,
          stance: quote.stance,
          confidence: quote.confidence || 0.8
        });
      });
    }
    // Fallback to old structure for backward compatibility
    else if (signal.metadata?.quotes && Array.isArray(signal.metadata.quotes)) {
      signal.metadata.quotes.forEach(quote => {
        quotes.push({
          text: quote.text,
          technologies: quote.technologies || [],
          source: signal.source,
          published: signal.published,
          confidence: quote.confidence || 0.8
        });
      });
    }
  });
  
  // Sort by confidence and recency
  quotes.sort((a, b) => {
    const dateDiff = new Date(b.published) - new Date(a.published);
    const confidenceDiff = b.confidence - a.confidence;
    return confidenceDiff * 0.7 + (dateDiff > 0 ? 0.3 : -0.3);
  });
  
  return quotes.slice(0, 20); // Top 20 quotes
}

/**
 * Calculate combined signal strength
 */
export function calculateCombinedSignalStrength(technology, signals) {
  const techSignals = signals.filter(s => 
    (s.technologies || []).includes(technology)
  );
  
  const sourceCounts = {
    papers: 0,
    patents: 0,
    news: 0,
    podcasts: 0,
    github: 0
  };
  
  techSignals.forEach(signal => {
    if (signal.type === 'paper') sourceCounts.papers++;
    else if (signal.type === 'patent') sourceCounts.patents++;
    else if (signal.type === 'news') sourceCounts.news++;
    else if (signal.type === 'podcast') sourceCounts.podcasts++;
    else if (signal.type === 'github') sourceCounts.github++;
  });
  
  // Weighted signal strength
  const weights = {
    papers: 0.3,
    patents: 0.25,
    news: 0.2,
    podcasts: 0.15,
    github: 0.1
  };
  
  let totalStrength = 0;
  Object.entries(sourceCounts).forEach(([source, count]) => {
    totalStrength += Math.min(count / 10, 1) * weights[source] * 100;
  });
  
  return {
    totalStrength: totalStrength,
    sourceBreakdown: sourceCounts,
    signalCount: techSignals.length
  };
}

/**
 * Enhanced Insight Generation - Creates comprehensive insights with narratives, evidence, and connections
 */

/**
 * Find cross-connections between different source types
 */
function findCrossConnections(evidence, technology) {
  const connections = [];
  
  // Research → Commercial: Papers that led to news coverage
  evidence.research.forEach(paper => {
    const relatedNews = evidence.commercial.filter(news => {
      const paperDate = new Date(paper.published || paper.updated || 0);
      const newsDate = new Date(news.published || news.updated || 0);
      const timeDiff = newsDate - paperDate;
      return timeDiff > 0 && timeDiff < 90 * 24 * 60 * 60 * 1000; // Within 90 days
    });
    
    if (relatedNews.length > 0) {
      const topNews = relatedNews.sort((a, b) => {
        const aDate = new Date(a.published || a.updated || 0);
        const bDate = new Date(b.published || b.updated || 0);
        return bDate - aDate;
      })[0];
      
      connections.push({
        type: "research-to-commercial",
        description: `Research paper "${paper.title?.substring(0, 60)}..." led to ${relatedNews.length} commercial announcement${relatedNews.length > 1 ? 's' : ''}`,
        sources: [
          { type: 'paper', id: paper.id || paper.title, title: paper.title },
          { type: 'news', id: topNews.id || topNews.title, title: topNews.title }
        ],
        strength: Math.min(relatedNews.length / 5, 1) // Normalize to 0-1
      });
    }
  });
  
  // Patent → Market: Patents that correlate with job postings or news (removed - patents no longer fetched)
  (evidence.patents || []).forEach(patent => {
    const patentDate = new Date(patent.published || patent.updated || 0);
    
    const relatedJobs = evidence.jobs.filter(job => {
      const jobDate = new Date(job.published || job.updated || 0);
      const timeDiff = jobDate - patentDate;
      return timeDiff > 0 && timeDiff < 180 * 24 * 60 * 60 * 1000; // Within 180 days
    });
    
    const relatedNews = evidence.commercial.filter(news => {
      const newsDate = new Date(news.published || news.updated || 0);
      const timeDiff = newsDate - patentDate;
      return timeDiff > 0 && timeDiff < 90 * 24 * 60 * 60 * 1000; // Within 90 days
    });
    
    if (relatedJobs.length > 5 || relatedNews.length > 0) {
      connections.push({
        type: "patent-to-market",
        description: `Patent "${patent.title?.substring(0, 60)}..." correlates with ${relatedJobs.length} job posting${relatedJobs.length !== 1 ? 's' : ''} and ${relatedNews.length} news item${relatedNews.length !== 1 ? 's' : ''}`,
        sources: [
          { type: 'patent', id: patent.id || patent.title, title: patent.title },
          ...(relatedNews.length > 0 ? [{ type: 'news', id: relatedNews[0].id || relatedNews[0].title, title: relatedNews[0].title }] : [])
        ],
        strength: Math.min((relatedJobs.length + relatedNews.length) / 10, 1)
      });
    }
  });
  
  // Developer → Commercial: GitHub activity that precedes funding/news
  evidence.developer.forEach(repo => {
    const repoDate = new Date(repo.published || repo.updated || 0);
    
    const relatedNews = evidence.commercial.filter(news => {
      const newsDate = new Date(news.published || news.updated || 0);
      const timeDiff = newsDate - repoDate;
      return timeDiff > 0 && timeDiff < 60 * 24 * 60 * 60 * 1000; // Within 60 days
    });
    
    const fundingNews = relatedNews.filter(n => {
      const title = (n.title || '').toLowerCase();
      return title.includes('funding') || title.includes('raise') || title.includes('investment');
    });
    
    if (fundingNews.length > 0) {
      connections.push({
        type: "developer-to-commercial",
        description: `"${repo.name || repo.title}" repository growth (${repo.stars || 0} stars) preceded ${fundingNews.length} funding announcement${fundingNews.length > 1 ? 's' : ''}`,
        sources: [
          { type: 'github', id: repo.id || repo.name, title: repo.name || repo.title },
          { type: 'news', id: fundingNews[0].id || fundingNews[0].title, title: fundingNews[0].title }
        ],
        strength: Math.min((repo.stars || 0) / 10000, 1) * 0.5 + (fundingNews.length / 5) * 0.5
      });
    }
  });
  
  // Sort by strength
  connections.sort((a, b) => b.strength - a.strength);
  
  return connections.slice(0, 5); // Top 5 connections
}

/**
 * Build timeline of key events
 */
function buildTimeline(evidence) {
  const timeline = [];
  
  // Collect all events with dates
  [...evidence.research, ...evidence.commercial, ...evidence.patents, 
   ...evidence.developer, ...evidence.jobs].forEach(signal => {
    const date = new Date(signal.published || signal.updated || 0);
    if (!isNaN(date.getTime())) {
      timeline.push({
        date: date.toISOString(),
        event: signal.title || signal.name || 'Event',
        type: signal.type,
        source: signal.source || 'Unknown'
      });
    }
  });
  
  // Sort by date
  timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Group by month and get key events
  const monthlyEvents = {};
  timeline.forEach(event => {
    const monthKey = event.date.substring(0, 7); // YYYY-MM
    if (!monthlyEvents[monthKey]) {
      monthlyEvents[monthKey] = [];
    }
    monthlyEvents[monthKey].push(event);
  });
  
  // Get most significant event per month
  const keyEvents = Object.entries(monthlyEvents).map(([month, events]) => {
    // Prioritize: patents > funding news > research > developer > jobs
    const priority = { patent: 5, news: 4, paper: 3, github: 2, job: 1 };
    events.sort((a, b) => (priority[b.type] || 0) - (priority[a.type] || 0));
    return {
      date: month,
      event: events[0].event,
      type: events[0].type,
      source: events[0].source
    };
  });
  
  return keyEvents.slice(-6); // Last 6 months
}

/**
 * Extract company/startup names from signals
 */
function extractCompanies(evidence) {
  const companies = new Set();
  
  // Extract from news titles (common patterns)
  evidence.commercial.forEach(news => {
    const title = news.title || '';
    const titleLower = title.toLowerCase();
    
    // Look for patterns like "Company X raises", "X announces", etc.
    // First try with original case (for proper names)
    const patterns = [
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:raises|announces|launches|releases|secures)/i,
      /(?:from|by|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i,
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:funding|investment|series|round)/i,
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:raises|gets|receives)\s+\$/i
    ];
    
    patterns.forEach(pattern => {
      const match = title.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        // Filter out common words that aren't companies
        const excludeWords = ['the', 'a', 'an', 'this', 'that', 'new', 'tech', 'ai', 'startup', 'company', 'firm'];
        const words = company.toLowerCase().split(' ');
        if (company.length > 2 && company.length < 50 && 
            !excludeWords.includes(company.toLowerCase()) &&
            words.length <= 4) {
          companies.add(company);
        }
      }
    });
  });
  
  // Extract from patents (assignee) - patents no longer fetched, kept for compatibility
  (evidence.patents || []).forEach(patent => {
    if (patent.assignee && patent.assignee !== 'Unknown') {
      companies.add(patent.assignee);
    }
  });
  
  // Extract from GitHub (organization/owner)
  evidence.developer.forEach(repo => {
    if (repo.organization) {
      companies.add(repo.organization);
    }
    if (repo.owner && !repo.owner.includes('/')) {
      companies.add(repo.owner);
    }
  });
  
  return Array.from(companies).slice(0, 10); // Top 10 companies
}

/**
 * Identify what specific aspect is becoming big
 */
function identifyKeyAspect(technology, evidence) {
  const aspects = [];
  
  // Analyze research papers for key themes
  const researchThemes = {};
  evidence.research.forEach(paper => {
    const title = (paper.title || '').toLowerCase();
    const summary = (paper.summary || '').toLowerCase();
    const text = `${title} ${summary}`;
    
    // Common aspect keywords
    if (text.includes('autonomous') || text.includes('agent')) {
      researchThemes['autonomous systems'] = (researchThemes['autonomous systems'] || 0) + 1;
    }
    if (text.includes('multimodal') || text.includes('vision') || text.includes('image')) {
      researchThemes['multimodal processing'] = (researchThemes['multimodal processing'] || 0) + 1;
    }
    if (text.includes('real-time') || text.includes('latency')) {
      researchThemes['real-time processing'] = (researchThemes['real-time processing'] || 0) + 1;
    }
    if (text.includes('generative') || text.includes('synthesis')) {
      researchThemes['generative capabilities'] = (researchThemes['generative capabilities'] || 0) + 1;
    }
    if (text.includes('robotic') || text.includes('robot')) {
      researchThemes['robotic applications'] = (researchThemes['robotic applications'] || 0) + 1;
    }
    if (text.includes('healthcare') || text.includes('medical') || text.includes('diagnosis')) {
      researchThemes['healthcare applications'] = (researchThemes['healthcare applications'] || 0) + 1;
    }
  });
  
  // Get top themes
  const topThemes = Object.entries(researchThemes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);
  
  return topThemes;
}

/**
 * Generate "what's next" predictions
 */
function generateWhatsNext(technology, evidence, companies, keyAspects) {
  const predictions = [];
  
  // Based on research velocity
  const recentResearch = evidence.research.filter(p => {
    const date = new Date(p.published || p.updated || 0);
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    return date >= sixMonthsAgo;
  });
  
  if (recentResearch.length > evidence.research.length * 0.5) {
    predictions.push(`Research activity has accelerated ${Math.round((recentResearch.length / evidence.research.length) * 100)}% in the last 6 months, indicating rapid technical advancement.`);
  }
  
  // Based on commercial activity
  const fundingNews = evidence.commercial.filter(n => {
    const title = (n.title || '').toLowerCase();
    return title.includes('funding') || title.includes('raise');
  });
  
  if (fundingNews.length > 0) {
    predictions.push(`With ${fundingNews.length} funding round${fundingNews.length > 1 ? 's' : ''} in recent months, expect increased commercialization and product launches in the next 6-12 months.`);
  }
  
  // Based on companies involved
  if (companies.length > 0) {
    const topCompanies = companies.slice(0, 3).join(', ');
    predictions.push(`Major players like ${topCompanies} are actively investing, suggesting enterprise adoption is imminent.`);
  }
  
  // Based on key aspects
  if (keyAspects.length > 0) {
    predictions.push(`The focus on ${keyAspects[0]}${keyAspects.length > 1 ? ` and ${keyAspects[1]}` : ''} indicates this is where the biggest breakthroughs will occur.`);
  }
  
  // Based on patent activity
  if (evidence.patents.length > 5) {
    predictions.push(`With ${evidence.patents.length} patents filed, expect IP-driven market consolidation and licensing opportunities.`);
  }
  
  // Based on developer activity
  const totalStars = evidence.developer.reduce((sum, repo) => sum + (repo.stars || 0), 0);
  if (totalStars > 10000) {
    predictions.push(`Developer ecosystem is thriving (${totalStars.toLocaleString()}+ stars), indicating strong open-source momentum and community adoption.`);
  }
  
  return predictions.slice(0, 4); // Top 4 predictions
}

/**
 * Generate natural language narrative with specific details
 */
function generateNarrative(technology, evidence, connections, companies, keyAspects) {
  const parts = [];
  
  // Opening: What specific aspect is becoming big
  if (keyAspects.length > 0) {
    parts.push(`${technology} is emerging as the next big technology, specifically in ${keyAspects[0]}${keyAspects.length > 1 ? ` and ${keyAspects.slice(1).join(', ')}` : ''}.`);
  } else {
    parts.push(`${technology} is emerging as a significant technology trend, driven by multiple converging signals across research, commercial, and developer communities.`);
  }
  
  // What's becoming big - specific details
  if (evidence.research.length > 0) {
    const topPaper = [...evidence.research].sort((a, b) => 
      (b.citations || 0) - (a.citations || 0)
    )[0];
    const venue = topPaper.venue || topPaper.source || 'Research';
    const paperTitle = topPaper.title?.substring(0, 100) || 'Recent research';
    
    // Extract key finding from title
    let keyFinding = '';
    const titleLower = (topPaper.title || '').toLowerCase();
    if (titleLower.includes('breakthrough')) keyFinding = 'breakthrough results';
    else if (titleLower.includes('improve') || titleLower.includes('better')) keyFinding = 'significant improvements';
    else if (titleLower.includes('new') || titleLower.includes('novel')) keyFinding = 'novel approaches';
    else keyFinding = 'important advances';
    
    parts.push(`Recent research from ${venue} shows ${keyFinding} in "${paperTitle}${topPaper.title?.length > 100 ? '...' : ''}", demonstrating that ${keyAspects[0] || 'this technology'} is reaching maturity.`);
  }
  
  // Companies working on it
  if (companies.length > 0) {
    const topCompanies = companies.slice(0, 5);
    if (topCompanies.length === 1) {
      parts.push(`${topCompanies[0]} is leading development in this space.`);
    } else if (topCompanies.length <= 3) {
      parts.push(`Companies like ${topCompanies.join(', ')} are actively working on cutting-edge applications.`);
    } else {
      parts.push(`Major players including ${topCompanies.slice(0, 3).join(', ')}, and ${topCompanies.length - 3} other companies are investing heavily in this technology.`);
    }
  }
  
  // Commercial momentum with specifics
  if (evidence.commercial.length > 0) {
    const fundingNews = evidence.commercial.filter(n => {
      const title = (n.title || '').toLowerCase();
      return title.includes('funding') || title.includes('raise') || title.includes('investment');
    });
    if (fundingNews.length > 0) {
      // Try to extract funding amounts
      const fundingAmounts = [];
      fundingNews.forEach(n => {
        const title = n.title || '';
        const amountMatch = title.match(/\$[\d.]+[BMK]?/i);
        if (amountMatch && fundingAmounts.length < 3) {
          fundingAmounts.push(amountMatch[0]);
        }
      });
      
      if (fundingAmounts.length > 0) {
        parts.push(`Commercial momentum is accelerating with ${fundingNews.length} funding round${fundingNews.length > 1 ? 's' : ''} totaling ${fundingAmounts.join(', ')} in recent months.`);
      } else {
        parts.push(`Commercial momentum is strong, with ${fundingNews.length} major funding announcement${fundingNews.length > 1 ? 's' : ''} signaling investor confidence.`);
      }
    } else {
      parts.push(`Commercial interest is growing, with ${evidence.commercial.length} news article${evidence.commercial.length > 1 ? 's' : ''} covering developments in this space.`);
    }
  }
  
  // Developer adoption with specifics
  if (evidence.developer.length > 0) {
    const totalStars = evidence.developer.reduce((sum, repo) => sum + (repo.stars || 0), 0);
    const topRepo = [...evidence.developer].sort((a, b) => (b.stars || 0) - (a.stars || 0))[0];
    
    if (totalStars > 10000) {
      parts.push(`Developer community is rapidly adopting this technology, with projects like "${topRepo.name || 'key repositories'}" gaining ${topRepo.stars?.toLocaleString() || 'significant'} stars and ${totalStars.toLocaleString()}+ total stars across the ecosystem.`);
    } else if (evidence.developer.length > 0) {
      parts.push(`Developer interest is increasing, with ${evidence.developer.length} active repository${evidence.developer.length > 1 ? 'ies' : 'y'} and growing open-source contributions.`);
    }
  }
  
  // Patent activity with company details
  if (evidence.patents.length > 0) {
    const patentCompanies = new Set();
    evidence.patents.forEach(p => {
      if (p.assignee && p.assignee !== 'Unknown') {
        patentCompanies.add(p.assignee);
      }
    });
    
    if (patentCompanies.size > 0) {
      const companyList = Array.from(patentCompanies).slice(0, 3).join(', ');
      parts.push(`Intellectual property landscape is active, with ${evidence.patents.length} patent${evidence.patents.length > 1 ? 's' : ''} filed by companies like ${companyList}, indicating serious commercial interest.`);
    } else {
      parts.push(`Intellectual property activity is significant, with ${evidence.patents.length} patent${evidence.patents.length > 1 ? 's' : ''} filed related to this technology.`);
    }
  }
  
  // Cross-connections with specifics
  if (connections.length > 0) {
    const strongestConnection = connections[0];
    parts.push(`${strongestConnection.description}, showing how research is translating into commercial opportunities.`);
  }
  
  return parts.join(' ');
}

/**
 * Identify risks
 */
function identifyRisks(evidence) {
  const risks = [];
  
  // Low signal count
  const totalSignals = evidence.research.length + evidence.commercial.length + 
                       evidence.patents.length + evidence.developer.length + evidence.jobs.length;
  if (totalSignals < 10) {
    risks.push("Early stage - limited signal volume may indicate unproven market");
  }
  
  // No commercial activity
  if (evidence.commercial.length === 0 && evidence.patents.length === 0) {
    risks.push("Lacks commercial validation - primarily research-focused");
  }
  
  // No developer activity
  if (evidence.developer.length === 0) {
    risks.push("Limited developer adoption - may face implementation challenges");
  }
  
  // Regulatory concerns (check for keywords in news)
  const regulatoryNews = evidence.commercial.filter(n => {
    const title = (n.title || '').toLowerCase();
    const summary = (n.summary || '').toLowerCase();
    return title.includes('regulation') || title.includes('ban') || title.includes('restrict') ||
           summary.includes('regulation') || summary.includes('ban') || summary.includes('restrict');
  });
  if (regulatoryNews.length > 0) {
    risks.push("Potential regulatory concerns - may face policy challenges");
  }
  
  return risks.length > 0 ? risks : ["No significant risks identified at this time"];
}

/**
 * Identify confidence factors
 */
function identifyConfidenceFactors(evidence) {
  const factors = [];
  
  // Research foundation
  if (evidence.research.length > 0) {
    const highCitationPapers = evidence.research.filter(p => (p.citations || 0) > 10);
    if (highCitationPapers.length > 0) {
      factors.push(`Strong research foundation (${evidence.research.length} papers, ${highCitationPapers.length} highly cited)`);
    } else {
      factors.push(`Research foundation (${evidence.research.length} papers)`);
    }
  }
  
  // Commercial backing
  const fundingNews = evidence.commercial.filter(n => {
    const title = (n.title || '').toLowerCase();
    return title.includes('funding') || title.includes('raise') || title.includes('investment');
  });
  if (fundingNews.length > 0) {
    factors.push(`Major commercial backing (${fundingNews.length} funding announcement${fundingNews.length > 1 ? 's' : ''})`);
  } else if (evidence.commercial.length > 0) {
    factors.push(`Commercial interest (${evidence.commercial.length} news articles)`);
  }
  
  // Patent activity
  if (evidence.patents.length > 0) {
    factors.push(`Active patent landscape (${evidence.patents.length} patent${evidence.patents.length > 1 ? 's' : ''})`);
  }
  
  // Developer community
  if (evidence.developer.length > 0) {
    const totalStars = evidence.developer.reduce((sum, repo) => sum + (repo.stars || 0), 0);
    if (totalStars > 10000) {
      factors.push(`Strong developer community (${totalStars.toLocaleString()}+ stars)`);
    } else {
      factors.push(`Developer community growing (${evidence.developer.length} repositories)`);
    }
  }
  
  // Job market
  if (evidence.jobs.length > 0) {
    factors.push(`Market demand (${evidence.jobs.length} job posting${evidence.jobs.length > 1 ? 's' : ''})`);
  }
  
  return factors.length > 0 ? factors : ["Limited data available"];
}

/**
 * Calculate contextual prediction score
 */
function calculateContextualPredictionScore(evidence, connections) {
  const sourceWeights = {
    research: 0.3,
    patents: 0.25,
    commercial: 0.2,
    developer: 0.15,
    jobs: 0.1
  };
  
  let score = 0;
  
  // Base score from signal counts
  Object.entries(sourceWeights).forEach(([source, weight]) => {
    const count = evidence[source]?.length || 0;
    const normalizedCount = Math.min(count / 20, 1); // Normalize to 0-1 (max at 20 signals)
    score += normalizedCount * weight * 100;
  });
  
  // Connection bonus (up to 20 points)
  if (connections.length > 0) {
    const avgConnectionStrength = connections.reduce((sum, c) => sum + c.strength, 0) / connections.length;
    score += avgConnectionStrength * 20;
  }
  
  // Diversity bonus (if signals from multiple sources)
  const sourceCount = Object.values(evidence).filter(arr => arr.length > 0).length;
  if (sourceCount >= 3) {
    score += 10; // Bonus for multi-source validation
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Generate comprehensive insight for a technology
 */
export function generateTechnologyInsight(technology, allSignals, papersCache = []) {
  // 1. Collect all signals for this technology
  // Also include papers from cache that match the technology
  const techSignals = allSignals.filter(s => 
    (s.technologies || []).includes(technology)
  );
  
  // Add papers from cache that might have this technology in title/tags
  const techLower = technology.toLowerCase();
  const matchingPapers = papersCache.filter(p => {
    const title = (p.title || '').toLowerCase();
    const tags = (p.tags || []).map(t => t.toLowerCase());
    const categories = (p.categories || []).map(c => c.toLowerCase());
    return title.includes(techLower) || 
           tags.some(t => t.includes(techLower)) ||
           categories.some(c => c.includes(techLower));
  }).map(p => ({
    ...p,
    type: 'paper',
    technologies: p.tags || p.categories || []
  }));
  
  // Combine signals with matching papers
  const allTechSignals = [...techSignals, ...matchingPapers];
  
  // 2. Categorize signals by source
  const evidence = {
    research: allTechSignals.filter(s => s.type === 'paper'),
    commercial: allTechSignals.filter(s => s.type === 'news'),
    patents: allTechSignals.filter(s => s.type === 'patent'),
    developer: allTechSignals.filter(s => s.type === 'github'),
    jobs: allTechSignals.filter(s => s.type === 'job')
  };
  
  // 3. Extract companies/startups working on this technology
  const companies = extractCompanies(evidence);
  
  // 4. Identify what specific aspect is becoming big
  const keyAspects = identifyKeyAspect(technology, evidence);
  
  // 5. Find cross-connections
  const connections = findCrossConnections(evidence, technology);
  
  // 6. Build timeline
  const timeline = buildTimeline(evidence);
  
  // 7. Generate narrative with specific details
  const narrative = generateNarrative(technology, evidence, connections, companies, keyAspects);
  
  // 8. Generate "what's next" predictions
  const whatsNext = generateWhatsNext(technology, evidence, companies, keyAspects);
  
  // 6. Calculate prediction score with context
  const predictionScore = calculateContextualPredictionScore(evidence, connections);
  
  // 7. Calculate momentum (using existing function)
  const momentum = calculateTechnologyMomentum(technology, allTechSignals);
  
  // 8. Identify risks and confidence factors
  const risks = identifyRisks(evidence);
  const confidenceFactors = identifyConfidenceFactors(evidence);
  
  // 9. Calculate trends for each source
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  
  const trends = {
    research: {
      count: evidence.research.length,
      recentCount: evidence.research.filter(s => new Date(s.published || s.updated || 0) >= sixMonthsAgo).length,
      trend: evidence.research.length > 0 ? 
        `${Math.round((evidence.research.filter(s => new Date(s.published || s.updated || 0) >= sixMonthsAgo).length / evidence.research.length) * 100)}% in last 6 months` : 
        "No recent activity"
    },
    commercial: {
      count: evidence.commercial.length,
      recentCount: evidence.commercial.filter(s => new Date(s.published || s.updated || 0) >= sixMonthsAgo).length,
      trend: evidence.commercial.length > 0 ?
        `${evidence.commercial.filter(s => {
          const title = (s.title || '').toLowerCase();
          return title.includes('funding') || title.includes('raise');
        }).length}x funding announcements` :
        "Limited commercial activity"
    },
    patents: {
      count: evidence.patents.length,
      recentCount: evidence.patents.filter(s => new Date(s.published || s.updated || 0) >= sixMonthsAgo).length,
      trend: evidence.patents.length > 0 ?
        `${Math.round((evidence.patents.filter(s => new Date(s.published || s.updated || 0) >= sixMonthsAgo).length / evidence.patents.length) * 100)}% increase in filings` :
        "No patent activity"
    },
    developer: {
      count: evidence.developer.length,
      totalStars: evidence.developer.reduce((sum, repo) => sum + (repo.stars || 0), 0),
      trend: evidence.developer.length > 0 ?
        `${evidence.developer.reduce((sum, repo) => sum + (repo.stars || 0), 0).toLocaleString()}+ stars` :
        "Limited developer activity"
    }
  };
  
  // 10. Get key examples from each source
  const keyExamples = {
    research: evidence.research
      .sort((a, b) => (b.citations || 0) - (a.citations || 0))
      .slice(0, 3)
      .map(p => ({
        title: p.title,
        venue: p.venue || p.source,
        citations: p.citations || 0,
        date: p.published || p.updated
      })),
    commercial: evidence.commercial
      .filter(n => {
        const title = (n.title || '').toLowerCase();
        return title.includes('funding') || title.includes('raise') || title.includes('investment');
      })
      .sort((a, b) => new Date(b.published || b.updated || 0) - new Date(a.published || a.updated || 0))
      .slice(0, 3)
      .map(n => ({
        title: n.title,
        source: n.source,
        date: n.published || n.updated
      })),
    patents: evidence.patents
      .sort((a, b) => new Date(b.published || b.updated || 0) - new Date(a.published || a.updated || 0))
      .slice(0, 3)
      .map(p => ({
        title: p.title,
        assignee: p.assignee || p.source,
        date: p.published || p.updated
      })),
    developer: evidence.developer
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 3)
      .map(r => ({
        name: r.name || r.title,
        stars: r.stars || 0,
        date: r.published || r.updated
      }))
  };
  
  return {
    technology,
    predictionScore: Math.round(predictionScore * 10) / 10,
    momentum: momentum.momentum,
    confidence: momentum.confidence,
    whyItWillBeBig: {
      summary: narrative,
      keyAspects: keyAspects, // What specific aspect is becoming big
      companies: companies, // Companies/startups working on it
      whatsNext: whatsNext, // What's going to happen next
      evidence: {
        research: {
          count: evidence.research.length,
          trend: trends.research.trend,
          keyExamples: keyExamples.research
        },
        commercial: {
          count: evidence.commercial.length,
          trend: trends.commercial.trend,
          keyExamples: keyExamples.commercial
        },
        patents: {
          count: evidence.patents.length,
          trend: trends.patents.trend,
          keyExamples: keyExamples.patents
        },
        developer: {
          count: evidence.developer.length,
          trend: trends.developer.trend,
          keyExamples: keyExamples.developer
        }
      },
      connections: connections,
      timeline: timeline,
      risks: risks,
      confidenceFactors: confidenceFactors
    },
    signalCount: allTechSignals.length,
    isEarlyStage: allTechSignals.length < 200
  };
}

