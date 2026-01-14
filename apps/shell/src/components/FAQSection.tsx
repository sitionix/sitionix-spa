import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Як створити магазин?',
    answer: 'Створення магазину займає всього кілька хвилин. Натисніть кнопку "Створити", виберіть шаблон, налаштуйте дизайн та додайте товари. Все інтуїтивно зрозуміло!'
  },
  {
    question: 'Які типи магазинів можна створити?',
    answer: 'Ми пропонуємо шаблони для різних ніш: одяг, електроніка, їжа та напої, товари для дому, зоомагазини та багато інших категорій.'
  },
  {
    question: 'Яка вартість послуг?',
    answer: 'У нас є різні тарифні плани на будь-який бюджет. Є безкоштовний тариф для початківців та преміум-плани з розширеними можливостями.'
  },
  {
    question: 'Як зв\'язатися зі службою підтримки?',
    answer: 'Наша підтримка працює 24/7. Ви можете написати нам через чат на сайті, надіслати email або зателефонувати за вказаним номером.'
  },
  {
    question: 'Чи є безкоштовний пробний період?',
    answer: 'Так! Ми надаємо 14-денний безкоштовний пробний період для всіх преміум-функцій без обмежень.'
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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
    <section ref={ref} className="min-h-screen snap-start snap-always py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center mb-16"
        >
          Часті запитання
        </motion.h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="pr-4 text-gray-800 font-medium">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
