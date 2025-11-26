import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Play, ExternalLink, TrendingUp, Users, MessageSquare, ChevronDown, ChevronUp, Clock, Eye } from 'lucide-react';
import { getChannelVideos, type VideoInsight } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function VideoInsightsSection() {
  const [videos, setVideos] = useState<VideoInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string>('');

  useEffect(() => {
    loadVideoInsights();
  }, []);

  const loadVideoInsights = async () => {
    try {
      setLoading(true);
      // Get first channel (for now, we'll use the Dwarkesh Patel channel)
      // In the future, we can make this configurable
      const channelsResponse = await fetch(`${API_BASE_URL}/channels`);
      
      if (!channelsResponse.ok) {
        throw new Error(`Failed to fetch channels: ${channelsResponse.statusText}`);
      }
      
      const channelsData = await channelsResponse.json();
      
      if (channelsData.channels && channelsData.channels.length > 0) {
        const channel = channelsData.channels[0];
        setChannelName(channel.name);
        
        try {
          const data = await getChannelVideos(channel.id, 5);
          setVideos(data.videos || []);
        } catch (videoError: any) {
          console.error('Error fetching videos:', videoError);
          // If videos fail to load, still show empty state with helpful message
          setVideos([]);
        }
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading video insights:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light dark:border-primary-dark"></div>
        <span className="ml-3 text-light-text-secondary dark:text-dark-text-secondary">Loading video insights...</span>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          No videos found. Make sure channels are configured and videos are being processed.
        </p>
      </div>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Video className="w-7 h-7 text-primary-light dark:text-primary-dark" />
        <h2 className="text-3xl font-bold">Latest Insights from {channelName}</h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {videos.map((video, index) => (
          <motion.div
            key={video.videoId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              {/* Video Header */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold mb-2">{video.title.length > 100 ? video.title.substring(0, 100) + '...' : video.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(video.duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViews(parseInt(video.viewCount.toString()))} views
                    </div>
                    <span>{formatDate(video.publishedAt)}</span>
                  </div>
                </div>
                <a
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-2 rounded-lg bg-primary-light/10 dark:bg-primary-dark/10 hover:bg-primary-light/20 dark:hover:bg-primary-dark/20 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-primary-light dark:text-primary-dark" />
                </a>
              </div>

              {/* Insights - Always show section if video is processed */}
              {video.processed && video.insights ? (
                <div className="space-y-4">
                  {/* Summary - Show prominently at the top */}
                  {video.insights.summary && video.insights.summary.trim() ? (
                    <div className="mb-4 p-4 bg-gradient-to-r from-primary-light/10 to-insight-light/10 dark:from-primary-dark/10 dark:to-insight-dark/10 rounded-lg border-l-4 border-primary-light dark:border-primary-dark">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-5 h-5 text-primary-light dark:text-primary-dark" />
                        <span className="text-sm font-semibold text-primary-light dark:text-primary-dark">Summary</span>
                      </div>
                      <p className="text-sm text-light-text dark:text-dark-text leading-relaxed">
                        {video.insights.summary}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border">
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary italic">
                        Summary will be available soon...
                      </p>
                    </div>
                  )}

                  {/* Technologies - Always show section */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary-light dark:text-primary-dark" />
                      <span className="text-sm font-semibold">Technologies Discussed</span>
                      {video.insights.technologies.length > 0 && (
                        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          ({video.insights.technologies.length})
                        </span>
                      )}
                    </div>
                    {video.insights.technologies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {video.insights.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark rounded-full text-xs font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary italic">
                        No technologies identified yet
                      </p>
                    )}
                  </div>

                  {/* Companies - Always show section */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary-light dark:text-primary-dark" />
                      <span className="text-sm font-semibold">Companies Mentioned</span>
                      {video.insights.companies.length > 0 && (
                        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          ({video.insights.companies.length})
                        </span>
                      )}
                    </div>
                    {video.insights.companies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {video.insights.companies.map((company) => (
                          <span
                            key={company}
                            className="px-3 py-1 bg-insight-light/10 dark:bg-insight-dark/10 text-insight-light dark:text-insight-dark rounded-full text-xs font-medium"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary italic">
                        No companies identified yet
                      </p>
                    )}
                  </div>

                  {/* Key Quotes - Always show section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary-light dark:text-primary-dark" />
                        <span className="text-sm font-semibold">Key Insights</span>
                        {video.insights.keyQuotes.length > 0 && (
                          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                            ({video.insights.keyQuotes.length})
                          </span>
                        )}
                      </div>
                      {video.insights.keyQuotes.length > 2 && (
                        <button
                          onClick={() => setExpandedVideo(expandedVideo === video.videoId ? null : video.videoId)}
                          className="text-xs text-primary-light dark:text-primary-dark hover:underline"
                        >
                          {expandedVideo === video.videoId ? (
                            <span className="flex items-center gap-1">
                              Show Less <ChevronUp className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              Show More <ChevronDown className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    {video.insights.keyQuotes.length > 0 ? (
                      <AnimatePresence>
                        {video.insights.keyQuotes.slice(0, expandedVideo === video.videoId ? video.insights.keyQuotes.length : 2).map((quote, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 p-3 bg-light-bg dark:bg-dark-bg rounded-lg border-l-4 border-primary-light dark:border-primary-dark"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-xs font-medium text-primary-light dark:text-primary-dark">
                                {quote.speaker || 'Speaker'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                quote.stance === 'pro' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                quote.stance === 'con' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                              }`}>
                                {quote.stance || 'neutral'}
                              </span>
                            </div>
                            <p className="text-sm text-light-text dark:text-dark-text italic">
                              "{quote.text}"
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              {quote.technology && (
                                <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                  {quote.technology}
                                </span>
                              )}
                              {quote.timestamp && (
                                <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                  {quote.technology && '• '}{quote.timestamp}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    ) : (
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary italic">
                        Key insights will be extracted soon...
                      </p>
                    )}
                  </div>

                  {/* Stance Distribution - Always show section */}
                  {video.insights.stanceDistribution && Object.keys(video.insights.stanceDistribution).length > 0 ? (
                    <div className="pt-4 border-t border-light-border dark:border-dark-border">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary-light dark:text-primary-dark" />
                        <span className="text-sm font-semibold">Sentiment Breakdown</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(video.insights.stanceDistribution).map(([stance, count]) => (
                          <div key={stance} className="text-center">
                            <div className={`text-lg font-bold ${
                              stance === 'pro' ? 'text-green-600 dark:text-green-400' :
                              stance === 'con' ? 'text-red-600 dark:text-red-400' :
                              'text-gray-600 dark:text-gray-400'
                            }`}>
                              {count}
                            </div>
                            <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary capitalize">
                              {stance}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-light-border dark:border-dark-border">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary-light dark:text-primary-dark" />
                        <span className="text-sm font-semibold">Sentiment Breakdown</span>
                      </div>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary italic">
                        Sentiment analysis will be available soon...
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-pulse mb-2">
                    <div className="h-2 bg-light-border dark:bg-dark-border rounded w-3/4 mx-auto"></div>
                  </div>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Processing insights... This video will be analyzed soon.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

