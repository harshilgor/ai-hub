import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { TrendingUp, DollarSign, Building2, Users, Sparkles, FileText, Lightbulb } from 'lucide-react';
import { industryData } from '../data/mockData';

const industries = [
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#10B981' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#F59E0B' },
  { id: 'robotics', name: 'Robotics', icon: '🤖', color: '#8B5CF6' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒', color: '#EF4444' },
  { id: 'education', name: 'Education', icon: '📚', color: '#3B82F6' },
  { id: 'infrastructure', name: 'Infrastructure', icon: '🛠️', color: '#6B7280' },
  { id: 'creative', name: 'Creative Tools', icon: '🎨', color: '#EC4899' },
];

export default function IndustryTrends() {
  const { industry: urlIndustry } = useParams();
  const [selectedIndustry, setSelectedIndustry] = useState(urlIndustry || 'healthcare');

  const industry = industries.find(i => i.id === selectedIndustry);
  const data = industryData[selectedIndustry as keyof typeof industryData] || industryData.healthcare;

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Industry Selector */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3 mb-6">
            {industries.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  selectedIndustry === ind.id
                    ? 'bg-primary-light dark:bg-primary-dark text-white scale-105 shadow-lg'
                    : 'glass-card border border-light-border dark:border-dark-border hover:scale-105'
                }`}
              >
                <span className="text-xl">{ind.icon}</span>
                <span className="font-medium">{ind.name}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Hero Banner */}
        <motion.div
          key={selectedIndustry}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 mb-8 border border-light-border dark:border-dark-border"
          style={{
            background: `linear-gradient(135deg, ${industry?.color}15 0%, transparent 100%)`,
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{industry?.icon}</div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{industry?.name} AI</h1>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                Comprehensive insights into AI innovation in {industry?.name.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-light dark:text-success-dark mb-1">
                {data.totalFunding}
              </div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Total Funding This Year
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-light dark:text-primary-dark mb-1">
                {data.startupCount}
              </div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Active Startups
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-insight-light dark:text-insight-dark mb-1">
                {data.growthRate}
              </div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                YoY Growth Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold mb-1">{data.topInvestor}</div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Top Investor
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border bg-gradient-to-br from-red-500/10 to-orange-500/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🔥</span>
              <h3 className="font-bold">What's Hot</h3>
            </div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {data.insights[0]}
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <h3 className="font-bold">Growth Areas</h3>
            </div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {data.insights[1]}
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-6 h-6 text-purple-500" />
              <h3 className="font-bold">Innovation Spotlight</h3>
            </div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {data.insights[2]}
            </p>
          </div>
        </motion.div>

        {/* Leading Startups */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Leading Startups
            </h2>
            <select className="px-4 py-2 rounded-lg glass-card border border-light-border dark:border-dark-border">
              <option>By Funding</option>
              <option>By Recency</option>
              <option>By Growth</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.topStartups.map((startup, index) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift cursor-pointer"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{startup.logo}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{startup.name}</h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2">
                      {startup.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-success-light dark:text-success-dark">
                    {startup.amount}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark">
                    {startup.fundingRound}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Market Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeline of Major Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Major Funding Events (2025)
            </h3>
            <div className="space-y-6">
              {data.topStartups.slice(0, 4).map((startup, index) => (
                <div key={startup.id} className="relative pl-8 border-l-2 border-primary-light/30 dark:border-primary-dark/30">
                  <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-primary-light dark:bg-primary-dark -translate-x-[9px] border-4 border-light-card dark:border-dark-card"></div>
                  <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    {startup.date}
                  </div>
                  <div className="font-bold mb-1">{startup.name}</div>
                  <div className="text-sm">
                    Raised <span className="font-bold text-success-light dark:text-success-dark">{startup.amount}</span> in {startup.fundingRound}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Investors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Who's Investing in {industry?.name} AI
            </h3>
            <div className="space-y-4">
              {['Sequoia Capital', 'Andreessen Horowitz', 'SoftBank Vision', 'General Catalyst', 'Accel'].map((investor, index) => (
                <div
                  key={investor}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-light to-insight-light flex items-center justify-center text-white font-bold text-xl">
                    {investor.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{investor}</div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {8 - index} deals in {industry?.name}
                    </div>
                  </div>
                  <DollarSign className="w-5 h-5 text-success-light dark:text-success-dark" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trending Keywords */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border mb-8"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Trending Keywords in {industry?.name} AI
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { text: 'Deep Learning', size: 'text-2xl' },
              { text: 'Diagnostics', size: 'text-xl' },
              { text: 'Clinical AI', size: 'text-3xl' },
              { text: 'Drug Discovery', size: 'text-lg' },
              { text: 'Medical Imaging', size: 'text-2xl' },
              { text: 'Patient Care', size: 'text-xl' },
              { text: 'Genomics', size: 'text-lg' },
              { text: 'Telemedicine', size: 'text-xl' },
              { text: 'Predictive Analytics', size: 'text-2xl' },
            ].map((keyword) => (
              <button
                key={keyword.text}
                className={`${keyword.size} font-bold px-4 py-2 rounded-lg hover:scale-110 transition-all`}
                style={{ color: industry?.color }}
              >
                {keyword.text}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-xl p-8 border border-light-border dark:border-dark-border text-center bg-gradient-to-r from-primary-light/10 via-insight-light/10 to-success-light/10"
        >
          <h3 className="text-2xl font-bold mb-4">
            Explore {industry?.name} AI in the Knowledge Graph
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
            Visualize connections between startups, research, and investors in this space
          </p>
          <button className="px-6 py-3 bg-primary-light dark:bg-primary-dark text-white rounded-lg font-medium hover:scale-105 transition-transform">
            Open in Graph Builder
          </button>
        </motion.div>
      </div>
    </div>
  );
}

