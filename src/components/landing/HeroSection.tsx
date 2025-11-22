import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-dark-bg dark:to-dark-card py-20">
      <div className="max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-gray-700 dark:text-dark-text">Real-time AI Intelligence</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 dark:text-dark-text mb-6 leading-tight"
        >
          Your AI Investment
          <br />
          Intelligence Hub
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-gray-600 dark:text-dark-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Track research papers, discover startups, and stay ahead of AI trends — all in one place
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <Link
            to="/home"
            className="px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
          >
            Start Exploring
          </Link>
          <Link
            to="#features"
            className="px-8 py-3.5 bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text rounded-full font-semibold text-lg hover:bg-gray-50 dark:hover:bg-dark-bg transition-all border-2 border-gray-200 dark:border-dark-border"
          >
            See Features
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-white dark:border-dark-bg flex items-center justify-center text-white font-bold text-sm"
                style={{
                  backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'][i],
                }}
              >
                {['R', 'I', 'A', 'S'][i]}
              </div>
            ))}
          </div>
          <span className="text-gray-600 dark:text-dark-text-secondary text-sm">
            Trusted by researchers and investors
          </span>
        </motion.div>
      </div>
    </section>
  );
}

