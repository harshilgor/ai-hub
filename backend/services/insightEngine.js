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
  const signalCount = recentSignals.length;
  const confidence = Math.min(1, signalCount / 50); // Max confidence at 50+ signals
  
  return {
    momentum: normalizedMomentum,
    velocity: totalMomentum / totalWeight,
    confidence: confidence,
    signalCount: signalCount,
    recentSignals: recentCount,
    olderSignals: olderCount
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
 * Predict next big technology
 */
export function predictNextBigTechnology(technologies, allSignals) {
  const predictions = technologies.map(tech => {
    const techSignals = allSignals.filter(s => 
      (s.technologies || []).includes(tech)
    );
    
    const momentum = calculateTechnologyMomentum(tech, techSignals);
    
    // Early stage indicator (not yet mainstream)
    const totalSignals = techSignals.length;
    const isEarlyStage = totalSignals < 200; // Threshold for early stage
    
    // Leader mentions (from podcasts)
    const leaderMentions = techSignals.filter(s => 
      s.type === 'podcast' && s.metadata?.quotes?.length > 0
    ).length;
    
    // Patent activity
    const patentCount = techSignals.filter(s => s.type === 'patent').length;
    
    // Prediction score
    const predictionScore = (
      momentum.momentum * 0.4 +
      (isEarlyStage ? 30 : 0) * 0.2 +
      Math.min(leaderMentions * 10, 30) * 0.2 +
      Math.min(patentCount * 5, 20) * 0.2
    );
    
    return {
      technology: tech,
      predictionScore: predictionScore,
      momentum: momentum.momentum,
      confidence: momentum.confidence,
      isEarlyStage: isEarlyStage,
      leaderMentions: leaderMentions,
      patentCount: patentCount,
      signalCount: totalSignals
    };
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
  
  signals.filter(s => s.type === 'podcast' && s.metadata?.quotes).forEach(signal => {
    signal.metadata.quotes.forEach(quote => {
      quotes.push({
        text: quote.text,
        technologies: quote.technologies,
        source: signal.source,
        published: signal.published,
        confidence: quote.confidence || 0.8
      });
    });
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

