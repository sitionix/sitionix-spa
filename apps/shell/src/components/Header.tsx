import { Globe } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Page = 'home' | 'register' | 'login';

interface HeaderProps {
  onNavigate: (page: Page) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Українська');

  const languages = ['Українська', 'English', 'Русский'];

  return (
    <header className="h-20 w-full bg-white shadow-sm fixed top-0 left-0 z-50">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Логотип */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 transition-transform hover:scale-105"
        >
          <div className="h-12 flex items-center">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sitionix
            </span>
          </div>
        </button>

        <div className="flex items-center gap-6">
          {/* Навігація "Тарифи" */}
          <button className="text-gray-700 hover:text-blue-600 transition-colors relative group">
            Тарифи
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
          </button>

          {/* Вибір мови */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Globe className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{selectedLanguage}</span>
            </button>

            <AnimatePresence>
              {showLanguageMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/20 -z-10"
                    onClick={() => setShowLanguageMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setShowLanguageMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors text-gray-700"
                      >
                        {lang}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Кнопка "Увійти" */}
          <motion.button
            onClick={() => onNavigate('login')}
            whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Увійти
          </motion.button>

          {/* Кнопка "Зареєструватись" */}
          <motion.button
            onClick={() => onNavigate('register')}
            whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Зареєструватись
          </motion.button>
        </div>
      </div>
    </header>
  );
}
