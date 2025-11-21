import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ExternalLink, Bookmark, Share2, PlusCircle, Eye, TrendingUp } from 'lucide-react';
import { mockPapers, mockStartups, aiCategories } from '../data/mockData';

export default function ResearchPapers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');

  const venues = ['arXiv', 'NeurIPS 2025', 'ICML 2025', 'CVPR 2025', 'ICLR 2025'];

  const filteredPapers = mockPapers.filter(paper => {
    if (searchTerm && !paper.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !paper.authors.join(' ').toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategory && !paper.tags.includes(selectedCategory)) {
      return false;
    }
    if (selectedVenue && paper.venue !== selectedVenue) {
      return false;
    }
    return true;
  });

  const getRelatedStartups = (paperStartupIds: string[]) => {
    return mockStartups.filter(s => paperStartupIds.includes(s.id));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Latest Research Papers</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            AI-powered summaries and startup connections
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 border border-light-border dark:border-dark-border mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              <input
                type="text"
                placeholder="Search papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
            >
              <option value="">All Categories</option>
              {aiCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="px-4 py-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
            >
              <option value="">All Venues</option>
              {venues.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </select>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - Papers Feed */}
          <main className="lg:col-span-8">
            <div className="space-y-6">
              {filteredPapers.map((paper, index) => (
                <motion.article
                  key={paper.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 hover:text-primary-light dark:hover:text-primary-dark cursor-pointer transition-colors">
                        {paper.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        <span>{paper.authors.join(', ')}</span>
                        <span>•</span>
                        <span className="px-2 py-1 rounded bg-insight-light/10 dark:bg-insight-dark/10 text-insight-light dark:text-insight-dark font-medium">
                          {paper.venue}
                        </span>
                        <span>•</span>
                        <span>{paper.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors">
                        <Bookmark className="w-5 h-5" />
                      </button>
                      <button className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-4 p-4 rounded-lg bg-primary-light/5 dark:bg-primary-dark/5 border-l-4 border-primary-light dark:border-primary-dark">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-primary-light dark:text-primary-dark">🔍 Quick Summary</span>
                    </div>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                      {paper.summary}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {paper.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-sm bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Related Startups */}
                  {paper.relatedStartups.length > 0 && (
                    <div className="mb-4 p-4 rounded-lg bg-success-light/5 dark:bg-success-dark/5 border-l-4 border-success-light dark:border-success-dark">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-success-light dark:text-success-dark">🚀 Related Startups</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {getRelatedStartups(paper.relatedStartups).map(startup => (
                          <div
                            key={startup.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-success-light dark:hover:border-success-dark cursor-pointer transition-colors"
                          >
                            <span className="text-xl">{startup.logo}</span>
                            <span className="text-sm font-medium">{startup.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform font-medium">
                      <ExternalLink className="w-4 h-4" />
                      Read Paper
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 glass-card border border-light-border dark:border-dark-border rounded-lg hover:scale-105 transition-transform">
                      <PlusCircle className="w-4 h-4" />
                      Add to Graph
                    </button>
                    <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary ml-auto">
                      <Eye className="w-4 h-4" />
                      <span>{paper.citations} citations</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4">
            <div className="space-y-6 sticky top-24">
              {/* Papers Everyone's Reading */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary-light dark:text-primary-dark" />
                  <h3 className="font-semibold text-lg">Papers Everyone's Reading</h3>
                </div>
                <div className="space-y-4">
                  {mockPapers.slice(0, 5).map((paper, index) => (
                    <div
                      key={paper.id}
                      className="p-3 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xl font-bold text-light-text-secondary dark:text-dark-text-secondary">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm line-clamp-2 mb-1">
                            {paper.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
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
                transition={{ delay: 0.1 }}
                className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
              >
                <h3 className="font-semibold text-lg mb-4">Topic Clusters</h3>
                <div className="flex flex-wrap gap-2">
                  {['LLMs', 'Computer Vision', 'Healthcare AI', 'Reasoning', 'Multimodal', 'RL', 'Agents', 'Transfer Learning'].map(topic => (
                    <button
                      key={topic}
                      className="px-3 py-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:border-primary-light dark:hover:border-primary-dark hover:scale-105 transition-all text-sm font-medium"
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
                transition={{ delay: 0.2 }}
                className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border bg-gradient-to-br from-insight-light/5 to-primary-light/5"
              >
                <h3 className="font-semibold text-lg mb-2">Based on your interests...</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                  We think you'll find these papers interesting
                </p>
                <div className="space-y-3">
                  {mockPapers.slice(0, 3).map(paper => (
                    <div
                      key={paper.id}
                      className="p-3 rounded-lg bg-glass-light hover:bg-white dark:hover:bg-dark-card cursor-pointer transition-colors"
                    >
                      <div className="font-medium text-sm line-clamp-2 mb-2">
                        {paper.title}
                      </div>
                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {paper.venue} • {paper.date}
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

