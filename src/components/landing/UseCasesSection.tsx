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
            Built for Everyone in AI
          </h2>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">
            Whether you're investing, researching, building, or learning — we've got you covered
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-light-bg dark:bg-dark-bg rounded-2xl p-8 border border-light-border dark:border-dark-border hover:border-transparent hover:shadow-2xl transition-all">
                {/* Icon */}
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  {useCase.icon}
                </div>

                {/* Title and Description */}
                <h3 className="text-2xl font-bold mb-2">{useCase.title}</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
                  {useCase.description}
                </p>

                {/* Benefits */}
                <ul className="space-y-3">
                  {useCase.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mt-0.5`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
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

