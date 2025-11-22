import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Calendar,
  Filter,
  ArrowUpRight,
  Eye,
  Users,
  Loader2
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
import { fetchPaperTrends, fetchPapers, fetchPaperStats, type Paper } from '../services/api';

const fieldColors = {
  'NLP': '#3B82F6',
  'Computer Vision': '#8B5CF6',
  'LLMs': '#06B6D4',
  'Agents': '#10B981',
  'Robotics': '#F59E0B',
  'Healthcare AI': '#EF4444',
};

// Helper function to get field from paper tags/title
function getPaperField(paper: Paper): string {
  const text = (paper.title + ' ' + (paper.summary || '')).toLowerCase();
  const tags = (paper.tags || []).map(t => t.toLowerCase());
  
  if (tags.some(t => t.includes('nlp') || t.includes('natural language')) ||
      text.includes('language model') || text.includes('translation') || 
      text.includes('text processing') || text.includes('bert') || text.includes('gpt')) {
    return 'NLP';
  }
  if (tags.some(t => t.includes('vision') || t.includes('computer vision') || t.includes('cv')) ||
      text.includes('image') || text.includes('visual') || text.includes('detection') ||
      text.includes('segmentation') || text.includes('recognition')) {
    return 'Computer Vision';
  }
  if (tags.some(t => t.includes('llm') || t.includes('language model')) ||
      text.includes('large language model') || text.includes('gpt') || 
      text.includes('bert') || text.includes('transformer') || text.includes('pretraining')) {
    return 'LLMs';
  }
  if (tags.some(t => t.includes('agent') || t.includes('reinforcement')) ||
      text.includes('agent') || text.includes('reinforcement learning') ||
      text.includes('planning') || text.includes('reasoning') || text.includes('decision')) {
    return 'Agents';
  }
  if (tags.some(t => t.includes('robot') || t.includes('robotics')) ||
      text.includes('robot') || text.includes('autonomous') || 
      text.includes('manipulation') || text.includes('navigation') || text.includes('control')) {
    return 'Robotics';
  }
  if (tags.some(t => t.includes('health') || t.includes('medical') || t.includes('healthcare')) ||
      text.includes('medical') || text.includes('health') || text.includes('diagnosis') ||
      text.includes('clinical') || text.includes('patient') || text.includes('disease') || text.includes('drug')) {
    return 'Healthcare AI';
  }
  return 'Other';
}

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
  const [loading, setLoading] = useState(true);
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [topPapers, setTopPapers] = useState<Paper[]>([]);
  const [metrics, setMetrics] = useState({
    totalPapers: 0,
    avgCitations: 0,
    topField: 'NLP'
  });
  const [stats, setStats] = useState<Record<string, number>>({});

  // Map dateRange to period for API
  const getPeriodForAPI = (range: string) => {
    switch (range) {
      case '3m': return '3m';
      case '6m': return '6m';
      case '12m': return '12m';
      case 'all': return 'all';
      default: return '12m';
    }
  };

  // Fetch trends and papers data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const period = getPeriodForAPI(dateRange);
        
        // Fetch trends data
        const trendsResponse = await fetchPaperTrends(period, 'all');
        setTrendsData(trendsResponse.trends || []);

        // Fetch stats for metrics (use same period format)
        const statsResponse = await fetchPaperStats(period);
        setStats(statsResponse.industryStats || {});

        // Fetch top papers (sorted by citations)
        const papersResponse = await fetchPapers({ limit: 100 });
        const allPapers = papersResponse.papers || [];
        
        // Filter by date range
        const now = new Date();
        let cutoffDate: Date | null = null;
        if (period !== 'all') {
          switch (period) {
            case '3m':
              cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
              break;
            case '6m':
              cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
              break;
            case '12m':
              cutoffDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
              break;
          }
        }
        
        const filteredPapers = cutoffDate
          ? allPapers.filter(p => {
              const paperDate = new Date(p.published || p.updated || 0);
              return paperDate >= cutoffDate!;
            })
          : allPapers;

        // Sort by citations and get top 6
        const sortedPapers = filteredPapers
          .sort((a, b) => (b.citations || 0) - (a.citations || 0))
          .slice(0, 6);
        setTopPapers(sortedPapers);

        // Calculate metrics
        const totalPapers = filteredPapers.length;
        const avgCitations = filteredPapers.length > 0
          ? Math.round(filteredPapers.reduce((sum, p) => sum + (p.citations || 0), 0) / filteredPapers.length)
          : 0;
        
        // Find top field from stats
        const topFieldEntry = Object.entries(statsResponse.industryStats || {})
          .sort(([, a], [, b]) => (b as number) - (a as number))[0];
        const topField = topFieldEntry ? topFieldEntry[0] : 'NLP';

        setMetrics({
          totalPapers,
          avgCitations,
          topField
        });
      } catch (error) {
        console.error('Error loading trends data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange]);

  const researchMetrics = [
    { 
      label: 'Total Papers', 
      value: metrics.totalPapers.toLocaleString(), 
      change: '', 
      positive: true 
    },
    { 
      label: 'Avg Citations', 
      value: metrics.avgCitations.toLocaleString(), 
      change: '', 
      positive: true 
    },
    { 
      label: 'Top Field', 
      value: metrics.topField, 
      change: stats[metrics.topField] ? `${Math.round((stats[metrics.topField] / metrics.totalPapers) * 100)}%` : '', 
      positive: true 
    },
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
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
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
      <div className="mb-6 bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : trendsData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-gray-500">
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '6px', color: '#111827' }}
            />
            <Line
              type="monotone"
              dataKey="NLP"
              stroke={fieldColors.NLP}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="NLP"
            />
            <Line
              type="monotone"
              dataKey="Computer Vision"
              stroke={fieldColors['Computer Vision']}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Computer Vision"
            />
            <Line
              type="monotone"
              dataKey="LLMs"
              stroke={fieldColors.LLMs}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="LLMs"
            />
            <Line
              type="monotone"
              dataKey="Agents"
              stroke={fieldColors.Agents}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Agents"
            />
            <Line
              type="monotone"
              dataKey="Robotics"
              stroke={fieldColors.Robotics}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Robotics"
            />
            <Line
              type="monotone"
              dataKey="Healthcare AI"
              stroke={fieldColors['Healthcare AI']}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Healthcare AI"
            />
          </LineChart>
        </ResponsiveContainer>
        )}
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {Object.entries(fieldColors).map(([field, color]) => (
            <div key={field} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{field}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Papers List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Top Papers {dateRange === '3m' ? 'This Quarter' : dateRange === '12m' ? 'This Year' : 'All Time'}
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : topPapers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No papers available
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {topPapers.map((paper, index) => {
              const paperField = getPaperField(paper);
              const paperDate = new Date(paper.published || paper.updated || 0);
              const formattedDate = paperDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
              const authorsDisplay = paper.authors && paper.authors.length > 0
                ? paper.authors.slice(0, 2).join(', ') + (paper.authors.length > 2 ? ' et al.' : '')
                : 'Unknown authors';

              return (
                <motion.div
                  key={paper.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                  onClick={() => window.open(paper.link, '_blank')}
                  title={`${paper.title} - ${authorsDisplay} - ${paper.citations || 0} citations`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                          {paperField}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formattedDate}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {paper.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {authorsDisplay}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{(paper.citations || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
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

  // Note: Investment data is sample/mock data as we don't have investment data in the backend

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Header with Filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Investment Trends
            </h2>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">
              Sample Data
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI startup funding activity (mock data - investment API integration coming soon)
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
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
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
      <div className="mb-6 bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={investmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '6px', color: '#111827' }}
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
              className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
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
    <div className="min-h-screen bg-white dark:bg-gray-950">
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
