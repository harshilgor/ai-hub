/**
 * Aggregation Service - Combines signals from all data sources
 */

import { fetchLatestTechNews } from './newsService.js';
import { fetchLatestPatents } from './patentService.js';
import { fetchLatestGithubActivity } from './githubService.js';
import { fetchJobPostings } from './jobPostingService.js';

/**
 * Aggregate all signals for a technology
 */
export async function aggregateSignalsForTechnology(technology, timeWindow = 30) {
  const now = new Date();
  const dateThreshold = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000);
  
  // Fetch from all sources in parallel
  const [news, patents, github, jobs] = await Promise.allSettled([
    fetchLatestTechNews(100, dateThreshold),
    fetchLatestPatents(50, dateThreshold),
    fetchLatestGithubActivity(30, dateThreshold),
    fetchJobPostings(50, dateThreshold)
  ]);
  
  const allSignals = [];
  
  // Collect news signals
  if (news.status === 'fulfilled') {
    allSignals.push(...news.value.filter(s => 
      (s.technologies || []).includes(technology)
    ));
  }
  
  // Collect patent signals
  if (patents.status === 'fulfilled') {
    allSignals.push(...patents.value.filter(s => 
      (s.technologies || []).includes(technology)
    ));
  }
  
  // Collect GitHub signals
  if (github.status === 'fulfilled') {
    allSignals.push(...github.value.filter(s => 
      (s.technologies || []).includes(technology)
    ));
  }
  
  // Collect job signals
  if (jobs.status === 'fulfilled') {
    allSignals.push(...jobs.value.filter(s => 
      (s.technologies || []).includes(technology)
    ));
  }
  
  return allSignals;
}

/**
 * Aggregate all signals (not filtered by technology)
 */
export async function aggregateAllSignals(timeWindow = 30) {
  const now = new Date();
  const dateThreshold = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000);
  
  // Fetch from all sources
  const [news, patents, github, jobs] = await Promise.allSettled([
    fetchLatestTechNews(100, dateThreshold),
    fetchLatestPatents(50, dateThreshold),
    fetchLatestGithubActivity(30, dateThreshold),
    fetchJobPostings(50, dateThreshold)
  ]);
  
  const allSignals = [];
  
  if (news.status === 'fulfilled') {
    allSignals.push(...news.value);
  }
  
  if (patents.status === 'fulfilled') {
    allSignals.push(...patents.value);
  }
  
  if (github.status === 'fulfilled') {
    allSignals.push(...github.value);
  }
  
  if (jobs.status === 'fulfilled') {
    allSignals.push(...jobs.value);
  }
  
  return allSignals;
}

/**
 * Get all unique technologies from signals
 */
export function extractTechnologiesFromSignals(signals) {
  const technologies = new Set();
  
  signals.forEach(signal => {
    (signal.technologies || []).forEach(tech => technologies.add(tech));
  });
  
  return Array.from(technologies);
}

/**
 * Get all unique industries from signals
 */
export function extractIndustriesFromSignals(signals) {
  const industries = new Set();
  
  signals.forEach(signal => {
    (signal.industries || []).forEach(industry => industries.add(industry));
  });
  
  return Array.from(industries);
}

