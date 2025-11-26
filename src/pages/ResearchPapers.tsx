import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ExternalLink, Bookmark, Share2, PlusCircle, Eye, TrendingUp, RefreshCw, FileText } from 'lucide-react';
import { mockStartups, aiCategories } from '../data/mockData';
import { fetchPapers, fetchPaperStats, refreshPapers, getPaperAutocomplete, getTotalPaperCount, type Paper } from '../services/api';

// All research domains - expanded to include all major fields
const allResearchDomains = [
  // AI & Machine Learning
  ...aiCategories,
  // Mathematics
  'Mathematics',
  'Algebra',
  'Geometry',
  'Number Theory',
  'Topology',
  'Analysis',
  'Probability',
  'Statistics',
  // Physics
  'Physics',
  'Quantum Physics',
  'Optics',
  'Plasma Physics',
  'Condensed Matter',
  'High Energy Physics',
  // Economics & Finance
  'Economics',
  'Econometrics',
  'Finance',
  'Quantitative Finance',
  // Biology & Life Sciences
  'Biology',
  'Genomics',
  'Computational Biology',
  'Neuroscience',
  // Computer Science (non-AI)
  'Computer Science',
  'Algorithms',
  'Systems',
  'Networks',
  'Security',
  // Engineering
  'Electrical Engineering',
  'Signal Processing',
  'Control Systems',
  // Other
  'Other'
];

