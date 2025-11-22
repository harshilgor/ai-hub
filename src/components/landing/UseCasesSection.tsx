import { motion } from 'framer-motion';
import { TrendingUp, Microscope, Rocket, GraduationCap, Check } from 'lucide-react';

interface UseCase {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  gradient: string;
}

export default function UseCasesSection() {
  const useCases: UseCase[] = [
    {
      icon: <TrendingUp className="w-10 h-10" />,
      title: 'Investors',
      description: 'Find promising AI opportunities',
      benefits: [
        'Track emerging AI startups',
        'Monitor funding trends',
        'Identify investment opportunities',
        'Stay ahead of the market',
      ],
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Microscope className="w-10 h-10" />,
      title: 'Researchers',
      description: 'Track cutting-edge AI papers',
      benefits: [
        'Access latest research',
        'Discover related papers',
        'Track citation trends',
        'Collaborate with peers',
      ],
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Rocket className="w-10 h-10" />,
      title: 'Entrepreneurs',
      description: 'Discover market trends',
      benefits: [
        'Identify market gaps',
        'Research competitors',
        'Find potential partners',
        'Validate ideas with data',
      ],
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: <GraduationCap className="w-10 h-10" />,
      title: 'Students',
      description: 'Learn about AI landscape',
      benefits: [
        'Explore AI domains',
        'Study industry trends',
        'Find internship opportunities',
        'Build domain knowledge',
      ],
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section className="py-16 bg-gray-50 dark:bg-dark-card">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-text mb-3">
            Built for any use case
          </h2>
          <p className="text-base text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
            Whether you're investing, researching, building, or learning — we've got you covered
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-white dark:bg-dark-bg rounded-xl p-6 border border-gray-200 dark:border-dark-border hover:shadow-lg transition-all">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 mb-4 group-hover:scale-110 transition-transform">
                  {useCase.icon}
                </div>

                {/* Title and Description */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
                  {useCase.description}
                </p>

                {/* Benefits */}
                <ul className="space-y-2">
                  {useCase.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center mt-0.5">
                        <Check className="w-2.5 h-2.5 text-white dark:text-gray-900" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-dark-text-secondary">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

