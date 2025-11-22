import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-32 bg-gray-100 dark:bg-dark-card">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-dark-text mb-6 leading-tight">
            Start exploring today
          </h2>

          <p className="text-xl text-gray-600 dark:text-dark-text-secondary mb-12 leading-relaxed max-w-2xl mx-auto">
            Join researchers, investors, and innovators using AI Hub to stay ahead
          </p>

          <Link
            to="/home"
            className="inline-block px-10 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

