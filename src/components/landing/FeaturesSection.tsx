import { motion } from 'framer-motion';
import { FileText, Search, TrendingUp, Target, Bookmark } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeaturesSection() {
  const features: Feature[] = [
    {
      icon: <FileText className="w-7 h-7" />,
      title: 'Research Papers',
      description: 'Access cutting-edge AI research from arXiv and Semantic Scholar, updated in real-time with citations and analysis',
    },
    {
      icon: <Search className="w-7 h-7" />,
      title: 'Startup Discovery',
      description: 'Explore Y Combinator AI startups with funding details, batch information, and growth trajectories',
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: 'Market Trends',
      description: 'Visualize funding patterns, technology adoption, and market dynamics across the AI landscape',
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: 'Industry Insights',
      description: 'Deep dive into specific sectors like healthcare, finance, robotics, and more with detailed analytics',
    },
    {
      icon: <Bookmark className="w-7 h-7" />,
      title: 'Personal Tracker',
      description: 'Save and organize papers, startups, and trends that matter to you in customizable collections',
    },
  ];

  return (
    <section id="features" className="py-16 bg-white dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-text mb-3">
            Everything you need
          </h2>
          <p className="text-base text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
            Comprehensive tools for AI research, analysis, and investment tracking
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group bg-gray-50 dark:bg-dark-card rounded-xl p-6 hover:shadow-lg transition-all border border-gray-100 dark:border-dark-border"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-2">
                {feature.title}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

