import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Lightbulb, Target, ArrowRight, ExternalLink, Users, FileText, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { getTechnologyReads, type TechnologyRead } from '../services/api';

export default function TechnologyReadsSection() {
  const [reads, setReads] = useState<TechnologyRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRead, setExpandedRead] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadReads();
  }, []);

  const loadReads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTechnologyReads();
      console.log('Technology reads data:', data);
      if (data.reads && data.reads.length > 0) {
        setReads(data.reads);
      } else {
        setReads([]);
        // If we have a message, show it
        if (data.message) {
          setError(data.message);
        } else {
          setError('No emerging technologies found. The system may still be analyzing papers.');
        }
      }
    } catch (error: any) {
      console.error('Error loading technology reads:', error);
      setError(error.message || 'Failed to load technology reads. Please try again later.');
      setReads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadReads();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light dark:border-primary-dark"></div>
        <span className="ml-3 text-light-text-secondary dark:text-dark-text-secondary">Analyzing technologies...</span>
      </div>
    );
  }

  if (reads.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
          {error || 'Analyzing research papers to identify emerging technologies. This may take a moment...'}
        </p>
        {error && (
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-7 h-7 text-primary-light dark:text-primary-dark" />
        <h2 className="text-3xl font-bold">Emerging Technologies: What to Build Next</h2>
      </div>
      <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8 max-w-3xl">
        Our AI analyzes {reads[0]?.metrics?.signalCount || 0}+ research papers, patents, and news to identify the next breakthrough technologies and what you should build.
      </p>
      
      <div className="space-y-6">
        {reads.map((read, index) => {
          const isExpanded = expandedRead === read.technology;
          
          return (
            <motion.div
              key={read.technology}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl border border-light-border dark:border-dark-border overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-light-border dark:border-dark-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{read.technology}</h3>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-light/20 text-primary-light dark:bg-primary-dark/20 dark:text-primary-dark">
                        Score: {read.predictionScore}
                      </span>
                    </div>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
                      {read.summary}
                    </p>
                  </div>
                </div>
                
                {/* Quick Metrics */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                    <div className="text-xl font-bold">{read.metrics.totalPapers}</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Papers</div>
                  </div>
                  <div className="text-center p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                    <div className="text-xl font-bold">{read.metrics.recentPapers}</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Recent</div>
                  </div>
                  <div className="text-center p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                    <div className="text-xl font-bold">{Math.round(read.metrics.growthRate)}%</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Growth</div>
                  </div>
                  <div className="text-center p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                    <div className="text-xl font-bold">{Math.round(read.metrics.momentum)}</div>
                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Momentum</div>
                  </div>
                </div>
                
                {/* Expand Button */}
                <button
                  onClick={() => setExpandedRead(isExpanded ? null : read.technology)}
                  className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-primary-light dark:text-primary-dark hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 rounded-lg p-2 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Full Analysis
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Read Full Analysis
                    </>
                  )}
                </button>
              </div>
              
              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-6 space-y-6 border-t border-light-border dark:border-dark-border">
                      {/* Full Read Sections */}
                      {read.fullRead && read.fullRead.length > 0 && (
                        <div>
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Deep Dive
                          </h4>
                          <div className="space-y-4">
                            {read.fullRead.map((section, idx) => (
                              <div key={idx} className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                                <h5 className="font-bold mb-2 text-lg">{section.heading}</h5>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                                  {section.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Key Insights */}
                      {read.keyInsights && read.keyInsights.length > 0 && (
                        <div>
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-warning-light dark:text-warning-dark" />
                            Key Insights
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {read.keyInsights.map((insight, idx) => (
                              <div
                                key={idx}
                                className={`p-4 rounded-lg border-l-4 ${
                                  insight.impact === 'high'
                                    ? 'bg-success-light/10 dark:bg-success-dark/10 border-l-success-light dark:border-l-success-dark'
                                    : 'bg-warning-light/10 dark:bg-warning-dark/10 border-l-warning-light dark:border-l-warning-dark'
                                }`}
                              >
                                <h5 className="font-bold mb-1">{insight.title}</h5>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                  {insight.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* What to Build */}
                      {read.whatToBuild && read.whatToBuild.length > 0 && (
                        <div>
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-success-light dark:text-success-dark" />
                            What to Build Next
                          </h4>
                          <div className="space-y-3">
                            {read.whatToBuild.map((opportunity, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-success-light/10 dark:bg-success-dark/10 rounded-lg border-l-4 border-l-success-light dark:border-l-success-dark"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-bold">{opportunity.title}</h5>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    opportunity.opportunity === 'high'
                                      ? 'bg-success-light/20 text-success-light dark:bg-success-dark/20 dark:text-success-dark'
                                      : 'bg-warning-light/20 text-warning-light dark:bg-warning-dark/20 dark:text-warning-dark'
                                  }`}>
                                    {opportunity.opportunity === 'high' ? 'High Opportunity' : 'Medium Opportunity'}
                                  </span>
                                </div>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                                  {opportunity.description}
                                </p>
                                <div className="flex items-center gap-2 text-sm font-medium text-success-light dark:text-success-dark">
                                  <ArrowRight className="w-4 h-4" />
                                  <span>{opportunity.action}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Companies */}
                      {read.companies && read.companies.length > 0 && (
                        <div>
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary-light dark:text-primary-dark" />
                            Companies Working on This
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {read.companies.map((company, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full text-sm font-medium bg-primary-light/20 text-primary-light dark:bg-primary-dark/20 dark:text-primary-dark"
                              >
                                {company}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Top Papers */}
                      {read.topPapers && read.topPapers.length > 0 && (
                        <div>
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Key Research Papers
                          </h4>
                          <div className="space-y-3">
                            {read.topPapers.map((paper, idx) => (
                              <a
                                key={idx}
                                href={paper.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors group"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-bold mb-1 group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors">
                                      {paper.title}
                                    </h5>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2">
                                      {paper.authors?.slice(0, 3).join(', ')}
                                      {paper.authors && paper.authors.length > 3 && ' et al.'}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                      {paper.venue && <span>{paper.venue}</span>}
                                      {paper.citations > 0 && <span>📊 {paper.citations} citations</span>}
                                      <span>{new Date(paper.published).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Trends */}
                      {read.trends && (
                        <div>
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Trends
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                              <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">Research</div>
                              <div className="font-bold">{read.trends.research.description}</div>
                            </div>
                            <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                              <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">Commercial</div>
                              <div className="font-bold">{read.trends.commercial.description}</div>
                            </div>
                            <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                              <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">Developer</div>
                              <div className="font-bold">{read.trends.developer.description}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

