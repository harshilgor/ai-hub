import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Bookmark, Share2, ExternalLink, Filter, Lightbulb, Link2, FileText, Newspaper, Users, Zap, Target, ArrowRight } from 'lucide-react';
import { 
  mockStartups, 
  trendingCategories, 
  mockInvestors, 
  aiCategories,
  industryInsights,
  technologyTrends,
  investorActivity,
  mockPapers,
  newsItems
} from '../data/mockData';

export default function HomePage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  // Debug: Verify data is loaded
  console.log('Industry Insights:', industryInsights);
  console.log('Technology Trends:', technologyTrends);
  console.log('Investor Activity:', investorActivity);

  const filteredStartups = mockStartups.filter(startup => {
    if (selectedCategories.length > 0 && !startup.category.some(cat => selectedCategories.includes(cat))) {
      return false;
    }
    if (selectedStages.length > 0 && !selectedStages.includes(startup.fundingRound)) {
      return false;
    }
    return true;
  });

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleStage = (stage: string) => {
    setSelectedStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'paper': return <FileText className="w-4 h-4" />;
      case 'news': return <Newspaper className="w-4 h-4" />;
      case 'insider': return <Users className="w-4 h-4" />;
      case 'company': return <Zap className="w-4 h-4" />;
      case 'investor': return <TrendingUp className="w-4 h-4" />;
      default: return <Link2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-light/10 via-insight-light/10 to-success-light/10 dark:from-primary-dark/10 dark:via-insight-dark/10 dark:to-success-dark/10 border-b border-light-border dark:border-dark-border">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-light to-insight-light bg-clip-text text-transparent">
              The AI Investment Intelligence Hub
            </h1>
            <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary mb-8">
              Connect the dots: Research papers, news, insider moves, and funding trends
            </p>

            {/* Live Stats */}
            <div className="flex flex-wrap justify-center gap-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary-light dark:text-primary-dark">487</div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">AI startups funded this month</div>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-success-light dark:text-success-dark">$12.3B</div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Raised this quarter</div>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-insight-light dark:text-insight-dark">23</div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">New papers today</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Industry Insights Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-insight-light dark:text-insight-dark" />
            <h2 className="text-3xl font-bold">Industry Insights</h2>
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-primary-light/20 text-primary-light dark:text-primary-dark">
              {industryInsights.length} insights
            </span>
          </div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
            Key events, their connections to research, news, and insider moves
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {industryInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{insight.title}</h3>
                      {insight.impact === 'high' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
                          High Impact
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                      {insight.event}
                    </p>
                    <p className="text-sm text-light-text dark:text-dark-text">
                      {insight.explanation}
                    </p>
                  </div>
                </div>

                {/* Connections */}
                <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-primary-light dark:text-primary-dark" />
                    <span className="text-sm font-medium">Connections:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insight.connections.map((conn, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-light/10 dark:bg-primary-dark/10 text-xs"
                      >
                        {getConnectionIcon(conn.type)}
                        <span className="text-primary-light dark:text-primary-dark">{conn.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {insight.date}
                  </span>
                  <button className="text-xs text-primary-light dark:text-primary-dark hover:underline flex items-center gap-1">
                    View in Knowledge Graph
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Technology Trends & Next Big Things */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-success-light dark:text-success-dark" />
            <h2 className="text-3xl font-bold">Technology Trends & Next Big Industries</h2>
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-success-light/20 text-success-light dark:text-success-dark">
              {technologyTrends.length} trends
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {technologyTrends.map((trend, index) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift ${
                  trend.nextBigThing ? 'ring-2 ring-success-light dark:ring-success-dark' : ''
                }`}
              >
                {trend.nextBigThing && (
                  <div className="mb-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-success-light/20 text-success-light dark:text-success-dark">
                      🚀 Next Big Thing
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold mb-2">{trend.name}</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                  {trend.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">Growth:</span>
                    <span className="font-bold text-success-light dark:text-success-dark">
                      +{trend.growthRate}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">Funding:</span>
                    <span className="font-bold">{trend.fundingAmount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">Deals:</span>
                    <span className="font-bold">{trend.dealCount}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-light-border dark:border-dark-border">
                  <p className="text-xs text-light-text dark:text-dark-text mb-2 font-medium">
                    Why it's hot:
                  </p>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {trend.whyHot}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* What Smart People Are Doing */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-primary-light dark:text-primary-dark" />
            <h2 className="text-3xl font-bold">What Smart People Are Doing</h2>
            <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-primary-light/20 text-primary-light dark:text-primary-dark">
              {investorActivity.length} activities
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {investorActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">💰</span>
                      <h3 className="text-lg font-bold">{activity.investor}</h3>
                    </div>
                    <p className="text-sm font-medium text-primary-light dark:text-primary-dark mb-1">
                      {activity.action} → {activity.target}
                    </p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {activity.date}
                    </p>
                  </div>
                  {activity.impact === 'high' && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
                      High Impact
                    </span>
                  )}
                </div>
                
                <div className="pt-4 border-t border-light-border dark:border-dark-border">
                  <p className="text-xs font-medium mb-2 text-light-text dark:text-dark-text">
                    Reasoning:
                  </p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {activity.reasoning}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Filters</h3>
              </div>

              {/* Funding Stage */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">Funding Stage</h4>
                <div className="space-y-2">
                  {['Seed', 'Series A', 'Series B', 'Series C'].map(stage => (
                    <label key={stage} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedStages.includes(stage)}
                        onChange={() => toggleStage(stage)}
                        className="rounded border-gray-300 text-primary-light focus:ring-primary-light"
                      />
                      <span className="text-sm group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors">
                        {stage}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* AI Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">AI Categories</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {aiCategories.map(category => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="rounded border-gray-300 text-primary-light focus:ring-primary-light"
                      />
                      <span className="text-sm group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors">
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {(selectedCategories.length > 0 || selectedStages.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedStages([]);
                  }}
                  className="text-sm text-primary-light dark:text-primary-dark hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </motion.aside>

          {/* Main Feed - Recently Funded Companies */}
          <main className="lg:col-span-6">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-primary-light dark:text-primary-dark" />
              <h2 className="text-2xl font-bold">Recently Funded Companies</h2>
            </div>
            <div className="space-y-4">
              {filteredStartups.map((startup, index) => (
                <motion.div
                  key={startup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{startup.logo}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{startup.name}</h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {startup.category.map(cat => (
                              <span
                                key={cat}
                                className="px-2 py-1 rounded-full text-xs font-medium bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark"
                              >
                                {cat}
                              </span>
                            ))}
                            {startup.technologyTrend && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-success-light/10 dark:bg-success-dark/10 text-success-light dark:text-success-dark">
                                {startup.technologyTrend}
                              </span>
                            )}
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

                      <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
                        {startup.description}
                      </p>

                      {/* Why They Got Funded */}
                      {startup.fundingRationale && (
                        <div className="mb-4 p-4 rounded-lg bg-insight-light/10 dark:bg-insight-dark/10 border border-insight-light/20 dark:border-insight-dark/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-insight-light dark:text-insight-dark" />
                            <span className="text-sm font-medium text-insight-light dark:text-insight-dark">
                              Why they got funded:
                            </span>
                          </div>
                          <p className="text-sm text-light-text dark:text-dark-text">
                            {startup.fundingRationale}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                        <span className="px-3 py-1 rounded-lg bg-success-light/10 dark:bg-success-dark/10 text-success-light dark:text-success-dark font-medium">
                          {startup.fundingRound}
                        </span>
                        <span className="font-bold text-lg">{startup.amount}</span>
                        <span className="text-light-text-secondary dark:text-dark-text-secondary">{startup.date}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                        <span className="font-medium">Led by:</span>
                        <span className="text-light-text dark:text-dark-text font-medium">{startup.leadInvestor}</span>
                        {startup.investors.length > 1 && (
                          <span>+ {startup.investors.length - 1} others</span>
                        )}
                      </div>

                      <button className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform font-medium flex items-center gap-2">
                        View Deep Dive & Connections
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </main>

          {/* Right Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="space-y-6 sticky top-24">
              {/* What's Trending */}
              <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🔥</span>
                  <h3 className="font-semibold text-lg">What's Trending Now</h3>
                </div>
                <div className="space-y-4">
                  {trendingCategories.map((category, index) => (
                    <div key={category.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{category.name}</span>
                        <span className="text-sm font-bold text-success-light dark:text-success-dark">
                          +{category.growth}%
                        </span>
                      </div>
                      <div className="w-full bg-light-bg dark:bg-dark-bg rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${category.growth}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="h-2 rounded-full bg-gradient-to-r from-primary-light to-success-light"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Investors */}
              <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">Top Investors This Month</h3>
                </div>
                <div className="space-y-3">
                  {mockInvestors.map((investor, index) => (
                    <div key={investor.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors cursor-pointer">
                      <div className="text-2xl">{investor.logo}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{investor.name}</div>
                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          {investor.deals} deals · {investor.totalInvested}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-light-text-secondary dark:text-dark-text-secondary">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
