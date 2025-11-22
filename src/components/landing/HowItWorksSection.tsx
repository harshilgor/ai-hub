import { motion } from 'framer-motion';
import { Search, BarChart, Zap } from 'lucide-react';

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function HowItWorksSection() {
  const steps: Step[] = [
    {
      number: 1,
      icon: <Search className="w-8 h-8" />,
      title: 'Browse & Discover',
      description: 'Explore latest AI research and startups from multiple leading sources',
    },
    {
      number: 2,
      icon: <BarChart className="w-8 h-8" />,
      title: 'Track & Analyze',
      description: 'Monitor trends, funding patterns, and industry insights in real-time',
    },
    {
      number: 3,
      icon: <Zap className="w-8 h-8" />,
      title: 'Stay Informed',
      description: 'Get real-time updates on the AI landscape and investment opportunities',
    },
  ];

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
            How It Works
          </h2>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary">
            Three simple steps to AI investment intelligence
          </p>
        </motion.div>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 opacity-20" 
                 style={{ width: 'calc(100% - 12rem)', marginLeft: '6rem' }} 
            />

            <div className="grid grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="bg-light-card dark:bg-dark-card rounded-2xl p-8 border border-light-border dark:border-dark-border hover:border-purple-500 dark:hover:border-purple-400 transition-all hover:shadow-xl">
                    {/* Number Badge */}
                    <div className="absolute -top-4 left-8 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 mt-4">
                      {step.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Vertical Layout */}
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <div className="bg-light-card dark:bg-dark-card rounded-2xl p-6 border border-light-border dark:border-dark-border">
                <div className="flex items-start gap-4">
                  {/* Number Badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.number}
                  </div>

                  <div className="flex-grow">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                      {step.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connecting Line for mobile */}
              {index < steps.length - 1 && (
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 opacity-20 mx-6" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

