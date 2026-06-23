import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Image, BookHeart, Package, Home, Menu, X, Download } from 'lucide-react';
import HomePage from './pages/Home';
import { dataExporter } from './utils/dataExporter';
import { dataImporter } from './utils/dataImporter';
import QuotesPage from './pages/Quotes';
import GalleryPage from './pages/Gallery';
import MoodPage from './pages/MoodLog';
import InventoryPage from './pages/Inventory';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/quotes', label: '语录', icon: Quote },
  { path: '/gallery', label: '画廊', icon: Image },
  { path: '/mood', label: '日志', icon: BookHeart },
  { path: '/inventory', label: '物品台账', icon: Package },
];

function Navigation() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async (mode: 'full' | 'data-only') => {
    await dataExporter.exportData(mode);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      let result;
      if (file.name.endsWith('.zip')) result = await dataImporter.importFromZip(file);
      else result = await dataImporter.importFromJson(file);
      if (result.success) {
        alert(result.missingImages.length > 0 ? `导入成功，但以下图片未找到：${result.missingImages.join(', ')}` : '导入成功！');
        window.location.reload();
      } else { alert('导入失败，请检查文件格式'); }
    } catch (error) { alert('导入失败：' + (error as Error).message); }
    finally { setImporting(false); e.target.value = ''; }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-indigo-700 font-medium">
            <span className="text-xl">个人空间</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Data Management */}
          <div className="relative group">
            <button className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors" title="数据管理">
              <Download size={18} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-stone-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button onClick={() => handleExport('full')} disabled={importing} className="w-full px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 first:rounded-t-lg disabled:opacity-50">导出完整包</button>
              <button onClick={() => handleExport('data-only')} disabled={importing} className="w-full px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50">导出数据</button>
              <label className="w-full px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 cursor-pointer last:rounded-b-lg block">
                <input type="file" accept=".json,.zip" onChange={handleImport} disabled={importing} className="hidden" />
                {importing ? '导入中...' : '导入数据'}
              </label>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-warm-white border-b border-stone-200"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-warm-white">
      <Navigation />
      <main className="pt-[5.5rem]">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/mood" element={<MoodPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
