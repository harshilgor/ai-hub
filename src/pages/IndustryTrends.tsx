import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { TrendingUp, DollarSign, Building2, Users, Clock, Activity, Lightbulb, ArrowUpRight, Circle } from 'lucide-react';
import { industryData } from '../data/mockData';

const industries = [
  { id: 'healthcare', name: 'Healthcare AI' },
  { id: 'finance', name: 'Financial AI' },
  { id: 'robotics', name: 'Robotics & Automation' },
  { id: 'cybersecurity', name: 'Security & Privacy' },
  { id: 'education', name: 'Education Tech' },
  { id: 'infrastructure', name: 'Infrastructure AI' },
  { id: 'creative', name: 'Creative & Design' },
];

export default function IndustryTrends() {
  const { industry: urlIndustry } = useParams();
  const [selectedIndustry, setSelectedIndustry] = useState(urlIndustry || 'healthcare');

  const industry = industries.find(i => i.id === selectedIndustry);
  const data = industryData[selectedIndustry as keyof typeof industryData] || industryData.healthcare;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-3">Industry Intelligence</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg">
            Explore AI investment trends across key sectors
          </p>
        </motion.div>

        {/* Industry Selector - Minimal Pills */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-wrap gap-2">
            {industries.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedIndustry === ind.id
                    ? 'bg-light-text dark:bg-dark-text text-light-bg dark:text-dark-bg'
                    : 'bg-light-card dark:bg-dark-card text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text border border-light-border dark:border-dark-border'
                }`}
              >
                {ind.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          key={selectedIndustry}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-light-card dark:bg-dark-card rounded-xl p-6 border border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-light-text dark:text-dark-text" />
              </div>
              <div className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                Total Funding
              </div>
            </div>
            <div className="text-3xl font-bold">{data.totalFunding}</div>
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
              This year
            </div>
          </div>

          <div className="bg-light-card dark:bg-dark-card rounded-xl p-6 border border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-light-text dark:text-dark-text" />
              </div>
              <div className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                Active Startups
              </div>
            </div>
            <div className="text-3xl font-bold">{data.startupCount}</div>
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
              In this sector
            </div>
          </div>

          <div className="bg-light-card dark:bg-dark-card rounded-xl p-6 border border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-light-text dark:text-dark-text" />
              </div>
              <div className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                Growth Rate
              </div>
            </div>
            <div className="text-3xl font-bold">{data.growthRate}</div>
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
              Year over year
            </div>
          </div>

          <div className="bg-light-card dark:bg-dark-card rounded-xl p-6 border border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-light-bg dark:bg-dark-bg flex items-center justify-center">
                <Users className="w-5 h-5 text-light-text dark:text-dark-text" />
              </div>
              <div className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                Top Investor
              </div>
            </div>
            <div className="text-xl font-bold">{data.topInvestor}</div>
            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
              Leading the sector
            </div>
          </div>
        </motion.div>

        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-light-card dark:bg-dark-card rounded-xl p-8 border border-light-border dark:border-dark-border mb-12"
        >
          <h2 className="text-xl font-bold mb-6">Market Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Circle className="w-2 h-2 fill-current" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-light-text-secondary dark:text-dark-text-secondary">
                  What's Hot
                </h3>
              </div>
              <p className="text-sm leading-relaxed">
                {data.insights[0]}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Circle className="w-2 h-2 fill-current" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-light-text-secondary dark:text-dark-text-secondary">
                  Growth Areas
                </h3>
              </div>
              <p className="text-sm leading-relaxed">
                {data.insights[1]}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Circle className="w-2 h-2 fill-current" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-light-text-secondary dark:text-dark-text-secondary">
                  Innovation
                </h3>
              </div>
              <p className="text-sm leading-relaxed">
                {data.insights[2]}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Leading Startups */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Leading Companies</h2>
            <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
              <Activity className="w-4 h-4" />
              <span>Sorted by funding amount</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topStartups.map((startup, index) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="group bg-light-card dark:bg-dark-card rounded-xl p-6 border border-light-border dark:border-dark-border hover:border-light-text dark:hover:border-dark-text transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-light-text dark:group-hover:text-dark-text transition-colors">
                      {startup.name}
                    </h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2 leading-relaxed">
                      {startup.description}
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
                  <div>
                    <div className="text-2xl font-bold">{startup.amount}</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                      {startup.fundingRound} • {startup.date}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Market Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Timeline of Major Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-light-card dark:bg-dark-card rounded-xl p-8 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold mb-8">Recent Activity</h3>
            <div className="space-y-6">
              {data.topStartups.slice(0, 4).map((startup) => (
                <div key={startup.id} className="relative pl-6 border-l border-light-border dark:border-dark-border">
                  <div className="absolute left-0 top-1 w-1.5 h-1.5 rounded-full bg-light-text dark:bg-dark-text -translate-x-[4px]"></div>
                  <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2">
                    {startup.date}
                  </div>
                  <div className="font-semibold mb-1">{startup.name}</div>
                  <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {startup.amount} • {startup.fundingRound}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Investors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-light-card dark:bg-dark-card rounded-xl p-8 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold mb-8">Active Investors</h3>
            <div className="space-y-3">
              {['Sequoia Capital', 'Andreessen Horowitz', 'SoftBank Vision', 'General Catalyst', 'Accel'].map((investor, index) => (
                <div
                  key={investor}
                  className="flex items-center justify-between py-3 border-b border-light-border dark:border-dark-border last:border-0"
                >
                  <div>
                    <div className="font-semibold">{investor}</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                      {8 - index} investments
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trending Topics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-light-card dark:bg-dark-card rounded-xl p-8 border border-light-border dark:border-dark-border"
        >
          <h3 className="text-xl font-bold mb-6">Trending Topics</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'Deep Learning',
              'Diagnostics',
              'Clinical AI',
              'Drug Discovery',
              'Medical Imaging',
              'Patient Care',
              'Genomics',
              'Telemedicine',
              'Predictive Analytics',
              'Medical Records',
              'Biotech AI',
              'Radiology AI',
            ].map((keyword) => (
              <span
                key={keyword}
                className="px-4 py-2 rounded-full text-sm bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border border-light-border dark:border-dark-border hover:border-light-text dark:hover:border-dark-text transition-colors cursor-pointer"
              >
                {keyword}
              </span>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

