import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Zap, Shield, Palette, TrendingUp, Users } from 'lucide-react';

const benefits = [
  {
    icon: Zap,
    title: 'Швидкість',
    description: 'Створюйте сайти за лічені хвилини без технічних знань'
  },
  {
    icon: Shield,
    title: 'Безпека',
    description: 'Надійний захист даних і безпечні платіжні транзакції'
  },
  {
    icon: Palette,
    title: 'Дизайн',
    description: 'Сучасні шаблони та гнучкі можливості налаштування'
  },
  {
    icon: TrendingUp,
    title: 'Аналітика',
    description: 'Детальна статистика та інсайти для росту бізнесу'
  },
  {
    icon: Users,
    title: 'Підтримка',
    description: 'Цілодобова допомога експертів 24/7'
  }
];

export function BenefitsSection() {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="min-h-screen snap-start snap-always py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center mb-16"
        >
          Переваги платформи
        </motion.h2>

        {/* Перший ряд - 3 блоки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {benefits.slice(0, 3).map((benefit, index) => (
            <BenefitCard
              key={benefit.title}
              benefit={benefit}
              index={index}
              direction="left"
              inView={inView}
            />
          ))}
        </div>

        {/* Другий ряд - 2 блоки по центру */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {benefits.slice(3, 5).map((benefit, index) => (
            <BenefitCard
              key={benefit.title}
              benefit={benefit}
              index={index + 3}
              direction="right"
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type BenefitCardProps = Readonly<{
  benefit: {
    icon: React.ElementType;
    title: string;
    description: string;
  };
  index: number;
  direction: 'left' | 'right';
  inView: boolean;
}>;

function BenefitCard({ benefit, index, direction, inView }: BenefitCardProps) {
  const Icon = benefit.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: direction === 'left' ? -50 : 50 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.3 }}
      whileHover={{ scale: 1.05 }}
      className="text-center p-6"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4"
      >
        <Icon className="w-8 h-8 text-white" />
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
      <p className="text-base text-gray-600">{benefit.description}</p>
    </motion.div>
  );
}
