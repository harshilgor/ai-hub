import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Lightbulb, Target, Zap, ArrowUpRight, AlertCircle, ChevronDown, ChevronUp, FileText, Newspaper, Briefcase, Code, Link2, Calendar, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import {
  getTechnologyPredictions,
  getEmergingTechnologies,
  getIndustryInsights,
  getLeaderQuotes,
  type TechnologyPrediction,
  type EmergingTechnology,
  type IndustryInsight,
  type LeaderQuote
} from '../services/api';

export default function InsightsSection() {
  const [predictions, setPredictions] = useState<TechnologyPrediction[]>([]);
  const [emerging, setEmerging] = useState<EmergingTechnology[]>([]);
  const [industries, setIndustries] = useState<IndustryInsight[]>([]);
  const [quotes, setQuotes] = useState<LeaderQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTech, setExpandedTech] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const [predictionsData, emergingData, industriesData, quotesData] = await Promise.allSettled([
        getTechnologyPredictions(),
        getEmergingTechnologies(),
        getIndustryInsights(),
        getLeaderQuotes()
      ]);

      if (predictionsData.status === 'fulfilled') {
        setPredictions(predictionsData.value.predictions || []);
      }
      if (emergingData.status === 'fulfilled') {
        setEmerging(emergingData.value.emerging || []);
      }
      if (industriesData.status === 'fulfilled') {
        setIndustries(industriesData.value.industries || []);
      }
      if (quotesData.status === 'fulfilled') {
        setQuotes(quotesData.value.quotes || []);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light dark:border-primary-dark"></div>
        <span className="ml-3 text-light-text-secondary dark:text-dark-text-secondary">Loading insights...</span>
      </div>
    );
  }

  // Show message if no insights available yet
  if (predictions.length === 0 && emerging.length === 0 && industries.length === 0 && quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Insights are being generated. Please wait a few minutes for data to be collected from all sources.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Next Big Technologies */}
      {predictions.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-success-light dark:text-success-dark" />
            <h2 className="text-2xl font-bold">Next Big Technologies</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.slice(0, 6).map((pred, index) => {
              const isExpanded = expandedTech === pred.technology;
              const hasEnhancedData = pred.whyItWillBeBig;
              
              return (
                <motion.div
                  key={pred.technology}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-xl border border-light-border dark:border-dark-border hover-lift overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{pred.technology}</h3>
                        {pred.isEarlyStage && (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-success-light/20 text-success-light dark:text-success-dark mb-2">
                            Early Stage
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-light dark:text-primary-dark">
                          {pred.predictionScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          Prediction Score
                        </div>
                      </div>
                    </div>
                    
                    {/* Summary narrative */}
                    {hasEnhancedData && pred.whyItWillBeBig?.summary && (
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4 leading-relaxed">
                        {pred.whyItWillBeBig.summary}
                      </p>
                    )}
                    
                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                        <div className="text-lg font-bold">{pred.momentum.toFixed(0)}</div>
                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Momentum</div>
                      </div>
                      <div className="text-center p-2 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                        <div className="text-lg font-bold">{(pred.confidence * 100).toFixed(0)}%</div>
                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Confidence</div>
                      </div>
                      <div className="text-center p-2 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                        <div className="text-lg font-bold">{pred.signalCount}</div>
                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Signals</div>
                      </div>
                    </div>
                    
                    {/* Evidence summary */}
                    {hasEnhancedData && pred.whyItWillBeBig?.evidence && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {(pred.whyItWillBeBig.evidence.research.count || 0) > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <FileText className="w-4 h-4 text-primary-light dark:text-primary-dark" />
                            <span>{pred.whyItWillBeBig.evidence.research.count} Papers</span>
                          </div>
                        )}
                        {(pred.whyItWillBeBig.evidence.commercial.count || 0) > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <Newspaper className="w-4 h-4 text-success-light dark:text-success-dark" />
                            <span>{pred.whyItWillBeBig.evidence.commercial.count} News</span>
                          </div>
                        )}
                        {(pred.whyItWillBeBig.evidence.patents.count || 0) > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <Briefcase className="w-4 h-4 text-warning-light dark:text-warning-dark" />
                            <span>{pred.whyItWillBeBig.evidence.patents.count} Patents</span>
                          </div>
                        )}
                        {(pred.whyItWillBeBig.evidence.developer.count || 0) > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <Code className="w-4 h-4 text-insight-light dark:text-insight-dark" />
                            <span>{pred.whyItWillBeBig.evidence.developer.count} Repos</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Expand button */}
                    {hasEnhancedData && (
                      <button
                        onClick={() => setExpandedTech(isExpanded ? null : pred.technology)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-primary-light dark:text-primary-dark hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 rounded-lg p-2 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show Full Analysis
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && hasEnhancedData && pred.whyItWillBeBig && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-light-border dark:border-dark-border pt-6 space-y-6">
                          {/* Evidence breakdown */}
                          <div>
                            <h4 className="font-bold mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Evidence Breakdown
                            </h4>
                            <div className="space-y-3">
                              {pred.whyItWillBeBig.evidence.research.count > 0 && (
                                <div className="p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">Research Papers</span>
                                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                      {pred.whyItWillBeBig.evidence.research.count} papers • {pred.whyItWillBeBig.evidence.research.trend}
                                    </span>
                                  </div>
                                  {pred.whyItWillBeBig.evidence.research.keyExamples.length > 0 && (
                                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
                                      Key: {pred.whyItWillBeBig.evidence.research.keyExamples[0].title.substring(0, 60)}...
                                    </div>
                                  )}
                                </div>
                              )}
                              {pred.whyItWillBeBig.evidence.commercial.count > 0 && (
                                <div className="p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">Commercial News</span>
                                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                      {pred.whyItWillBeBig.evidence.commercial.count} articles • {pred.whyItWillBeBig.evidence.commercial.trend}
                                    </span>
                                  </div>
                                  {pred.whyItWillBeBig.evidence.commercial.keyExamples.length > 0 && (
                                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
                                      Key: {pred.whyItWillBeBig.evidence.commercial.keyExamples[0].title.substring(0, 60)}...
                                    </div>
                                  )}
                                </div>
                              )}
                              {pred.whyItWillBeBig.evidence.patents.count > 0 && (
                                <div className="p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">Patents</span>
                                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                      {pred.whyItWillBeBig.evidence.patents.count} patents • {pred.whyItWillBeBig.evidence.patents.trend}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {pred.whyItWillBeBig.evidence.developer.count > 0 && (
                                <div className="p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">Developer Activity</span>
                                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                      {pred.whyItWillBeBig.evidence.developer.count} repos • {pred.whyItWillBeBig.evidence.developer.trend}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Key Connections */}
                          {pred.whyItWillBeBig.connections.length > 0 && (
                            <div>
                              <h4 className="font-bold mb-3 flex items-center gap-2">
                                <Link2 className="w-4 h-4" />
                                Key Connections
                              </h4>
                              <div className="space-y-2">
                                {pred.whyItWillBeBig.connections.slice(0, 3).map((conn, idx) => (
                                  <div key={idx} className="p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg text-sm">
                                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
                                      {conn.type.replace(/-/g, ' ').toUpperCase()}
                                    </div>
                                    <div className="text-light-text dark:text-dark-text">{conn.description}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Key Aspects - What's becoming big */}
                          {pred.whyItWillBeBig.keyAspects && pred.whyItWillBeBig.keyAspects.length > 0 && (
                            <div>
                              <h4 className="font-bold mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4 text-primary-light dark:text-primary-dark" />
                                What's Becoming Big
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {pred.whyItWillBeBig.keyAspects.map((aspect, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-full text-xs font-medium bg-primary-light/20 text-primary-light dark:bg-primary-dark/20 dark:text-primary-dark"
                                  >
                                    {aspect}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Companies Working on It */}
                          {pred.whyItWillBeBig.companies && pred.whyItWillBeBig.companies.length > 0 && (
                            <div>
                              <h4 className="font-bold mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4 text-success-light dark:text-success-dark" />
                                Companies & Startups Working on This
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {pred.whyItWillBeBig.companies.slice(0, 6).map((company, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg text-sm font-medium"
                                  >
                                    {company}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* What's Next */}
                          {pred.whyItWillBeBig.whatsNext && pred.whyItWillBeBig.whatsNext.length > 0 && (
                            <div>
                              <h4 className="font-bold mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-warning-light dark:text-warning-dark" />
                                What's Next
                              </h4>
                              <div className="space-y-2">
                                {pred.whyItWillBeBig.whatsNext.map((prediction, idx) => (
                                  <div key={idx} className="p-3 bg-warning-light/10 dark:bg-warning-dark/10 rounded-lg border-l-4 border-l-warning-light dark:border-l-warning-dark">
                                    <div className="text-sm text-light-text dark:text-dark-text">{prediction}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Timeline */}
                          {pred.whyItWillBeBig.timeline.length > 0 && (
                            <div>
                              <h4 className="font-bold mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Timeline
                              </h4>
                              <div className="space-y-2">
                                {pred.whyItWillBeBig.timeline.slice(-4).map((event, idx) => (
                                  <div key={idx} className="flex items-start gap-3 text-sm">
                                    <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary min-w-[80px]">
                                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-light-text dark:text-dark-text">{event.event}</div>
                                      <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{event.source}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Risks and Confidence */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pred.whyItWillBeBig.risks.length > 0 && (
                              <div>
                                <h4 className="font-bold mb-2 flex items-center gap-2 text-sm">
                                  <AlertTriangle className="w-4 h-4 text-warning-light dark:text-warning-dark" />
                                  Risks
                                </h4>
                                <ul className="space-y-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                  {pred.whyItWillBeBig.risks.map((risk, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="mt-1">•</span>
                                      <span>{risk}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {pred.whyItWillBeBig.confidenceFactors.length > 0 && (
                              <div>
                                <h4 className="font-bold mb-2 flex items-center gap-2 text-sm">
                                  <CheckCircle2 className="w-4 h-4 text-success-light dark:text-success-dark" />
                                  Confidence Factors
                                </h4>
                                <ul className="space-y-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                  {pred.whyItWillBeBig.confidenceFactors.map((factor, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="mt-1">✓</span>
                                      <span>{factor}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Emerging Technologies */}
      {emerging.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-warning-light dark:text-warning-dark" />
            <h2 className="text-2xl font-bold">Emerging Technologies</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {emerging.slice(0, 8).map((tech, index) => (
              <motion.div
                key={tech.technology}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-lg p-4 border border-light-border dark:border-dark-border hover-lift"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm">{tech.technology}</h4>
                  <AlertCircle className="w-4 h-4 text-warning-light dark:text-warning-dark" />
                </div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary space-y-1">
                  <div>Score: {tech.emergingScore.toFixed(1)}</div>
                  <div>Velocity: {tech.velocity.toFixed(2)}</div>
                  <div>Signals: {tech.signalCount}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Top Growing Industries */}
      {industries.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-primary-light dark:text-primary-dark" />
            <h2 className="text-2xl font-bold">Top Growing Industries</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.slice(0, 6).map((industry, index) => (
            <motion.div
              key={industry.industry}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{industry.industry}</h3>
                <div className={`flex items-center gap-1 ${industry.growthRate > 0 ? 'text-success-light dark:text-success-dark' : 'text-error-light dark:text-error-dark'}`}>
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="font-bold">{industry.growthRate > 0 ? '+' : ''}{industry.growthRate.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Growth Score:</span>
                  <span className="font-bold">{industry.growthScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Confidence:</span>
                  <span className="font-bold">{(industry.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Signals:</span>
                  <span className="font-bold">{industry.signalCount}</span>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        </section>
      )}

      {/* Leader Quotes */}
      {quotes.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-insight-light dark:text-insight-dark" />
            <h2 className="text-2xl font-bold">Key Insights from Leaders</h2>
          </div>
          
          <div className="space-y-4">
            {quotes.slice(0, 5).map((quote, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-lg p-6 border-l-4 border-l-insight-light dark:border-l-insight-dark"
              >
                <p className="text-lg italic mb-3">"{quote.text}"</p>
                <div className="flex items-center justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  <span>{quote.source}</span>
                  <div className="flex gap-2">
                    {quote.technologies.map(tech => (
                      <span key={tech} className="px-2 py-1 rounded bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

