import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Building2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HeroSection() {
  const [papersCount, setPapersCount] = useState(0);
  const [startupsCount, setStartupsCount] = useState(0);
  const [updatesCount, setUpdatesCount] = useState(0);

  useEffect(() => {
    // Animate counters
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const paperTarget = 2000;
    const startupTarget = 500;
    const updateTarget = 100;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setPapersCount(Math.floor(paperTarget * progress));
      setStartupsCount(Math.floor(startupTarget * progress));
      setUpdatesCount(Math.floor(updateTarget * progress));

      if (currentStep >= steps) {
        clearInterval(timer);
        setPapersCount(paperTarget);
        setStartupsCount(startupTarget);
        setUpdatesCount(updateTarget);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 animate-gradient">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            Navigate the Future of
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200">
              AI Investments
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Your comprehensive platform for tracking AI research, discovering startups, 
          and staying ahead of investment trends in artificial intelligence.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link
            to="/home"
            className="group px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Start Exploring
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/research"
            className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white rounded-full font-semibold text-lg hover:bg-white/20 transition-all border-2 border-white/30 hover:border-white/50 hover:scale-105"
          >
            View Research
          </Link>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <FileText className="w-8 h-8 text-white/90 mb-3 mx-auto" />
            <div className="text-4xl font-bold text-white mb-1">
              {papersCount.toLocaleString()}+
            </div>
            <div className="text-white/70 text-sm">Papers Tracked</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <Building2 className="w-8 h-8 text-white/90 mb-3 mx-auto" />
            <div className="text-4xl font-bold text-white mb-1">
              {startupsCount.toLocaleString()}+
            </div>
            <div className="text-white/70 text-sm">AI Startups</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <Zap className="w-8 h-8 text-white/90 mb-3 mx-auto" />
            <div className="text-4xl font-bold text-white mb-1">
              {updatesCount}+
            </div>
            <div className="text-white/70 text-sm">Updates/Day</div>
          </div>
        </motion.div>
      </div>

      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
      `}</style>
    </section>
  );
}

