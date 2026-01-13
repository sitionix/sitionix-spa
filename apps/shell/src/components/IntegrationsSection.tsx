import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, CreditCard, Cpu } from 'lucide-react';

const integrations = [
  {
    title: 'Реклама',
    icon: Megaphone,
    services: ['Google Ads', 'Facebook Ads', 'Instagram Ads', 'TikTok Ads', 'LinkedIn Ads']
  },
  {
    title: 'Платежі',
    icon: CreditCard,
    services: ['Stripe', 'PayPal', 'Apple Pay', 'Google Pay', 'Visa/Mastercard']
  },
  {
    title: 'Автоматизація',
    icon: Cpu,
    services: ['Zapier', 'Make', 'HubSpot', 'Mailchimp', 'Slack']
  }
];

export function IntegrationsSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center mb-16"
        >
          Інтеграції
        </motion.h2>

        <div className="space-y-8">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            const isHovered = hoveredIndex === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.2 }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                className="relative"
              >
                <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{integration.title}</h3>
                  </div>
                </div>

                {/* Виїзний список інтеграцій */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: -20, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: 250 }}
                      exit={{ opacity: 0, x: -20, width: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute left-full top-0 ml-4 bg-white rounded-xl shadow-lg overflow-hidden z-10"
                    >
                      <div className="p-4">
                        <p className="text-sm font-medium mb-3 text-gray-500">Підтримувані сервіси:</p>
                        <ul className="space-y-2">
                          {integration.services.map((service, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="text-sm text-gray-700 flex items-center gap-2"
                            >
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              {service}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