export default function ResearchPapers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [industryStats, setIndustryStats] = useState<Record<string, number>>({});
  const [sourceStats, setSourceStats] = useState<{arxiv: number; 'semantic-scholar': number; total: number} | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<string>('all');
  const [totalPapers, setTotalPapers] = useState<number>(0);
  const [papersAdded24h, setPapersAdded24h] = useState<number>(0);
  const [papersAdded7d, setPapersAdded7d] = useState<number>(0);
  const [growthRate, setGrowthRate] = useState<number>(0);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const venues = ['arXiv', 'NeurIPS 2025', 'ICML 2025', 'CVPR 2025', 'ICLR 2025'];

  // Fetch papers on component mount and when filters change
  useEffect(() => {
    loadPapers();
    loadStats();
    loadTotalCount(); // Also load total count separately
  }, [selectedCategory, selectedVenue, selectedSource]);

  // Auto-refresh papers every 2 minutes to show new papers
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing papers...');
      loadPapers();
      loadStats();
      loadTotalCount(); // Also refresh total count
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => clearInterval(interval);
  }, []);

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
        source: selectedSource || undefined,
        limit: 50
      });
      
      setPapers(response.papers);
      setLastUpdate(response.lastUpdate);
      if (response.sources) {
        setSourceStats(response.sources);
      }
      
      // Fetch total count from database (unfiltered) separately
      await loadTotalCount();
    } catch (err) {
      setError('Failed to load papers. Backend server may not be running.');
      console.error('Error loading papers:', err);
      // Fallback to empty array
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTotalCount() {
    try {
      const totalData = await getTotalPaperCount();
      setTotalPapers(totalData.total);
      setLastUpdate(totalData.lastUpdate);
      // Calculate growth metrics with the actual total
      calculateGrowthMetrics(totalData.total);
    } catch (err) {
      console.error('Error loading total count:', err);
      // Fallback: try to get total from the filtered response
      // This will be less accurate but better than nothing
    }
  }

  // Calculate growth metrics by fetching all papers and checking dates
  async function calculateGrowthMetrics(currentTotal: number) {
    try {
      // Fetch all papers (with high limit) to calculate growth
      const allPapersResponse = await fetchPapers({ limit: 10000 });
      const allPapers = allPapersResponse.papers || [];
      
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      let added24h = 0;
      let added7d = 0;
      
      allPapers.forEach(paper => {
        try {
          const paperDate = new Date(paper.published || paper.updated || 0);
          if (!isNaN(paperDate.getTime())) {
            if (paperDate >= last24h) {
              added24h++;
            }
            if (paperDate >= last7d) {
              added7d++;
            }
          }
        } catch (e) {
          // Skip papers with invalid dates
        }
      });
      
      setPapersAdded24h(added24h);
      setPapersAdded7d(added7d);
      
      // Calculate growth rate (papers added in last 7 days as percentage of total)
      if (currentTotal > 0) {
        const growth = (added7d / currentTotal) * 100;
        setGrowthRate(growth);
      } else {
        setGrowthRate(0);
      }
    } catch (err) {
      console.error('Error calculating growth metrics:', err);
      // Set defaults on error
      setPapersAdded24h(0);
      setPapersAdded7d(0);
      setGrowthRate(0);
    }
  }

  async function loadStats() {
    try {
      const stats = await fetchPaperStats(statsPeriod);
      setIndustryStats(stats.industryStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  // Reload stats when period changes
  useEffect(() => {
    loadStats();
  }, [statsPeriod]);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await refreshPapers();
      // Wait a moment for backend to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadPapers();
      await loadStats();
      await loadTotalCount(); // Also refresh total count
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
    <div className="min-h-screen overflow-x-hidden">
      <div className="w-full max-w-[100vw] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        {/* Header with Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-shrink-0 w-full lg:flex-1 lg:min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-1 sm:mb-2 break-words">Latest Research Papers</h1>
              <p className="text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary break-words mb-2 sm:mb-3">
                Research papers from all domains: AI, Mathematics, Physics, Economics, Biology, Computer Science, and more
                {sourceStats && (
                  <span className="ml-1 sm:ml-2 text-xs">
                    ({sourceStats.arxiv} arXiv, {sourceStats['semantic-scholar']} SS)
                  </span>
                )}
                {lastUpdate && (
                  <span className="ml-1 sm:ml-2 text-xs">
                    • {new Date(lastUpdate).toLocaleDateString()}
                  </span>
                )}
              </p>
              
              {/* Live Paper Count & Growth Stats */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 sm:mt-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary-light/10 to-insight-light/10 dark:from-primary-dark/10 dark:to-insight-dark/10 rounded-lg border border-primary-light/20 dark:border-primary-dark/20"
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light dark:text-primary-dark" />
                  <div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Total Papers</div>
                    <div className="text-lg sm:text-xl font-bold text-primary-light dark:text-primary-dark">
                      {totalPapers.toLocaleString()}
                    </div>
                  </div>
                </motion.div>
                
                {papersAdded24h > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-lg border border-green-500/20 dark:border-green-500/30"
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Last 24h</div>
                      <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                        +{papersAdded24h}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {papersAdded7d > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-lg border border-blue-500/20 dark:border-blue-500/30"
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Last 7 days</div>
                      <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                        +{papersAdded7d}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {growthRate > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-lg border border-purple-500/20 dark:border-purple-500/30"
                  >
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Growth Rate</div>
                      <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">
                        +{growthRate.toFixed(1)}%
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Filter Bar - Compact and Contained */}
            <div className="glass-card rounded-lg p-2 sm:p-2.5 border border-light-border dark:border-dark-border w-full lg:w-auto lg:flex-shrink-0 lg:max-w-md">
              <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                <div className="relative flex-1 sm:flex-initial sm:w-48 md:w-52 min-w-0">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-light-text-secondary dark:text-dark-text-secondary z-10 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search papers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && autocompleteSuggestions.length > 0 && setShowAutocomplete(true)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs sm:text-sm rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
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
                  className="px-2 py-1.5 text-xs sm:text-sm rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none flex-shrink-0 sm:w-auto min-w-[140px]"
                >
                  <option value="">All Domains</option>
                  <optgroup label="AI & Machine Learning">
                    {aiCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Mathematics & Statistics">
                    <option value="Mathematics">Mathematics</option>
                    <option value="Statistics">Statistics</option>
                    <option value="Probability">Probability</option>
                    <option value="Algebra">Algebra</option>
                    <option value="Geometry">Geometry</option>
                  </optgroup>
                  <optgroup label="Physics">
                    <option value="Physics">Physics</option>
                    <option value="Quantum Physics">Quantum Physics</option>
                    <option value="Optics">Optics</option>
                    <option value="Condensed Matter">Condensed Matter</option>
                  </optgroup>
                  <optgroup label="Economics & Finance">
                    <option value="Economics">Economics</option>
                    <option value="Finance">Finance</option>
                    <option value="Quantitative Finance">Quantitative Finance</option>
                  </optgroup>
                  <optgroup label="Biology & Life Sciences">
                    <option value="Biology">Biology</option>
                    <option value="Genomics">Genomics</option>
                    <option value="Computational Biology">Computational Biology</option>
                    <option value="Neuroscience">Neuroscience</option>
                  </optgroup>
                  <optgroup label="Computer Science">
                    <option value="Computer Science">Computer Science</option>
                    <option value="Algorithms">Algorithms</option>
                    <option value="Systems">Systems</option>
                    <option value="Networks">Networks</option>
                    <option value="Security">Security</option>
                  </optgroup>
                  <optgroup label="Engineering">
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Signal Processing">Signal Processing</option>
                  </optgroup>
                </select>

                <select
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  className="px-2 py-1.5 text-xs sm:text-sm rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none flex-shrink-0 sm:w-auto min-w-[120px]"
                >
                  <option value="">All Venues</option>
                  {venues.map(venue => (
                    <option key={venue} value={venue}>{venue}</option>
                  ))}
                </select>

                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="px-2 py-1.5 text-xs sm:text-sm rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none flex-shrink-0 sm:w-auto min-w-[110px]"
                >
                  <option value="">All Sources</option>
                  <option value="arxiv">📄 arXiv</option>
                  <option value="semantic-scholar">🔬 SS</option>
                  <option value="both">Both</option>
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
                    <div className="flex-1 pr-2 sm:pr-4 min-w-0">
                      <a
                        href={paper.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 hover:text-primary-light dark:hover:text-primary-dark cursor-pointer transition-colors leading-tight break-words">
                          {paper.title}
                        </h3>
                      </a>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                        <span className="truncate max-w-[200px] sm:max-w-none">{paper.authors.join(', ')}</span>
                        <span>•</span>
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${
                          paper.sourceId === 'arxiv'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        }`}>
                          {paper.sourceId === 'arxiv' ? '📄 arXiv' : '🔬 Semantic Scholar'}
                        </span>
                        <span>•</span>
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-insight-light/10 dark:bg-insight-dark/10 text-insight-light dark:text-insight-dark font-medium text-xs">
                          {paper.venue}
                        </span>
                      </div>
                      {/* Publication Date - Prominently Displayed */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm mb-3 sm:mb-4">
                        <span className="font-medium text-light-text dark:text-dark-text">Published:</span>
                        <span className="text-light-text-secondary dark:text-dark-text-secondary">
                          {(() => {
                            try {
                              const pubDate = paper.published ? new Date(paper.published) : 
                                            paper.updated ? new Date(paper.updated) : null;
                              if (pubDate && !isNaN(pubDate.getTime())) {
                                return pubDate.toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                });
                              }
                              // Fallback to year if date parsing fails
                              return paper.year || paper.date || 'Unknown date';
                            } catch (e) {
                              return paper.year || paper.date || 'Unknown date';
                            }
                          })()}
                        </span>
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
                  <div className="flex flex-wrap gap-2 items-center">
                    <a
                      href={paper.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-all font-medium text-xs sm:text-sm whitespace-nowrap shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      View Full Paper
                    </a>
                    {paper.pdfLink && (
                      <a
                        href={paper.pdfLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 glass-card border border-light-border dark:border-dark-border rounded-lg hover:scale-105 transition-all text-xs sm:text-sm whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Download PDF
                      </a>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-light-text-secondary dark:text-dark-text-secondary ml-auto">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{paper.citations}</span>
                    </div>
                  </div>
                </motion.article>
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 w-full min-w-0">
            <div className="space-y-4 sm:space-y-5 md:space-y-6 sticky top-20 sm:top-24 w-full">
              {/* Papers by Source */}
              {sourceStats && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card rounded-xl p-4 sm:p-5 md:p-6 border border-light-border dark:border-dark-border"
                >
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light dark:text-primary-dark" />
                    <h3 className="font-semibold text-base sm:text-lg">Papers by Source</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📄</span>
                        <span className="font-medium text-xs sm:text-sm">arXiv</span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                        {sourceStats.arxiv}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔬</span>
                        <span className="font-medium text-xs sm:text-sm">Semantic Scholar</span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                        {sourceStats['semantic-scholar']}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-light-border dark:border-dark-border">
                      <span className="font-semibold text-xs sm:text-sm">Total</span>
                      <span className="text-base sm:text-lg font-bold text-primary-light dark:text-primary-dark">
                        {sourceStats.total}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Research Activity by Industry */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-xl p-4 sm:p-5 md:p-6 border border-light-border dark:border-dark-border"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-insight-light dark:text-insight-dark" />
                    <h3 className="font-semibold text-base sm:text-lg">Research Activity by Domain</h3>
                  </div>
                  <select
                    value={statsPeriod}
                    onChange={(e) => setStatsPeriod(e.target.value)}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="year">This Year</option>
                    <option value="quarter">This Quarter</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                <p className="text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3 sm:mb-4">
                  Research domains with the most papers
                  {statsPeriod !== 'all' && (
                    <span className="ml-1 text-primary-light dark:text-primary-dark">
                      ({statsPeriod === 'month' ? 'This Month' : statsPeriod === 'quarter' ? 'This Quarter' : 'This Year'})
                    </span>
                  )}
                </p>
                
                {topCategories.length === 0 ? (
                  <div className="text-center py-6 text-light-text-secondary dark:text-dark-text-secondary text-sm">
                    No papers found for the selected period
                  </div>
                ) : (
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
                )}
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

