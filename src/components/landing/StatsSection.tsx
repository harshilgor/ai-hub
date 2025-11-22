import { motion } from 'framer-motion';
import { FileText, Building2, Users, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Stat {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix: string;
}

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats: Stat[] = [
    {
      icon: <FileText className="w-8 h-8" />,
      value: 2000,
      label: 'Research Papers',
      suffix: '+',
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      value: 500,
      label: 'AI Startups',
      suffix: '+',
    },
    {
      icon: <Users className="w-8 h-8" />,
      value: 100,
      label: 'Investors',
      suffix: '+',
    },
    {
      icon: <Clock className="w-8 h-8" />,
      value: 0,
      label: 'Real-time Updates',
      suffix: '',
    },
  ];

  const AnimatedCounter = ({ target, suffix }: { target: number; suffix: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      const interval = duration / steps;

      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, interval);

      return () => clearInterval(timer);
    }, [isVisible, target]);

    return (
      <span>
        {count.toLocaleString()}
        {suffix}
      </span>
    );
  };

  return (
    <section className="py-20 bg-light-bg dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powering AI Investment Intelligence
          </h2>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary">
            Comprehensive data aggregation from leading sources
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="h-full bg-light-card dark:bg-dark-card backdrop-blur-lg rounded-2xl p-8 border border-light-border dark:border-dark-border hover:border-purple-500 dark:hover:border-purple-400 transition-all hover:shadow-xl">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-light-text-secondary dark:text-dark-text-secondary font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

