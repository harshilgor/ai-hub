import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Lightbulb, Target, Zap, ArrowUpRight, AlertCircle } from 'lucide-react';
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictions.slice(0, 6).map((pred, index) => (
            <motion.div
              key={pred.technology}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl p-6 border border-light-border dark:border-dark-border hover-lift"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold">{pred.technology}</h3>
                {pred.isEarlyStage && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-success-light/20 text-success-light dark:text-success-dark">
                    Early Stage
                  </span>
                )}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Prediction Score:</span>
                  <span className="font-bold text-primary-light dark:text-primary-dark">
                    {pred.predictionScore.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Momentum:</span>
                  <span className="font-bold">{pred.momentum.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Confidence:</span>
                  <span className="font-bold">{(pred.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="flex gap-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                <span>📄 {pred.signalCount} signals</span>
                {pred.leaderMentions > 0 && <span>🎤 {pred.leaderMentions} mentions</span>}
                {pred.patentCount > 0 && <span>📋 {pred.patentCount} patents</span>}
              </div>
            </motion.div>
          ))}
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

