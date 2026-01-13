import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const templates = [
  { id: 1, name: 'Одяг', category: 'fashion', color: 'from-pink-400 to-rose-400' },
  { id: 2, name: 'Зоомагазини', category: 'pets', color: 'from-amber-400 to-orange-400' },
  { id: 3, name: 'Мода та стиль', category: 'style', color: 'from-purple-400 to-pink-400' },
  { id: 4, name: 'Їжа та напої', category: 'food', color: 'from-green-400 to-emerald-400' },
  { id: 5, name: 'Товари для дому', category: 'home', color: 'from-blue-400 to-cyan-400' },
  { id: 6, name: 'Електроніка', category: 'tech', color: 'from-slate-400 to-gray-400' },
  { id: 7, name: 'Спорт', category: 'sports', color: 'from-red-400 to-orange-400' },
  { id: 8, name: 'Дитячі товари', category: 'kids', color: 'from-yellow-400 to-amber-400' }
];

export function TemplatesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredTemplate, setHoveredTemplate] = useState<number | null>(null);
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

  const visibleTemplates = [
    templates[currentIndex],
    templates[(currentIndex + 1) % templates.length],
    templates[(currentIndex + 2) % templates.length]
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 3) % templates.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 3 + templates.length) % templates.length);
  };

  return (
    <section ref={ref} className="min-h-screen snap-start snap-always py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center mb-16"
        >
          Шаблони для магазинів
        </motion.h2>

        <div className="relative">
          {/* Ліва стрілка */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          {/* Права стрілка */}
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          {/* Картки шаблонів */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {visibleTemplates.map((template, index) => (
                <motion.div
                  key={`${template.id}-${currentIndex}`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onHoverStart={() => setHoveredTemplate(template.id)}
                  onHoverEnd={() => setHoveredTemplate(null)}
                  className="relative"
                >
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow">
                    {/* Прев'ю шаблону */}
                    <motion.div
                      animate={hoveredTemplate === template.id ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`h-64 bg-gradient-to-br ${template.color} flex items-center justify-center relative overflow-hidden`}
                    >
                      <div className="text-white text-6xl opacity-20 font-bold">
                        {template.name[0]}
                      </div>
                      
                      {/* Кнопка "Переглянути" при hover */}
                      <AnimatePresence>
                        {hoveredTemplate === template.id && (
                          <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-white text-gray-800 rounded-lg shadow-lg flex items-center gap-2 hover:bg-gray-100 font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Переглянути
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Назва шаблону */}
                    <div className="p-4 text-center">
                      <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
