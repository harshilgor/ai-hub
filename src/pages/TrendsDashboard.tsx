import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Rocket, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { monthlyFundingData, categoryDistribution, trendingCategories, mockInvestors } from '../data/mockData';

export default function TrendsDashboard() {
  const stats = [
    {
      icon: DollarSign,
      label: 'Total AI Funding This Month',
      value: '$5.4B',
      change: '+23%',
      positive: true,
    },
    {
      icon: Rocket,
      label: 'Most Active Category',
      value: 'LLMs',
      change: '42 deals',
      positive: true,
    },
    {
      icon: Target,
      label: 'Average Deal Size',
      value: '$18.2M',
      change: '+15%',
      positive: true,
    },
    {
      icon: TrendingUp,
      label: 'New AI Startups',
      value: '127',
      change: '+8%',
      positive: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Insights & Trends Dashboard</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Real-time AI investment intelligence and analytics
          </p>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary-light/10 dark:bg-primary-dark/10">
                  <stat.icon className="w-6 h-6 text-primary-light dark:text-primary-dark" />
                </div>
                <span className={`text-sm font-bold ${stat.positive ? 'text-success-light dark:text-success-dark' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funding Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold mb-4">AI Funding Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryDistribution.map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                  <span className="text-sm">{category.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Funding Trend Line Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold mb-4">Funding Trend (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyFundingData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  name="Funding ($B)"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Active Investors Leaderboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold mb-4">Most Active AI Investors</h3>
            <div className="space-y-3">
              {mockInvestors.map((investor, index) => (
                <div
                  key={investor.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold text-light-text-secondary dark:text-dark-text-secondary w-8">
                    #{index + 1}
                  </div>
                  <div className="text-3xl">{investor.logo}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{investor.name}</div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {investor.deals} deals
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-success-light dark:text-success-dark">
                      {investor.totalInvested}
                    </div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      Total Invested
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Emerging Categories Bar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold mb-4">Fastest Growing Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendingCategories} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="growth" fill="#10B981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* What's Hot Insights */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 glass-card rounded-xl p-6 border border-light-border dark:border-dark-border bg-gradient-to-br from-primary-light/5 via-insight-light/5 to-success-light/5"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className="text-xl font-bold">What's Hot Right Now</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-glass-light backdrop-blur">
                <div className="text-3xl font-bold text-success-light dark:text-success-dark mb-2">+45%</div>
                <p className="text-sm">Healthcare AI funding up significantly this month, driven by diagnostic tools and drug discovery platforms</p>
              </div>
              <div className="p-4 rounded-lg bg-glass-light backdrop-blur">
                <div className="text-3xl font-bold text-primary-light dark:text-primary-dark mb-2">🚀</div>
                <p className="text-sm">OpenAI-style LLM infrastructure seeing major investor interest with 15 new deals this quarter</p>
              </div>
              <div className="p-4 rounded-lg bg-glass-light backdrop-blur">
                <div className="text-3xl font-bold text-insight-light dark:text-insight-dark mb-2">3</div>
                <p className="text-sm">New robotics unicorns emerged in Q4, valued at combined $8.2B in autonomous systems</p>
              </div>
            </div>
          </motion.div>

          {/* Deal Volume Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2 glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
          >
            <h3 className="text-xl font-bold mb-4">Monthly Deal Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyFundingData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="deals" fill="#8B5CF6" radius={[8, 8, 0, 0]} name="Number of Deals" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

