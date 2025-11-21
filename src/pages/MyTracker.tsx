import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Bell, Network, FileText, TrendingUp, Settings, Plus, CheckCircle, Clock, X } from 'lucide-react';
import { mockStartups, mockPapers, aiCategories } from '../data/mockData';

type Tab = 'startups' | 'categories' | 'alerts' | 'graphs' | 'reading' | 'learning';

export default function MyTracker() {
  const [activeTab, setActiveTab] = useState<Tab>('startups');

  const tabs = [
    { id: 'startups' as Tab, icon: Bookmark, label: 'Saved Startups' },
    { id: 'categories' as Tab, icon: TrendingUp, label: 'Followed Categories' },
    { id: 'alerts' as Tab, icon: Bell, label: 'My Alerts' },
    { id: 'graphs' as Tab, icon: Network, label: 'Saved Graphs' },
    { id: 'reading' as Tab, icon: FileText, label: 'Reading List' },
    { id: 'learning' as Tab, icon: CheckCircle, label: 'Learning Path' },
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">My AI Intelligence Hub</h1>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                Your personalized AI investment tracking dashboard
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 glass-card border border-light-border dark:border-dark-border rounded-lg hover:scale-105 transition-transform">
              <Settings className="w-5 h-5" />
              <span>Preferences</span>
            </button>
          </div>

          {/* Profile Card */}
          <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border bg-gradient-to-r from-primary-light/10 to-insight-light/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light to-insight-light flex items-center justify-center text-white text-2xl font-bold">
                JD
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">John Doe</h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  AI Investment Analyst
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-light dark:text-primary-dark">127</div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Items Tracked</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 glass-card rounded-xl p-2 border border-light-border dark:border-dark-border">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  activeTab === id
                    ? 'bg-primary-light dark:bg-primary-dark text-white scale-105 shadow-lg'
                    : 'hover:bg-light-bg dark:hover:bg-dark-bg'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'startups' && <SavedStartups />}
          {activeTab === 'categories' && <FollowedCategories />}
          {activeTab === 'alerts' && <MyAlerts />}
          {activeTab === 'graphs' && <SavedGraphs />}
          {activeTab === 'reading' && <ReadingList />}
          {activeTab === 'learning' && <LearningPath />}
        </motion.div>
      </div>
    </div>
  );
}

