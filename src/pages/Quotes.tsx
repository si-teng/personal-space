import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Download, Upload, Trash2, Edit2, X } from 'lucide-react';
import { Quote } from '../types';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../types';

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState({ content: '', author: '', source: '', tags: '' });

  useEffect(() => {
    const saved = storage.get<Quote[]>(STORAGE_KEYS.QUOTES) || [];
    setQuotes(saved);
  }, []);

  const saveQuotes = (newQuotes: Quote[]) => {
    setQuotes(newQuotes);
    storage.set(STORAGE_KEYS.QUOTES, newQuotes);
  };

  const filteredQuotes = quotes.filter(q => {
    const query = searchQuery.toLowerCase();
    return q.content.toLowerCase().includes(query) ||
           q.author.toLowerCase().includes(query) ||
           q.createdAt.includes(query);
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
      saveQuotes(quotes.map(q => q.id === editingQuote.id ? newQuote : q));
    } else {
      saveQuotes([newQuote, ...quotes]);
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
    const rows = quotes.map(q => [
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

  return (
    <div className="min-h-screen bg-warm-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">收藏语录</h1>
          <div className="flex gap-3">
            <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <Plus size={18} /> 添加
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer">
              <Upload size={18} />
              <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
              
            </label>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition">
              <Download size={18} /> 
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜索语录内容、作者或日期..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-sm border-0 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredQuotes.map((quote) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition"
              >
                <p className="text-lg text-gray-700 mb-4 leading-relaxed">{quote.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-indigo-600">{quote.author}</span>
                    {quote.source && <span>《{quote.source}》</span>}
                    <span>{new Date(quote.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(quote)} className="p-2 text-gray-400 hover:text-indigo-600 transition">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(quote.id)} className="p-2 text-gray-400 hover:text-red-600 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {quote.tags.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {quote.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingQuote ? '编辑语录' : '添加语录'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  placeholder="语录内容"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  required
                />
                <input
                  placeholder="作者"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  placeholder="出处（可选）"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  placeholder="标签（用逗号分隔）"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">取消</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
