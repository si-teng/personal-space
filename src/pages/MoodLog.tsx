import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Plus, Trash2, Edit3, Download, Upload, FileText, Filter, Settings,
  X, Save, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered
} from 'lucide-react';
import { format } from 'date-fns';
import { MoodEntry, MoodTemplate, CustomMood, STORAGE_KEYS } from '../types';
import { storage } from '../utils/storage';
import CustomMoodManager from '../components/CustomMoodManager';

const DEFAULT_MOODS: CustomMood[] = [
  { id: 'happy', name: '开心', icon: '😊', color: '#f59e0b', isDefault: true },
  { id: 'neutral', name: '平静', icon: '😐', color: '#6b7280', isDefault: true },
  { id: 'sad', name: '低落', icon: '😔', color: '#3b82f6', isDefault: true },
];

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  return (
    <div className="flex gap-1 p-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><Bold size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><Italic size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded ${editor.isActive('underline') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><UnderlineIcon size={16} /></button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><List size={16} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><ListOrdered size={16} /></button>
    </div>
  );
}

export default function MoodLog() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [templates, setTemplates] = useState<MoodTemplate[]>([]);
  const [customMoods, setCustomMoods] = useState<CustomMood[]>(DEFAULT_MOODS);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [selectedMood, setSelectedMood] = useState('happy');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth() + 1]);
  const [activeMood, setActiveMood] = useState('全部');
  const [showMoodManager, setShowMoodManager] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [mobileShowFilter, setMobileShowFilter] = useState(false);

  const entryEditor = useEditor({
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: '记录此刻的心情...' })],
    content: '',
  });
  const templateEditor = useEditor({
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: '编辑模板内容...' })],
    content: '',
  });

  useEffect(() => {
    const savedEntries = storage.get<MoodEntry[]>(STORAGE_KEYS.MOOD_ENTRIES) || [];
    const savedTemplates = storage.get<MoodTemplate[]>(STORAGE_KEYS.MOOD_TEMPLATES) || [
      { id: '1', name: '日常记录', content: '<p>今天发生了什么事？</p><p>我的感受：</p>', isDefault: true },
      { id: '2', name: '感恩日记', content: '<p>今天值得感恩的三件事：</p><ul><li></li><li></li><li></li></ul>', isDefault: true },
    ];
    const savedCustomMoods = storage.get<CustomMood[]>(STORAGE_KEYS.CUSTOM_MOODS);
    setEntries(savedEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setTemplates(savedTemplates);
    if (savedCustomMoods) {
      const defaultIds = DEFAULT_MOODS.map(m => m.id);
      setCustomMoods([...DEFAULT_MOODS, ...savedCustomMoods.filter(m => !defaultIds.includes(m.id))]);
    }
  }, []);

  // Set editor content when editing after remount
  useEffect(() => {
    if (showEditor && editingEntry && entryEditor) {
      const timer = setTimeout(() => entryEditor.commands.setContent(editingEntry.content), 80);
      return () => clearTimeout(timer);
    }
  }, [editorKey, showEditor]);

  const saveEntries = useCallback((newEntries: MoodEntry[]) => { setEntries(newEntries); storage.set(STORAGE_KEYS.MOOD_ENTRIES, newEntries); }, []);
  const saveTemplates = useCallback((newTemplates: MoodTemplate[]) => { setTemplates(newTemplates); storage.set(STORAGE_KEYS.MOOD_TEMPLATES, newTemplates); }, []);
  const saveCustomMoods = useCallback((newMoods: CustomMood[]) => { setCustomMoods(newMoods); storage.set(STORAGE_KEYS.CUSTOM_MOODS, newMoods.filter(m => !m.isDefault)); }, []);

  const availableYears = Array.from(new Set(entries.map(e => new Date(e.createdAt).getFullYear()))).sort((a, b) => b - a);

  const filteredEntries = useMemo(() => {
    let result = [...entries];
    if (selectedYear !== '全部') {
      result = result.filter(e => {
        const d = new Date(e.createdAt);
        if (d.getFullYear() !== parseInt(selectedYear)) return false;
        if (selectedMonths.length > 0 && !selectedMonths.includes(d.getMonth() + 1)) return false;
        return true;
      });
    }
    if (activeMood !== '全部') result = result.filter(e => e.mood === activeMood);
    return result;
  }, [entries, selectedYear, selectedMonths, activeMood]);

  const resetEditor = () => {
    setEditingEntry(null); setSelectedMood('happy'); setSelectedTemplate('');
    entryEditor?.commands.clearContent(true);
  };

  const handleSave = () => {
    const content = entryEditor?.getHTML() || '';
    if (!content.trim() || !content.replace(/<[^>]*>/g, '').trim()) return;
    if (editingEntry) {
      saveEntries(entries.map(e => e.id === editingEntry.id ? { ...e, content, mood: selectedMood, templateId: selectedTemplate || undefined } : e));
    } else {
      saveEntries([{ id: Date.now().toString(), content, mood: selectedMood, templateId: selectedTemplate || undefined, createdAt: new Date().toISOString() }, ...entries]);
    }
    setShowEditor(false); resetEditor(); setEditorKey(k => k + 1);
  };
  const handleDelete = (id: string) => { saveEntries(entries.filter(e => e.id !== id)); if (selectedEntry?.id === id) setSelectedEntry(null); };
  const handleEdit = (entry: MoodEntry) => { setEditingEntry(entry); setSelectedMood(entry.mood); setSelectedTemplate(entry.templateId || ''); setEditorKey(k => k + 1); setShowEditor(true); };
  const handleNew = () => { setEditorKey(k => k + 1); resetEditor(); setShowEditor(true); };
  const handleCancelEdit = () => { setShowEditor(false); resetEditor(); setEditorKey(k => k + 1); };

  const handleAddTemplate = () => {
    const content = templateEditor?.getHTML() || '';
    if (!newTemplateName.trim() || !content.trim()) return;
    saveTemplates([...templates, { id: Date.now().toString(), name: newTemplateName, content, isDefault: false }]);
    setNewTemplateName(''); templateEditor?.commands.setContent('');
  };
  const handleDeleteTemplate = (id: string) => saveTemplates(templates.filter(t => t.id !== id));
  const handleSelectTemplate = (templateId: string) => { setSelectedTemplate(templateId); const t = templates.find(t => t.id === templateId); if (t) entryEditor?.commands.setContent(t.content); };

  const handleExportCSV = () => {
    const csvData = filteredEntries.map(e => ({ id: e.id, content: e.content.replace(/<[^>]*>/g, ''), mood: customMoods.find(m => m.id === e.mood)?.name || e.mood, templateId: e.templateId || '', createdAt: e.createdAt }));
    const csv = storage.exportToCSV(csvData);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `mood-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
  };
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim()); if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim());
      const newEntries: MoodEntry[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const entry: any = {}; headers.forEach((h, idx) => entry[h] = values[idx]);
        if (entry.content) newEntries.push({ id: entry.id || Date.now().toString() + i, content: `<p>${entry.content}</p>`, mood: entry.mood || 'happy', templateId: entry.templateId || undefined, createdAt: entry.createdAt || new Date().toISOString() });
      }
      saveEntries([...entries, ...newEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    reader.readAsText(file); e.target.value = '';
  };

  const getMoodById = (id: string) => customMoods.find(m => m.id === id) || DEFAULT_MOODS[1];
  const getPreview = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  return (
    <div className="min-h-screen bg-warm-white px-3 sm:px-6 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">日志</h1>
            <p className="text-stone-400 text-sm mt-0.5">
              记录心情，追踪情绪变化
              {entries.length > 0 && <span className="ml-2 text-stone-300">· {filteredEntries.length}/{entries.length} 条</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <Plus size={18} /> 新建
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition text-stone-500"><Download size={16} /></button>
            <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer text-stone-500"><Upload size={16} /><input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" /></label>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* ===== Left Column — 30% ===== */}
          <div className="w-full md:w-[30%] min-w-0">
            {/* Mobile filter toggle */}
            <button onClick={() => setMobileShowFilter(!mobileShowFilter)} className={`md:hidden flex items-center gap-1.5 text-xs mb-3 px-3 py-1.5 rounded-full transition ${selectedYear !== new Date().getFullYear().toString() || selectedMonths.length !== 1 || selectedMonths[0] !== new Date().getMonth() + 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-stone-500 border border-stone-200'}`}>
              <Filter size={13} /> 时间筛选 {selectedYear !== '全部' ? `(${selectedYear}年)` : ''}
            </button>
            {/* Date Filter Box — hidden on mobile unless toggled */}
            <div className={`bg-white rounded-2xl shadow-sm border border-stone-100 p-5 mb-4 ${mobileShowFilter ? '' : 'hidden'} md:block`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-stone-600">时间筛选</span>
                <div className="flex items-center gap-2">
                  <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); if (e.target.value === '全部') setSelectedMonths([]); }}
                    className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="全部">全部年份</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                  {selectedYear !== '全部' && (
                    <button onClick={() => { setSelectedYear('全部'); setSelectedMonths([]); }}
                      className="text-xs text-stone-400 hover:text-stone-600">清除</button>
                  )}
                </div>
              </div>
              {/* Month grid — 3 rows x 4 cols */}
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <button key={m} onClick={() => setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${
                      selectedYear === '全部' ? 'bg-stone-50 text-stone-300 cursor-not-allowed' :
                      selectedMonths.includes(m) ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                    disabled={selectedYear === '全部'}>{m}月</button>
                ))}
              </div>
            </div>

            {/* Mood Filter */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button onClick={() => setActiveMood('全部')} className={`px-3 py-1.5 rounded-full text-xs transition-colors ${activeMood === '全部' ? 'bg-indigo-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}>全部</button>
              {customMoods.map(mood => (
                <button key={mood.id} onClick={() => setActiveMood(mood.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${activeMood === mood.id ? 'bg-indigo-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}>
                  <span className="text-sm">{mood.icon}</span> {mood.name}
                </button>
              ))}
              <button onClick={() => setShowMoodManager(true)} className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"><Settings size={16} /></button>
            </div>

            {/* Card Grid — 3 per row */}
            {filteredEntries.length === 0 ? (
              <div className="text-center text-stone-300 py-12">
                <p className="text-4xl mb-2">📔</p>
                <p className="text-sm">{entries.length === 0 ? '还没有日志记录' : '没有符合条件的日志'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <AnimatePresence>
                  {filteredEntries.map(entry => {
                    const mood = getMoodById(entry.mood);
                    const preview = getPreview(entry.content);
                    const isSelected = selectedEntry?.id === entry.id;
                    return (
                      <motion.div key={entry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} layout
                        onClick={() => setSelectedEntry(entry)}
                        className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 ${isSelected ? 'border-indigo-400 shadow-md' : 'border-transparent'}`}>
                        <div className="aspect-[4/3] bg-stone-50 flex items-center justify-center p-3">
                          <div className="text-center">
                            <span className="text-2xl block mb-1">{mood.icon}</span>
                            <p className="text-[11px] leading-snug text-stone-500 line-clamp-3">{preview || '(空)'}</p>
                          </div>
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-stone-600">{mood.name}</span>
                          <span className="text-[9px] text-stone-400">{new Date(entry.createdAt).getMonth() + 1}.{new Date(entry.createdAt).getDate()}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ===== Right Column — 70% ===== */}
          {/* Desktop: inline | Mobile: overlay when active */}
          <div className={`w-full md:flex-1 min-w-0 ${(selectedEntry || showEditor) ? 'fixed inset-0 z-50 bg-warm-white md:bg-transparent md:static overflow-y-auto p-4 md:p-0' : 'hidden md:block'}`}>
            {(selectedEntry || showEditor) && (
              <button onClick={() => { setSelectedEntry(null); handleCancelEdit(); }} className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-full shadow"><X size={20} /></button>
            )}
            <div className="space-y-4">
              {/* Preview Panel */}
              {!showEditor && selectedEntry && (() => {
                const mood = getMoodById(selectedEntry.mood);
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{mood.icon}</span>
                          <span className="font-semibold text-stone-700">{mood.name}</span>
                          {selectedEntry.templateId && <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{templates.find(t => t.id === selectedEntry.templateId)?.name}</span>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(selectedEntry)} className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 size={14} /></button>
                          <button onClick={() => handleDelete(selectedEntry.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-400 mb-3">
                        {new Date(selectedEntry.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {' '}{new Date(selectedEntry.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="prose max-w-none text-stone-600 text-base" dangerouslySetInnerHTML={{ __html: selectedEntry.content }} />
                    </div>
                  </div>
                );
              })()}

              {/* Editor Panel */}
              {showEditor && (
                <div key={editorKey} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-stone-800">{editingEntry ? '编辑日志' : '新建日志'}</h3>
                      <button onClick={handleCancelEdit} className="p-1.5 hover:bg-stone-100 rounded-lg"><X size={18} /></button>
                    </div>
                    {/* Mood */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs text-stone-400">心情：</span>
                      {customMoods.map(mood => (
                        <button key={mood.id} type="button" onClick={() => setSelectedMood(mood.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${selectedMood === mood.id ? 'ring-2 ring-indigo-400 bg-white font-medium' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                          <span>{mood.icon}</span> {mood.name}
                        </button>
                      ))}
                      <CustomMoodManager moods={customMoods} onMoodsChange={saveCustomMoods} />
                    </div>
                    {/* Template */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-stone-400">模板：</span>
                      <select value={selectedTemplate} onChange={e => handleSelectTemplate(e.target.value)} className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white">
                        <option value="">不使用</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setShowTemplates(!showTemplates)} className="text-xs text-indigo-600 hover:underline"><FileText size={12} className="inline mr-0.5" />模板管理</button>
                    </div>
                    {/* Templates panel */}
                    <AnimatePresence>
                      {showTemplates && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3 border border-stone-100 rounded-xl p-3 bg-stone-50">
                          <div className="space-y-2 mb-3">
                            {templates.map(t => (
                              <div key={t.id} className="flex items-center justify-between text-xs"><span className="font-medium text-stone-600">{t.name}</span>{!t.isDefault && <button type="button" onClick={() => handleDeleteTemplate(t.id)} className="text-stone-400 hover:text-red-500"><Trash2 size={12} /></button>}</div>
                            ))}
                          </div>
                          <input type="text" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="新模板名称" className="w-full px-3 py-1.5 border rounded-lg text-xs mb-2" />
                          <div className="border rounded-lg overflow-hidden mb-2"><EditorToolbar editor={templateEditor} /><div className="p-2 min-h-[80px] prose prose-sm max-w-none text-xs"><EditorContent editor={templateEditor} /></div></div>
                          <button type="button" onClick={handleAddTemplate} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs">添加模板</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Editor */}
                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                      <EditorToolbar editor={entryEditor} />
                      <div className="p-3 min-h-[250px] prose prose-sm max-w-none"><EditorContent editor={entryEditor} /></div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-xl">取消</button>
                      <button type="button" onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"><Save size={14} />保存</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty right panel */}
              {!showEditor && !selectedEntry && (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="aspect-[4/3] bg-stone-50 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl block mb-3 opacity-50">📝</span>
                      <p className="text-sm text-stone-400">选择左侧日志卡片</p>
                      <p className="text-xs text-stone-300 mt-1">或点击上方新建开始记录</p>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm font-medium text-stone-400 text-center">今天的心情如何？</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mood Manager Modal */}
        {showMoodManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMoodManager(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">管理心情标签</h3><button onClick={() => setShowMoodManager(false)} className="p-2 hover:bg-stone-100 rounded-lg"><X size={20} /></button></div>
              <CustomMoodManager moods={customMoods} onMoodsChange={saveCustomMoods} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