function SavedStartups() {
  const savedStartups = mockStartups.slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Saved Startups</h2>
        <select className="px-4 py-2 rounded-lg glass-card border border-light-border dark:border-dark-border">
          <option>All Folders</option>
          <option>Healthcare</option>
          <option>Infrastructure</option>
          <option>High Priority</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedStartups.map((startup) => (
          <div
            key={startup.id}
            className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{startup.logo}</div>
              <button className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-bold text-lg mb-2">{startup.name}</h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4 line-clamp-2">
              {startup.description}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-success-light dark:text-success-dark">{startup.amount}</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">Saved 3 days ago</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FollowedCategories() {
  const [followed, setFollowed] = useState(aiCategories.slice(0, 5));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Followed Categories</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform">
          <Plus className="w-5 h-5" />
          Follow More
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {followed.map((category) => (
          <div
            key={category}
            className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-xl mb-2">{category}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 font-medium">3 new</span>
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">since last visit</span>
                </div>
              </div>
              <button className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-light-bg dark:bg-dark-bg">
                <div className="font-medium text-sm mb-1">Latest: NeuralMed raises $15M</div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">2 days ago</div>
              </div>
              <div className="p-3 rounded-lg bg-light-bg dark:bg-dark-bg">
                <div className="font-medium text-sm mb-1">New paper: Medical AI advances</div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">4 days ago</div>
              </div>
            </div>

            <button className="w-full mt-4 py-2 text-sm font-medium text-primary-light dark:text-primary-dark hover:underline">
              View All Updates
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyAlerts() {
  const alerts = [
    { id: '1', type: 'New funding in Healthcare AI', frequency: 'Instant', active: true },
    { id: '2', type: 'OpenAI news & updates', frequency: 'Daily', active: true },
    { id: '3', type: 'Series A rounds > $20M', frequency: 'Weekly', active: true },
    { id: '4', type: 'Sequoia Capital investments', frequency: 'Instant', active: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Alerts</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform">
          <Plus className="w-5 h-5" />
          Create Alert
        </button>
      </div>

      <div className="glass-card rounded-xl border border-light-border dark:border-dark-border overflow-hidden mb-8">
        <div className="divide-y divide-light-border dark:divide-dark-border">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-6 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{alert.type}</h3>
                  <div className="flex items-center gap-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {alert.frequency}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.active
                        ? 'bg-success-light/10 text-success-light dark:bg-success-dark/10 dark:text-success-dark'
                        : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {alert.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 glass-card border border-light-border dark:border-dark-border rounded-lg hover:scale-105 transition-transform">
                    Edit
                  </button>
                  <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border">
        <h3 className="font-bold mb-4">Recent Alerts (Last 7 Days)</h3>
        <div className="space-y-3">
          {[
            { title: 'Healthcare AI startup raised $15M', time: '2 days ago', category: 'Healthcare AI' },
            { title: 'New paper on multimodal models', time: '3 days ago', category: 'Research' },
            { title: 'Series A round: $25M', time: '5 days ago', category: 'Funding' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg cursor-pointer transition-colors">
              <Bell className="w-5 h-5 text-primary-light dark:text-primary-dark" />
              <div className="flex-1">
                <div className="font-medium text-sm">{item.title}</div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{item.time}</div>
              </div>
              <span className="px-2 py-1 rounded text-xs bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark">
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SavedGraphs() {
  const graphs = [
    { id: '1', name: 'Multimodal AI Landscape', nodes: 23, date: '2 days ago' },
    { id: '2', name: 'Healthcare AI Companies', nodes: 15, date: '1 week ago' },
    { id: '3', name: 'OpenAI Ecosystem', nodes: 31, date: '2 weeks ago' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Saved Graphs</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform">
          <Plus className="w-5 h-5" />
          New Graph
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {graphs.map((graph) => (
          <div
            key={graph.id}
            className="glass-card rounded-xl overflow-hidden border border-light-border dark:border-dark-border hover-lift cursor-pointer"
          >
            <div className="h-40 bg-gradient-to-br from-primary-light/20 via-insight-light/20 to-success-light/20 flex items-center justify-center">
              <Network className="w-16 h-16 text-primary-light dark:text-primary-dark opacity-50" />
            </div>
            <div className="p-6">
              <h3 className="font-bold mb-2">{graph.name}</h3>
              <div className="flex items-center justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <span>{graph.nodes} nodes</span>
                <span>{graph.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadingList() {
  const papers = mockPapers.slice(0, 4);
  const [statuses, setStatuses] = useState<Record<string, 'to-read' | 'reading' | 'read'>>({
    '1': 'reading',
    '2': 'to-read',
    '3': 'to-read',
    '4': 'read',
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reading List</h2>
        <div className="glass-card rounded-lg p-4 border border-light-border dark:border-dark-border">
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Progress This Month</div>
          <div className="text-2xl font-bold">12 papers read</div>
        </div>
      </div>

      <div className="space-y-4">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg">{paper.title}</h3>
                  <select
                    value={statuses[paper.id]}
                    onChange={(e) => setStatuses({ ...statuses, [paper.id]: e.target.value as any })}
                    className="px-3 py-1 rounded-lg text-sm glass-card border border-light-border dark:border-dark-border"
                  >
                    <option value="to-read">To Read</option>
                    <option value="reading">Reading</option>
                    <option value="read">Read</option>
                  </select>
                </div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                  {paper.authors.join(', ')} • {paper.venue}
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                  {paper.summary}
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform text-sm">
                    Read Paper
                  </button>
                  <button className="px-4 py-2 glass-card border border-light-border dark:border-dark-border rounded-lg hover:scale-105 transition-transform text-sm">
                    Add Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LearningPath() {
  const pathItems = [
    { id: '1', title: 'Understanding Transformer Architecture', type: 'Paper', completed: true },
    { id: '2', title: 'Explore OpenAI and Anthropic', type: 'Startups', completed: true },
    { id: '3', title: 'Multimodal AI Research Papers', type: 'Paper', completed: false, current: true },
    { id: '4', title: 'Vision-Language Models', type: 'Concept', completed: false },
    { id: '5', title: 'Build Knowledge Graph', type: 'Activity', completed: false },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Learning Path: Multimodal AI</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border">
          <div className="text-3xl font-bold text-primary-light dark:text-primary-dark mb-2">40%</div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Progress</div>
        </div>
        <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border">
          <div className="text-3xl font-bold text-success-light dark:text-success-dark mb-2">2/5</div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Items Completed</div>
        </div>
        <div className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border">
          <div className="text-3xl font-bold text-insight-light dark:text-insight-dark mb-2">~2h</div>
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Est. Time Remaining</div>
        </div>
      </div>

      <div className="space-y-4">
        {pathItems.map((item, index) => (
          <div
            key={item.id}
            className={`glass-card rounded-xl p-6 border ${
              item.current
                ? 'border-primary-light dark:border-primary-dark shadow-lg'
                : 'border-light-border dark:border-dark-border'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                item.completed
                  ? 'bg-success-light/20 text-success-light dark:bg-success-dark/20 dark:text-success-dark'
                  : item.current
                  ? 'bg-primary-light/20 text-primary-light dark:bg-primary-dark/20 dark:text-primary-dark'
                  : 'bg-gray-500/20 text-gray-500'
              }`}>
                {item.completed ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="font-bold">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">{item.title}</h3>
                <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  <span className="px-2 py-1 rounded bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark">
                    {item.type}
                  </span>
                  {item.current && <span className="font-medium text-primary-light dark:text-primary-dark">← Next Up</span>}
                </div>
              </div>
              {item.current && (
                <button className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:scale-105 transition-transform">
                  Start
                </button>
              )}
              {item.completed && (
                <CheckCircle className="w-6 h-6 text-success-light dark:text-success-dark" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

