import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Search, TrendingUp, Target, Network, Bookmark, ArrowRight } from 'lucide-react';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  gradient: string;
  size: 'small' | 'medium' | 'large';
}

export default function FeaturesSection() {
  const features: Feature[] = [
    {
      id: 'research',
      icon: <FileText className="w-8 h-8" />,
      title: 'Latest AI Research',
      description: 'Access cutting-edge papers from arXiv and Semantic Scholar, updated in real-time',
      link: '/research',
      gradient: 'from-purple-500 to-pink-500',
      size: 'large',
    },
    {
      id: 'yc',
      icon: <Search className="w-8 h-8" />,
      title: 'Y Combinator Startups',
      description: 'Discover and track promising AI companies from YC batches',
      link: '/yc-explorer',
      gradient: 'from-blue-500 to-cyan-500',
      size: 'medium',
    },
    {
      id: 'trends',
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Data-Driven Insights',
      description: 'Visualize trends, funding patterns, and market dynamics',
      link: '/trends',
      gradient: 'from-green-500 to-teal-500',
      size: 'medium',
    },
    {
      id: 'industry',
      icon: <Target className="w-8 h-8" />,
      title: 'Sector Intelligence',
      description: 'Deep dive into specific AI industries and their growth trajectories',
      link: '/industry-insights',
      gradient: 'from-orange-500 to-red-500',
      size: 'small',
    },
    {
      id: 'graph',
      icon: <Network className="w-8 h-8" />,
      title: 'Connect the Dots',
      description: 'Explore relationships between papers, companies, and investors',
      link: '/home',
      gradient: 'from-violet-500 to-purple-500',
      size: 'small',
    },
    {
      id: 'tracker',
      icon: <Bookmark className="w-8 h-8" />,
      title: 'Personal Tracking',
      description: 'Save and organize your favorite papers and startups in one place',
      link: '/my-tracker',
      gradient: 'from-indigo-500 to-blue-500',
      size: 'medium',
    },
  ];

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'large':
        return 'md:col-span-2 md:row-span-2';
      case 'medium':
        return 'md:col-span-1 md:row-span-2';
      case 'small':
        return 'md:col-span-1 md:row-span-1';
      default:
        return '';
    }
  };

  return (
    <section className="py-20 bg-light-card dark:bg-dark-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need in One Platform
          </h2>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">
            Comprehensive tools for AI investment research, analysis, and tracking
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={getSizeClasses(feature.size)}
            >
              <Link
                to={feature.link}
                className="group relative h-full bg-light-bg dark:bg-dark-bg rounded-2xl p-8 border border-light-border dark:border-dark-border hover:border-transparent transition-all overflow-hidden block"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${feature.gradient} transition-all">
                    {feature.title}
                  </h3>
                  
                  <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6 flex-grow leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center text-sm font-semibold text-light-text dark:text-dark-text group-hover:gap-2 transition-all">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

