import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Download, Upload, Trash2, Edit2, X, Settings, Filter } from 'lucide-react';
import { Quote } from '../types';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../types';

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [activeTag, setActiveTag] = useState('全部');
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('全部');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [formData, setFormData] = useState({ content: '', author: '', source: '', tags: '' });

  const TAG_STORAGE = 'personal_space_quote_tags';

  // Daily random pick
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const pickDailyQuote = (list: Quote[]): Quote | null => {
    if (list.length === 0) return null;
    const today = getTodayStr();
    const stored = (() => { try { return JSON.parse(localStorage.getItem('quotes_daily') || 'null'); } catch { return null; } })();
    if (stored && stored.date === today && list.some(q => q.id === stored.id)) {
      return list.find(q => q.id === stored.id) || list[Math.floor(Math.random() * list.length)];
    }
    const randomPick = list[Math.floor(Math.random() * list.length)];
    localStorage.setItem('quotes_daily', JSON.stringify({ date: today, id: randomPick.id }));
    return randomPick;
  };

  const THEME_COLORS = [
    { name: '琥珀', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-400', tagBg: 'bg-amber-50', tagText: 'text-amber-700' },
    { name: '玫瑰', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', dot: 'bg-rose-400', tagBg: 'bg-rose-50', tagText: 'text-rose-700' },
    { name: '天空', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', dot: 'bg-sky-400', tagBg: 'bg-sky-50', tagText: 'text-sky-700' },
    { name: '翠绿', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-400', tagBg: 'bg-emerald-50', tagText: 'text-emerald-700' },
    { name: '紫罗兰', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', dot: 'bg-violet-400', tagBg: 'bg-violet-50', tagText: 'text-violet-700' },
    { name: '橘橙', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', dot: 'bg-orange-400', tagBg: 'bg-orange-50', tagText: 'text-orange-700' },
    { name: '青蓝', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', dot: 'bg-teal-400', tagBg: 'bg-teal-50', tagText: 'text-teal-700' },
    { name: '粉红', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', dot: 'bg-pink-400', tagBg: 'bg-pink-50', tagText: 'text-pink-700' },
    { name: '薄荷', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-400', tagBg: 'bg-green-50', tagText: 'text-green-600' },
    { name: '浅蓝', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400', tagBg: 'bg-blue-50', tagText: 'text-blue-600' },
    { name: '薰衣草', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-400', tagBg: 'bg-purple-50', tagText: 'text-purple-600' },
    { name: '暖灰', bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-700', dot: 'bg-stone-400', tagBg: 'bg-stone-50', tagText: 'text-stone-600' },
  ];
  const COLOR_MAP_STORAGE = 'personal_space_tag_colors';

  // Tag → colorIndex mapping
  const [tagColors, setTagColors] = useState<Record<string, number>>(() => {
    const saved = storage.get<Record<string, number>>(COLOR_MAP_STORAGE) || {};
    return saved;
  });

  const saveTagColors = (map: Record<string, number>) => {
    setTagColors(map);
    storage.set(COLOR_MAP_STORAGE, map);
  };

  // Auto-assign colors to new tags, migrate existing
  useEffect(() => {
    const allTags = Array.from(new Set(quotes.flatMap(q => q.tags)));
    let changed = false;
    const map = { ...tagColors };
    const usedColors = new Set(Object.values(map));
    for (const tag of allTags) {
      if (!(tag in map)) {
        // Pick an unused color or random
        const available = THEME_COLORS.map((_, i) => i).filter(i => !usedColors.has(i));
        const picked = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : Math.floor(Math.random() * THEME_COLORS.length);
        map[tag] = picked;
        usedColors.add(picked);
        changed = true;
      }
    }
    if (changed) { saveTagColors(map); }
  }, [quotes]);

  const getCardColor = (quote: Quote) => {
    const firstTag = quote.tags[0];
    if (firstTag && tagColors[firstTag] !== undefined) return THEME_COLORS[tagColors[firstTag]];
    return THEME_COLORS[0]; // fallback
  };

  useEffect(() => {
    const saved = storage.get<Quote[]>(STORAGE_KEYS.QUOTES) || [];
    setQuotes(saved);
    if (saved.length > 0) {
      const randomPick = saved[Math.floor(Math.random() * saved.length)];
      setSelectedQuote(randomPick);
    }
  }, []);

  useEffect(() => {
    if (isModalOpen || selectedQuote || showTagManager) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen, selectedQuote, showTagManager]);

  const saveQuotes = (newQuotes: Quote[]) => {
    setQuotes(newQuotes);
    storage.set(STORAGE_KEYS.QUOTES, newQuotes);
  };

  const selectQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    localStorage.setItem('quotes_daily', JSON.stringify({ date: getTodayStr(), id: quote.id }));
  };

  const EMOJIS = ['📖', '📝', '💡', '🌟', '✨', '💭', '📚', '🎯', '🌿', '🍃', '🎨', '🔖'];
  const getQuoteEmoji = (id: string): string => {
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return EMOJIS[sum % EMOJIS.length];
  };

  // Custom tag storage
  const [customTags, setCustomTags] = useState<string[]>(() => {
    const saved = storage.get<string[]>(TAG_STORAGE);
    return saved || [];
  });
  const saveCustomTags = (tags: string[]) => { setCustomTags(tags); storage.set(TAG_STORAGE, tags); };

  // All unique tags from quotes + custom
  const allTags = Array.from(new Set([
    ...quotes.flatMap(q => q.tags),
    ...customTags,
  ])).sort();

  // Available years from quotes
  const availableYears = Array.from(new Set(
    quotes.map(q => new Date(q.createdAt).getFullYear())
  )).sort((a, b) => b - a);

  const filteredQuotes = quotes.filter(q => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = q.content.toLowerCase().includes(query) ||
           q.author.toLowerCase().includes(query) ||
           q.createdAt.includes(query);
    const matchesTag = activeTag === '全部' || q.tags.includes(activeTag);
    // Time filter
    let matchesTime = true;
    if (selectedYear !== '全部') {
      const d = new Date(q.createdAt);
      if (d.getFullYear() !== parseInt(selectedYear)) matchesTime = false;
      else if (selectedMonths.length > 0 && !selectedMonths.includes(d.getMonth() + 1)) matchesTime = false;
    }
    return matchesSearch && matchesTag && matchesTime;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuote: Quote = {
      id: editingQuote?.id || Date.now().toString(),
      content: formData.content,
      author: formData.author,
      source: formData.source,
      createdAt: editingQuote?.createdAt || new Date().toISOString(),
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    if (editingQuote) {
      const updated = quotes.map(q => q.id === editingQuote.id ? newQuote : q);
      saveQuotes(updated);
      selectQuote(newQuote);
    } else {
      saveQuotes([newQuote, ...quotes]);
      selectQuote(newQuote);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    saveQuotes(quotes.filter(q => q.id !== id));
  };

  const openModal = (quote?: Quote) => {
    if (quote) {
      setEditingQuote(quote);
      setFormData({
        content: quote.content,
        author: quote.author,
        source: quote.source || '',
        tags: quote.tags.join(', ')
      });
    } else {
      setEditingQuote(null);
      setFormData({ content: '', author: '', source: '', tags: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuote(null);
    setFormData({ content: '', author: '', source: '', tags: '' });
  };

  const exportCSV = () => {
    const headers = ['内容', '作者', '出处', '标签', '创建时间'];
    const rows = filteredQuotes.map(q => [
      q.content,
      q.author,
      q.source || '',
      q.tags.join(';'),
      q.createdAt
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','))].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (csv: string): Partial<Quote>[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const result: Partial<Quote>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length >= 2 && values[0]) {
        result.push({
          content: values[0],
          author: values[1] || '未知',
          source: values[2] || undefined,
          tags: values[3] ? values[3].split(';').map(t => t.trim()).filter(Boolean) : [],
          createdAt: values[4] || new Date().toISOString()
        });
      }
    }
    return result;
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSV(content);
      const newQuotes: Quote[] = parsed.map(p => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: p.content || '',
        author: p.author || '未知',
        source: p.source,
        createdAt: p.createdAt || new Date().toISOString(),
        tags: p.tags || []
      }));
      if (newQuotes.length > 0) {
        saveQuotes([...newQuotes, ...quotes]);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddTag = () => {
    const name = newTagName.trim();
    if (!name || allTags.includes(name)) return;
    saveCustomTags([...customTags, name]);
    setNewTagName('');
  };
  const handleStartEditTag = (tag: string) => { setEditingTag(tag); setEditTagName(tag); };
  const handleSaveEditTag = () => {
    const newName = editTagName.trim();
    if (!newName || !editingTag || newName === editingTag) { setEditingTag(null); return; }
    if (allTags.includes(newName) && newName !== editingTag) { setEditingTag(null); return; }
    // Rename tag in all quotes
    const updatedQuotes = quotes.map(q => ({ ...q, tags: q.tags.map(t => t === editingTag ? newName : t) }));
    saveQuotes(updatedQuotes);
    // Update custom tags list
    saveCustomTags(customTags.map(t => t === editingTag ? newName : t));
    if (activeTag === editingTag) setActiveTag(newName);
    setEditingTag(null);
  };
  const handleDeleteTag = (tag: string) => {
    saveCustomTags(customTags.filter(t => t !== tag));
    if (activeTag === tag) setActiveTag('全部');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
      + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-warm-white px-3 sm:px-6 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">收藏语录</h1>
            <p className="text-stone-400 text-sm mt-0.5">
              用文字记录每一次感动
              {quotes.length > 0 && <span className="ml-2 text-stone-300">· {filteredQuotes.length}/{quotes.length} 条</span>}
              <button onClick={() => setShowTimeFilter(!showTimeFilter)} className={`ml-1.5 inline-flex items-center p-0.5 rounded transition ${selectedYear !== '全部' ? 'text-indigo-600' : 'text-stone-300 hover:text-stone-500'}`} title="时间筛选">
                <Filter size={14} />
              </button>
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery(''); }} className={`p-2 rounded-lg transition ${showSearch ? 'bg-indigo-100 text-indigo-600' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}>
              <Search size={18} />
            </button>
            <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <Plus size={18} /> 添加
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer text-stone-500">
              <Upload size={16} />
              <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
            </label>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition text-stone-500">
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <input
                type="text" placeholder="搜索语录内容、作者或日期..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-xl shadow-sm border-0 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time Filter Dropdown */}
        <AnimatePresence>
          {showTimeFilter && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 flex flex-wrap gap-4 items-start">
                {/* Year selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 shrink-0">年份</span>
                  <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); if (e.target.value === '全部') setSelectedMonths([]); }}
                    className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="全部">全部</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {/* Month multi-select */}
                {selectedYear !== '全部' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-stone-400 shrink-0">月份</span>
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <button key={m} onClick={() => {
                          setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
                        }}
                        className={`w-8 h-7 rounded-md text-xs transition-colors ${
                          selectedMonths.includes(m) ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}>{m}月</button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedYear !== '全部' && (
                  <button onClick={() => { setSelectedYear('全部'); setSelectedMonths([]); }}
                    className="text-xs text-stone-400 hover:text-stone-600 ml-auto">清除</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTag('全部')}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              activeTag === '全部' ? 'bg-indigo-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >全部</button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >{tag}</button>
          ))}
          <button onClick={() => setShowTagManager(true)} className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors ml-1">
            <Settings size={18} />
          </button>
        </div>

        {/* Quote Cards Grid — gallery style */}
        {filteredQuotes.length === 0 ? (
          <div className="text-center text-stone-300 py-20">
            <p className="text-5xl mb-3">📖</p>
            <p className="text-sm">还没有收藏语录，点击上方添加吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredQuotes.map((quote, index) => {
                const c = getCardColor(quote);
                return (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                    onClick={() => selectQuote(quote)}
                    className={`group ${c.bg} rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer border ${c.border}`}
                  >
                    <div className="aspect-[4/3] flex items-center justify-center p-4 relative">
                      {quote.source && (
                        <span className="absolute top-2 left-3 text-[10px] text-stone-400 tracking-widest">
                          《{quote.source}》
                        </span>
                      )}
                      <p className={`text-[13px] leading-relaxed ${c.text} font-medium text-justify line-clamp-5 indent-8`}>
                        {quote.content}
                      </p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-stone-600 truncate">— {quote.author}</span>
                        <span className="text-[10px] text-stone-400 ml-1 shrink-0">
                          {new Date(quote.createdAt).getFullYear()}.{new Date(quote.createdAt).getMonth() + 1}.{new Date(quote.createdAt).getDate()}
                        </span>
                      </div>
                      {quote.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {quote.tags.map(tag => (
                            <span key={tag} className={`px-1.5 py-0.5 text-[9px] rounded-full ${c.bg} ${c.text} border ${c.border}`}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={(e) => { e.stopPropagation(); openModal(quote); }} className="p-1 text-stone-400 hover:text-indigo-600 hover:bg-white rounded-md transition-colors">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(quote.id); if (selectedQuote?.id === quote.id) setSelectedQuote(null); }} className="p-1 text-stone-400 hover:text-red-600 hover:bg-white rounded-md transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Quote detail modal */}
      <AnimatePresence>
        {selectedQuote && (() => {
          const c = getCardColor(selectedQuote);
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedQuote(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className={`${c.bg} rounded-2xl p-8 md:p-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl border ${c.border}`}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6">
                  {selectedQuote.source && (
                    <span className="text-sm text-stone-400 tracking-widest">《{selectedQuote.source}》</span>
                  )}
                  {!selectedQuote.source && <span />}
                  <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-black/5 rounded-lg"><X size={20} /></button>
                </div>
                <p className={`text-xl md:text-2xl leading-[1.8] tracking-wide ${c.text} font-medium text-justify indent-8`}>
                  {selectedQuote.content}
                </p>
                <div className="flex items-center justify-center gap-3 my-6">
                  <div className={`h-px flex-1 max-w-12 ${c.bg} border-t ${c.border}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  <div className={`h-px flex-1 max-w-12 ${c.bg} border-t ${c.border}`} />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-base font-semibold text-stone-700">— {selectedQuote.author}</span>
                </div>
                <p className="text-center text-xs text-stone-400 mt-3">
                  {formatDate(selectedQuote.createdAt)}
                </p>
                {selectedQuote.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                    {selectedQuote.tags.map(tag => (
                      <span key={tag} className={`px-2.5 py-1 text-[11px] rounded-full ${c.bg} ${c.text} border ${c.border}`}>{tag}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Tag Manager Modal */}
      {showTagManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowTagManager(false); setEditingTag(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-800">管理标签</h3>
              <button onClick={() => { setShowTagManager(false); setEditingTag(null); }} className="p-2 hover:bg-stone-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {allTags.map(tag => (
                <div key={tag} className="flex items-center gap-2">
                  {editingTag === tag ? (
                    <>
                      <input value={editTagName} onChange={e => setEditTagName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEditTag(); if (e.key === 'Escape') setEditingTag(null); }}
                        className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" autoFocus />
                      <button onClick={handleSaveEditTag} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => setEditingTag(null)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <div className={`w-4 h-4 rounded-full shrink-0 ${THEME_COLORS[tagColors[tag] ?? 0].dot}`} />
                      <span className="flex-1 px-3 py-2 bg-stone-50 rounded-lg text-sm text-stone-700">{tag}</span>
                      {/* Color picker */}
                      <select
                        value={tagColors[tag] ?? 0}
                        onChange={e => saveTagColors({ ...tagColors, [tag]: parseInt(e.target.value) })}
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] border border-stone-200 rounded px-1 py-1 bg-white"
                      >
                        {THEME_COLORS.map((tc, i) => (
                          <option key={i} value={i}>{tc.name}</option>
                        ))}
                      </select>
                      <button onClick={() => handleStartEditTag(tag)} className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteTag(tag)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              ))}
              {allTags.length === 0 && <p className="text-sm text-stone-400 text-center py-4">暂无标签</p>}
            </div>
            <div className="flex items-center gap-2 border-t border-stone-100 pt-4">
              <input value={newTagName} onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); }}
                placeholder="输入新标签名称" className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              <button onClick={handleAddTag} disabled={!newTagName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">添加</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingQuote ? '编辑语录' : '添加语录'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                placeholder="语录内容" value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[100px]" required
              />
              <input
                placeholder="作者" value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" required
              />
              <input
                placeholder="出处（可选）" value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <input
                  placeholder="标签（用逗号分隔）" value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {allTags.map(tag => (
                      <button key={tag} type="button"
                        onClick={() => {
                          const current = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                          const newTags = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
                          setFormData({ ...formData, tags: newTags.join(', ') });
                        }}
                        className={`px-2 py-0.5 text-[11px] rounded-full transition-colors ${
                          formData.tags.split(',').map(t => t.trim()).includes(tag)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-stone-100 text-stone-500 hover:bg-indigo-100 hover:text-indigo-600'
                        }`}>{tag}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
