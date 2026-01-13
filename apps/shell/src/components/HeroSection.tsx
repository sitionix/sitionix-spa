import { motion } from 'motion/react';
import { MousePointer2, Sparkles, Layout } from 'lucide-react';

type Page = 'home' | 'register' | 'login';

interface HeroSectionProps {
  onNavigate: (page: Page) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section className="min-h-screen snap-start snap-always flex items-center justify-center px-6 py-20">
      <div className="max-w-7xl w-full mx-auto">
        {/* Гасло */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-12"
        >
          Ваше коштовне місце в Інтернеті.
        </motion.h1>

        <div className="flex items-center justify-between gap-12">
          {/* Анімована картинка зліва */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-1 relative"
          >
            <AnimatedWebsiteCreation />
          </motion.div>

          {/* Кнопка "Створити" справа */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-1 flex justify-center"
          >
            <motion.button
              onClick={() => onNavigate('register')}
              whileHover={{ 
                scale: 1.05, 
                backgroundColor: '#2563eb',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
              }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg text-xl"
            >
              Створити
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AnimatedWebsiteCreation() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
        {/* Імітація браузера */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 bg-gray-100 rounded px-3 py-1 text-xs text-gray-500">
            www.mystore.sitionix.com
          </div>
        </div>

        {/* Анімований контент */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1 }}
            className="h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded mb-4 flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>

          {/* Текстові поля */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 1.4 }}
            className="h-4 bg-gray-200 rounded mb-2 w-3/4"
          ></motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 1.6 }}
            className="h-4 bg-gray-200 rounded mb-4 w-1/2"
          ></motion.div>

          {/* Кнопки */}
          <div className="flex gap-3 mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1.8 }}
              className="flex-1 h-10 bg-blue-500 rounded flex items-center justify-center"
            >
              <Layout className="w-4 h-4 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 2 }}
              className="flex-1 h-10 bg-purple-500 rounded"
            ></motion.div>
          </div>

          {/* Курсор анімований */}
          <motion.div
            animate={{
              x: [0, 100, 100, 50, 50, 0],
              y: [0, 0, 50, 50, 100, 100]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-10 left-10"
          >
            <MousePointer2 className="w-6 h-6 text-blue-600" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
