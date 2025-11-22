import { motion } from 'framer-motion';
import { Lightbulb, Link2, FileText, Newspaper, Users, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { industryInsights } from '../data/mockData';

export default function IndustryInsights() {
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
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-8 h-8 text-insight-light dark:text-insight-dark" />
            <h1 className="text-4xl font-bold">Industry Insights</h1>
          </div>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary">
            Key events, their connections to research, news, and insider moves
          </p>
        </motion.div>

        {/* Industry Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}

