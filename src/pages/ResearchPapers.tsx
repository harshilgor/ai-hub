import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ExternalLink, Bookmark, Share2, PlusCircle, Eye, TrendingUp, RefreshCw, FileText } from 'lucide-react';
import { mockStartups, aiCategories } from '../data/mockData';
import { fetchPapers, fetchPaperStats, refreshPapers, getPaperAutocomplete, type Paper } from '../services/api';

export default function ResearchPapers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [industryStats, setIndustryStats] = useState<Record<string, number>>({});
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const venues = ['arXiv', 'NeurIPS 2025', 'ICML 2025', 'CVPR 2025', 'ICLR 2025'];

  // Fetch papers on component mount and when filters change
  useEffect(() => {
    loadPapers();
    loadStats();
  }, [selectedCategory, selectedVenue]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        loadPapers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Autocomplete suggestions
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const suggestions = await getPaperAutocomplete(searchTerm);
          setAutocompleteSuggestions(suggestions);
          setShowAutocomplete(suggestions.length > 0);
        } catch (err) {
          console.error('Error fetching autocomplete:', err);
          setAutocompleteSuggestions([]);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
    }
  }, [searchTerm]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadPapers() {
    try {
      setLoading(true);
      setError('');
      const response = await fetchPapers({
        category: selectedCategory || undefined,
        venue: selectedVenue || undefined,
        search: searchTerm || undefined,
        limit: 50
      });
      
      setPapers(response.papers);
      setLastUpdate(response.lastUpdate);
    } catch (err) {
      setError('Failed to load papers. Backend server may not be running.');
      console.error('Error loading papers:', err);
      // Fallback to empty array
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const stats = await fetchPaperStats();
      setIndustryStats(stats.industryStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await refreshPapers();
      // Wait a moment for backend to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadPapers();
      await loadStats();
    } catch (err) {
      console.error('Error refreshing papers:', err);
    } finally {
      setRefreshing(false);
    }
  }

  const getRelatedStartups = (paperStartupIds: string[]) => {
    return mockStartups.filter(s => paperStartupIds.includes(s.id));
  };

  const topCategories = Object.entries(industryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([category, count]) => ({ category, count }));

  const maxCount = topCategories.length > 0 ? Math.max(...topCategories.map(c => c.count)) : 1;

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8">
        {/* Header with Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-shrink-0 w-full lg:w-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2">Latest Research Papers</h1>
              <p className="text-xs sm:text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary">
                Real-time updates from arXiv and Semantic Scholar
                {lastUpdate && (
                  <span className="ml-2 text-xs">
                    • Last updated: {new Date(lastUpdate).toLocaleString()}
                  </span>
                )}
              </p>
            </div>

            {/* Filter Bar - Compact */}
            <div className="glass-card rounded-xl p-2 sm:p-3 border border-light-border dark:border-dark-border flex-shrink-0 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="relative w-full sm:w-56 md:w-64 lg:w-72">
                  <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-light-text-secondary dark:text-dark-text-secondary z-10" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search papers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && autocompleteSuggestions.length > 0 && setShowAutocomplete(true)}
                    className="w-full pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
                  />
                  
                  {/* Autocomplete dropdown */}
                  {showAutocomplete && autocompleteSuggestions.length > 0 && (
                    <div
                      ref={autocompleteRef}
                      className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      {autocompleteSuggestions.slice(0, 10).map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchTerm(suggestion);
                            setShowAutocomplete(false);
                            loadPapers();
                          }}
                          className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors text-xs sm:text-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {aiCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
                >
                  <option value="">All Venues</option>
                  {venues.map(venue => (
                    <option key={venue} value={venue}>{venue}</option>
                  ))}
                </select>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform font-medium disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <p className="text-red-500 text-sm sm:text-base">{error}</p>
            <p className="text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
              Make sure the backend server is running: <code className="bg-red-500/20 px-2 py-1 rounded text-xs">cd backend && npm start</code>
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6">
          {/* Main Content - Papers Feed */}
          <main className="lg:col-span-8">
            {loading ? (
              <div className="flex items-center justify-center py-12 sm:py-16 md:py-20">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 animate-spin text-primary-light dark:text-primary-dark mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-light-text-secondary dark:text-dark-text-secondary">Loading latest research papers...</p>
                </div>
              </div>
            ) : papers.length === 0 ? (
              <div className="glass-card rounded-xl p-8 sm:p-10 md:p-12 border border-light-border dark:border-dark-border text-center">
                <p className="text-lg sm:text-xl text-light-text-secondary dark:text-dark-text-secondary mb-3 sm:mb-4">
                  No papers found
                </p>
                <p className="text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Try adjusting your filters or check if the backend server is running
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {papers.map((paper, index) => (
                <motion.article
                  key={paper.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-xl p-4 sm:p-5 md:p-6 border border-light-border dark:border-dark-border hover-lift"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 pr-2 sm:pr-4">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 hover:text-primary-light dark:hover:text-primary-dark cursor-pointer transition-colors leading-tight">
                        {paper.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        <span className="truncate max-w-[200px] sm:max-w-none">{paper.authors.join(', ')}</span>
                        <span>•</span>
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-insight-light/10 dark:bg-insight-dark/10 text-insight-light dark:text-insight-dark font-medium text-xs">
                          {paper.venue}
                        </span>
                        <span>•</span>
                        <span>{paper.date || paper.year || new Date(paper.published).getFullYear()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button className="p-1.5 sm:p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors">
                        <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button className="p-1.5 sm:p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors">
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg bg-primary-light/5 dark:bg-primary-dark/5 border-l-4 border-primary-light dark:border-primary-dark">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <span className="text-xs sm:text-sm font-semibold text-primary-light dark:text-primary-dark">🔍 Quick Summary</span>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary leading-relaxed line-clamp-3 sm:line-clamp-none">
                      {paper.summary}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    {paper.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Related Startups */}
                  {paper.relatedStartups.length > 0 && (
                    <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg bg-success-light/5 dark:bg-success-dark/5 border-l-4 border-success-light dark:border-success-dark">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <span className="text-xs sm:text-sm font-semibold text-success-light dark:text-success-dark">🚀 Related Startups</span>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {getRelatedStartups(paper.relatedStartups).map(startup => (
                          <div
                            key={startup.id}
                            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-success-light dark:hover:border-success-dark cursor-pointer transition-colors"
                          >
                            <span className="text-lg sm:text-xl">{startup.logo}</span>
                            <span className="text-xs sm:text-sm font-medium">{startup.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <a
                      href={paper.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform font-medium text-xs sm:text-sm"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                      Read Paper
                    </a>
                    {paper.pdfLink && (
                      <a
                        href={paper.pdfLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass-card border border-light-border dark:border-dark-border rounded-lg hover:scale-105 transition-transform text-xs sm:text-sm"
                      >
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                        PDF
                      </a>
                    )}
                    <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass-card border border-light-border dark:border-dark-border rounded-lg hover:scale-105 transition-transform text-xs sm:text-sm">
                      <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      Add to Graph
                    </button>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary ml-auto">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{paper.citations} citations</span>
                    </div>
                  </div>
                </motion.article>
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4">
            <div className="space-y-4 sm:space-y-5 md:space-y-6 sticky top-20 sm:top-24">
              {/* Research Activity by Industry */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-xl p-4 sm:p-5 md:p-6 border border-light-border dark:border-dark-border"
              >
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-insight-light dark:text-insight-dark" />
                  <h3 className="font-semibold text-base sm:text-lg">Research Activity by Industry</h3>
                </div>
                <p className="text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3 sm:mb-4">
                  Industries seeing the most research papers
                </p>
                
                <div className="space-y-2 sm:space-y-3">
                  {topCategories.map((item, index) => (
                    <motion.div
                      key={item.category}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-primary-light/5 to-insight-light/5 dark:from-primary-dark/5 dark:to-insight-dark/5 border border-light-border dark:border-dark-border hover:border-primary-light dark:hover:border-primary-dark transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <h4 className="font-bold text-xs sm:text-sm">{item.category}</h4>
                        <span className="text-base sm:text-lg font-bold text-primary-light dark:text-primary-dark">
                          {item.count}
                        </span>
                      </div>
                      <div className="w-full bg-light-bg dark:bg-dark-bg rounded-full h-1 sm:h-1.5 mb-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / maxCount) * 100}%` }}
                          transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                          className="h-1 sm:h-1.5 rounded-full bg-gradient-to-r from-primary-light to-insight-light"
                        />
                      </div>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {item.count} paper{item.count !== 1 ? 's' : ''} published
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Papers Everyone's Reading */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-xl p-4 sm:p-5 md:p-6 border border-light-border dark:border-dark-border"
              >
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light dark:text-primary-dark" />
                  <h3 className="font-semibold text-base sm:text-lg">Papers Everyone's Reading</h3>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {papers.slice(0, 5).map((paper, index) => (
                    <div
                      key={paper.id}
                      className="p-2 sm:p-3 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="text-lg sm:text-xl font-bold text-light-text-secondary dark:text-dark-text-secondary">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-xs sm:text-sm line-clamp-2 mb-1">
                            {paper.title}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                            <Eye className="w-3 h-3" />
                            <span>{paper.citations * 10} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Topic Clusters */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-xl p-4 sm:p-5 md:p-6 border border-light-border dark:border-dark-border"
              >
                <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Topic Clusters</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {['LLMs', 'Computer Vision', 'Healthcare AI', 'Reasoning', 'Multimodal', 'RL', 'Agents', 'Transfer Learning'].map(topic => (
                    <button
                      key={topic}
                      className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-primary-light dark:hover:border-primary-dark hover:scale-105 transition-all text-xs sm:text-sm font-medium"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Reading Recommendations */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-xl p-4 sm:p-5 md:p-6 border border-light-border dark:border-dark-border bg-gradient-to-br from-insight-light/5 to-primary-light/5"
              >
                <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Based on your interests...</h3>
                <p className="text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3 sm:mb-4">
                  We think you'll find these papers interesting
                </p>
                <div className="space-y-2 sm:space-y-3">
                  {papers.slice(0, 3).map(paper => (
                    <div
                      key={paper.id}
                      className="p-2 sm:p-3 rounded-lg bg-glass-light hover:bg-white dark:hover:bg-dark-card cursor-pointer transition-colors"
                    >
                      <div className="font-medium text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2">
                        {paper.title}
                      </div>
                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {paper.venue} • {paper.date || paper.year || new Date(paper.published).getFullYear()}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

