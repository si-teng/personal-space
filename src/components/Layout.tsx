import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Quote, Image, BookHeart, Package } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/quotes', icon: Quote, label: '语录' },
  { path: '/gallery', icon: Image, label: '作品' },
  { path: '/mood', icon: BookHeart, label: '情绪' },
  { path: '/inventory', icon: Package, label: '物品' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-warm-white">
      <nav className="fixed top-0 left-0 h-full w-20 bg-white border-r border-gray-100 flex flex-col items-center py-8 z-50">
        <div className="mb-8">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
              >
                <item.icon size={20} />
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="pl-20 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8 max-w-6xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
