import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ExternalLink, Users, Globe, Linkedin, Twitter } from 'lucide-react';
import { mockStartups, aiCategories } from '../data/mockData';

export default function YCExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStartup, setSelectedStartup] = useState<typeof mockStartups[0] | null>(null);

  const ycStartups = mockStartups.filter(s => s.batch);

  const filteredStartups = ycStartups.filter(startup => {
    if (searchTerm && !startup.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !startup.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedBatch && startup.batch !== selectedBatch) {
      return false;
    }
    if (selectedCategory && !startup.category.includes(selectedCategory)) {
      return false;
    }
    return true;
  });

  const batches = ['W23', 'S23', 'W24', 'S24'];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">YC AI Startup Explorer</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Discover Y Combinator's AI-focused startups
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              <input
                type="text"
                placeholder="Search YC startups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
              />
            </div>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
            >
              <option value="">All Batches</option>
              {batches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
            >
              <option value="">All Categories</option>
              {aiCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Showing <span className="font-bold text-light-text dark:text-dark-text">{filteredStartups.length}</span> startups
          </div>
        </motion.div>

        {/* Startup Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStartups.map((startup, index) => (
            <motion.div
              key={startup.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedStartup(startup)}
              className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift cursor-pointer group relative overflow-hidden"
            >
              {/* YC Badge */}
              <div className="absolute top-4 right-4 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                {startup.batch}
              </div>

              {/* Logo */}
              <div className="text-5xl mb-4 text-center group-hover:scale-110 transition-transform">
                {startup.logo}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-center mb-2">{startup.name}</h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center mb-4 line-clamp-2">
                {startup.description}
              </p>

              {/* Founders */}
              {startup.founders && (
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary text-center mb-3">
                  {startup.founders.join(', ')}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1 justify-center mb-4">
                {startup.category.slice(0, 3).map(cat => (
                  <span
                    key={cat}
                    className="px-2 py-1 rounded-full text-xs bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <button className="w-full py-2 bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark rounded-lg font-medium hover:bg-primary-light hover:text-white dark:hover:bg-primary-dark transition-all">
                View Profile
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedStartup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStartup(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-light-border dark:border-dark-border"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedStartup(null)}
                className="absolute top-4 right-4 p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="flex items-start gap-6 mb-8">
                <div className="text-6xl">{selectedStartup.logo}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold">{selectedStartup.name}</h2>
                    {selectedStartup.batch && (
                      <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded">
                        YC {selectedStartup.batch}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedStartup.category.map(cat => (
                      <span
                        key={cat}
                        className="px-3 py-1 rounded-full text-sm bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {selectedStartup.website && (
                      <a
                        href={selectedStartup.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    <button className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors">
                      <Twitter className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* About */}
              <section className="mb-8">
                <h3 className="text-xl font-bold mb-3">About</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                  {selectedStartup.description}
                </p>
              </section>

              {/* Founders */}
              {selectedStartup.founders && (
                <section className="mb-8">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Founders
                  </h3>
                  <div className="space-y-2">
                    {selectedStartup.founders.map(founder => (
                      <div key={founder} className="flex items-center gap-3 p-3 rounded-lg bg-light-bg dark:bg-dark-bg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-insight-light flex items-center justify-center text-white font-bold">
                          {founder.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{founder}</div>
                          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Co-Founder</div>
                        </div>
                        <button className="p-2 hover:bg-light-card dark:hover:bg-dark-card rounded-lg transition-colors">
                          <Linkedin className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {selectedStartup.teamSize && (
                    <div className="mt-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      Team size: {selectedStartup.teamSize} people
                    </div>
                  )}
                </section>
              )}

              {/* Funding */}
              <section className="mb-8">
                <h3 className="text-xl font-bold mb-3">Funding</h3>
                <div className="glass-card rounded-lg p-4 border border-light-border dark:border-dark-border">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Latest Round</span>
                    <span className="font-bold">{selectedStartup.fundingRound}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Amount Raised</span>
                    <span className="font-bold text-lg text-success-light dark:text-success-dark">{selectedStartup.amount}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Date</span>
                    <span className="font-medium">{selectedStartup.date}</span>
                  </div>
                  <div className="pt-3 border-t border-light-border dark:border-dark-border">
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">Investors</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedStartup.investors.map(investor => (
                        <span
                          key={investor}
                          className="px-3 py-1 rounded-lg bg-light-bg dark:bg-dark-bg text-sm font-medium"
                        >
                          {investor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Button */}
              <button className="w-full py-3 bg-primary-light dark:bg-primary-dark text-white rounded-lg font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2">
                Visit Website
                <ExternalLink className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

