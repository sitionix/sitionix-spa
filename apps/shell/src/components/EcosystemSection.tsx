import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Globe, BarChart3, Sparkles } from 'lucide-react';

export function EcosystemSection() {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="min-h-screen snap-start snap-always py-20 px-6 bg-gradient-to-b from-blue-50 to-purple-50"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Анімована картинка зліва */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <EcosystemAnimation />
          </motion.div>

          {/* Текстовий блок справа */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex-1"
          >
            <h2 className="text-4xl font-bold mb-6">
              Створіть власну екосистему
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Об'єднайте всі ваші сайти в єдину екосистему з загальною аналітикою. 
              Синхронізуйте акції, відстежуйте конверсії та керуйте всім бізнесом з одного місця. 
              Отримуйте повну картину успішності всіх ваших проектів в реальному часі.
            </p>
            <div className="mt-8 flex gap-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Єдина панель</span>
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Загальна аналітика</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function EcosystemAnimation() {
  const [isMerged, setIsMerged] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsMerged(prev => !prev);
    }, 5500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-96">
      {!isMerged ? (
        <motion.div
          key="separated"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* 4 окремі сайти */}
          <motion.div
            animate={isMerged ? { 
              x: '50%', 
              y: '50%', 
              scale: 0 
            } : { 
              x: 0, 
              y: 0, 
              scale: 1 
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-40 h-32 bg-white rounded-lg shadow-lg p-3 border-2 border-blue-500"
          >
            <Globe className="w-6 h-6 text-blue-500 mb-2" />
            <div className="h-2 bg-blue-200 rounded mb-1"></div>
            <div className="h-2 bg-blue-200 rounded w-3/4"></div>
          </motion.div>

          <motion.div
            animate={isMerged ? { 
              x: '-50%', 
              y: '50%', 
              scale: 0 
            } : { 
              x: 0, 
              y: 0, 
              scale: 1 
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-40 h-32 bg-white rounded-lg shadow-lg p-3 border-2 border-purple-500"
          >
            <Globe className="w-6 h-6 text-purple-500 mb-2" />
            <div className="h-2 bg-purple-200 rounded mb-1"></div>
            <div className="h-2 bg-purple-200 rounded w-3/4"></div>
          </motion.div>

          <motion.div
            animate={isMerged ? { 
              x: '50%', 
              y: '-50%', 
              scale: 0 
            } : { 
              x: 0, 
              y: 0, 
              scale: 1 
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 w-40 h-32 bg-white rounded-lg shadow-lg p-3 border-2 border-green-500"
          >
            <Globe className="w-6 h-6 text-green-500 mb-2" />
            <div className="h-2 bg-green-200 rounded mb-1"></div>
            <div className="h-2 bg-green-200 rounded w-3/4"></div>
          </motion.div>

          <motion.div
            animate={isMerged ? { 
              x: '-50%', 
              y: '-50%', 
              scale: 0 
            } : { 
              x: 0, 
              y: 0, 
              scale: 1 
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute bottom-0 right-0 w-40 h-32 bg-white rounded-lg shadow-lg p-3 border-2 border-orange-500"
          >
            <Globe className="w-6 h-6 text-orange-500 mb-2" />
            <div className="h-2 bg-orange-200 rounded mb-1"></div>
            <div className="h-2 bg-orange-200 rounded w-3/4"></div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="merged"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Єдина аналітика */}
          <div className="w-80 bg-white rounded-xl shadow-2xl p-6 border-2 border-gradient-to-r from-blue-500 to-purple-500">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <span className="text-lg font-semibold">Загальна аналітика</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span className="text-sm text-blue-700">Магазин 1</span>
                <span className="text-sm font-medium">+45%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                <span className="text-sm text-purple-700">Магазин 2</span>
                <span className="text-sm font-medium">+32%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm text-green-700">Магазин 3</span>
                <span className="text-sm font-medium">+28%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                <span className="text-sm text-orange-700">Магазин 4</span>
                <span className="text-sm font-medium">+51%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
