import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';

export function Footer() {
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
    <motion.footer
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5 }}
      className="min-h-screen snap-start snap-always bg-gray-900 text-white py-12 px-6"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Контактна інформація */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Контакти</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                <span>info@sitionix.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4" />
                <span>+38 (044) 123-45-67</span>
              </div>
            </div>
          </div>

          {/* Швидкі посилання */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Посилання</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  Політика конфіденційності
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  Умови використання
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition-colors">
                  Часті запитання
                </a>
              </li>
            </ul>
          </div>

          {/* Соціальні мережі */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Соціальні мережі</h3>
            <div className="flex gap-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, color: '#3b5998' }}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, color: '#E1306C' }}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, color: '#1DA1F2' }}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>© 2025 Sitionix. Всі права захищені.</p>
        </div>
      </div>
    </motion.footer>
  );
}
