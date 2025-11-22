import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Calendar,
  Filter,
  ArrowUpRight,
  Eye,
  Users
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Mock data for Research Paper Trends
const researchPaperData = [
  { month: 'Jan', papers: 1240, citations: 8500 },
  { month: 'Feb', papers: 1380, citations: 9200 },
  { month: 'Mar', papers: 1520, citations: 10100 },
  { month: 'Apr', papers: 1450, citations: 9800 },
  { month: 'May', papers: 1680, citations: 11200 },
  { month: 'Jun', papers: 1750, citations: 11800 },
  { month: 'Jul', papers: 1890, citations: 12500 },
  { month: 'Aug', papers: 1920, citations: 13200 },
  { month: 'Sep', papers: 2050, citations: 14100 },
  { month: 'Oct', papers: 2180, citations: 15200 },
  { month: 'Nov', papers: 2100, citations: 14800 },
  { month: 'Dec', papers: 2250, citations: 16200 },
];

const topResearchPapers = [
  {
    id: '1',
    title: 'Transformer Architecture Improvements for Long Context',
    authors: 'Smith et al.',
    citations: 1240,
    date: '2025-11-20',
    field: 'NLP'
  },
  {
    id: '2',
    title: 'Self-Supervised Learning for Computer Vision',
    authors: 'Johnson et al.',
    citations: 980,
    date: '2025-11-18',
    field: 'Computer Vision'
  },
  {
    id: '3',
    title: 'Reinforcement Learning in Multi-Agent Systems',
    authors: 'Williams et al.',
    citations: 756,
    date: '2025-11-15',
    field: 'Agents'
  },
  {
    id: '4',
    title: 'Efficient Fine-Tuning of Large Language Models',
    authors: 'Brown et al.',
    citations: 642,
    date: '2025-11-12',
    field: 'LLMs'
  },
  {
    id: '5',
    title: 'Diffusion Models for Medical Imaging',
    authors: 'Davis et al.',
    citations: 589,
    date: '2025-11-10',
    field: 'Healthcare AI'
  },
  {
    id: '6',
    title: 'Robotic Manipulation with Foundation Models',
    authors: 'Miller et al.',
    citations: 521,
    date: '2025-11-08',
    field: 'Robotics'
  },
];

// Mock data for Investment Trends
const investmentData = [
  { month: 'Jan', funding: 4.2, deals: 45 },
  { month: 'Feb', funding: 4.8, deals: 52 },
  { month: 'Mar', funding: 5.1, deals: 58 },
  { month: 'Apr', funding: 4.9, deals: 55 },
  { month: 'May', funding: 5.6, deals: 62 },
  { month: 'Jun', funding: 5.9, deals: 68 },
  { month: 'Jul', funding: 6.2, deals: 71 },
  { month: 'Aug', funding: 6.5, deals: 75 },
  { month: 'Sep', funding: 6.8, deals: 82 },
  { month: 'Oct', funding: 7.1, deals: 88 },
  { month: 'Nov', funding: 6.9, deals: 85 },
  { month: 'Dec', funding: 7.4, deals: 92 },
];

const topInvestments = [
  {
    id: '1',
    company: 'NeuralForge AI',
    amount: '$125M',
    round: 'Series B',
    date: '2025-11-21',
    category: 'LLMs',
    investors: ['Sequoia', 'a16z']
  },
  {
    id: '2',
    company: 'VisionTech Systems',
    amount: '$89M',
    round: 'Series A',
    date: '2025-11-19',
    category: 'Computer Vision',
    investors: ['Accel', 'Index']
  },
  {
    id: '3',
    company: 'RoboDynamics',
    amount: '$67M',
    round: 'Series A',
    date: '2025-11-17',
    category: 'Robotics',
    investors: ['GV', 'Lux']
  },
  {
    id: '4',
    company: 'MedAI Solutions',
    amount: '$54M',
    round: 'Seed',
    date: '2025-11-14',
    category: 'Healthcare AI',
    investors: ['YC', 'First Round']
  },
  {
    id: '5',
    company: 'AgentFlow',
    amount: '$42M',
    round: 'Series A',
    date: '2025-11-12',
    category: 'Agents',
    investors: ['Bessemer', 'NEA']
  },
  {
    id: '6',
    company: 'DataMind AI',
    amount: '$38M',
    round: 'Seed',
    date: '2025-11-09',
    category: 'NLP',
    investors: ['YC', 'SV Angel']
  },
];

// Research Paper Trends Section Component
function ResearchPaperTrendsSection() {
  const [dateRange, setDateRange] = useState('12m');
  const [field, setField] = useState('all');

  const researchMetrics = [
    { label: 'Total Papers', value: '2,250', change: '+12%', positive: true },
    { label: 'Avg Citations', value: '162', change: '+8%', positive: true },
    { label: 'Top Field', value: 'NLP', change: '28%', positive: true },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Header with Filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Research Paper Trends
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI research publication activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
            <option value="all">All time</option>
          </select>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Fields</option>
            <option value="nlp">NLP</option>
            <option value="cv">Computer Vision</option>
            <option value="llm">LLMs</option>
            <option value="agents">Agents</option>
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {researchMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30"
          >
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{metric.label}</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {metric.value}
            </div>
            <div className={`text-xs font-medium ${metric.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {metric.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={researchPaperData}>
            <defs>
              <linearGradient id="colorPapers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="papers"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPapers)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Papers List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Top Papers This Month
          </h3>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {topResearchPapers.map((paper, index) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer"
              title={`${paper.title} - ${paper.authors} - ${paper.citations} citations`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                      {paper.field}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {paper.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {paper.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {paper.authors}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{paper.citations.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Investment Trends Section Component
function InvestmentTrendsSection() {
  const [dateRange, setDateRange] = useState('12m');
  const [category, setCategory] = useState('all');

  const investmentMetrics = [
    { label: 'Total Funding', value: '$7.4B', change: '+15%', positive: true },
    { label: 'Deals Closed', value: '92', change: '+8%', positive: true },
    { label: 'Avg Deal Size', value: '$80M', change: '+12%', positive: true },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Header with Filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Investment Trends
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI startup funding activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
            <option value="all">All time</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Categories</option>
            <option value="llm">LLMs</option>
            <option value="cv">Computer Vision</option>
            <option value="robotics">Robotics</option>
            <option value="healthcare">Healthcare AI</option>
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {investmentMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900/30"
          >
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{metric.label}</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {metric.value}
            </div>
            <div className={`text-xs font-medium ${metric.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {metric.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={investmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="funding"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ fill: '#10B981', r: 3 }}
              name="Funding ($B)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="deals"
              stroke="#059669"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ fill: '#059669', r: 3 }}
              name="Deals"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Investments List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Recent Major Deals
          </h3>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {topInvestments.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all cursor-pointer"
              title={`${deal.company} - ${deal.amount} ${deal.round} - ${deal.investors.join(', ')}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                      {deal.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {deal.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {deal.company}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {deal.round}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {deal.investors.join(', ')}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-bold text-green-600 dark:text-green-400 flex-shrink-0">
                  {deal.amount}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Trends Dashboard Component
export default function TrendsDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Trends Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Research activity and investment patterns in AI
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Research Paper Trends Section */}
          <ResearchPaperTrendsSection />

          {/* Investment Trends Section */}
          <InvestmentTrendsSection />
        </div>
      </div>
    </div>
  );
}
