import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-20 bg-gray-100 dark:bg-dark-card">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-text mb-4 leading-tight">
            Start exploring today
          </h2>

          <p className="text-base text-gray-600 dark:text-dark-text-secondary mb-8 max-w-2xl mx-auto">
            Join researchers, investors, and innovators using Insider Info to stay ahead
          </p>

          <Link
            to="/home"
            className="inline-block px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

