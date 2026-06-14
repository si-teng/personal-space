import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Plus, Trash2, Edit3, Download, Upload, FileText,
  Smile, Frown, Meh, Calendar, Clock, X, Save, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MoodEntry, MoodTemplate, CustomMood, MoodFilter, STORAGE_KEYS } from '../types';
import { storage } from '../utils/storage';
import CustomMoodManager from '../components/CustomMoodManager';
import MoodFilterComponent from '../components/MoodFilter';

const DEFAULT_MOODS: CustomMood[] = [
  { id: 'happy', name: '开心', icon: '😊', color: '#f59e0b', isDefault: true },
  { id: 'neutral', name: '平静', icon: '😐', color: '#6b7280', isDefault: true },
  { id: 'sad', name: '低落', icon: '😔', color: '#3b82f6', isDefault: true },
];

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  return (
    <div className="flex gap-1 p-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><Bold size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><Italic size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded ${editor.isActive('underline') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><UnderlineIcon size={16} /></button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><List size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}><ListOrdered size={16} /></button>
    </div>
  );
}

export default function MoodLog() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [templates, setTemplates] = useState<MoodTemplate[]>([]);
  const [customMoods, setCustomMoods] = useState<CustomMood[]>(DEFAULT_MOODS);
  const [filter, setFilter] = useState<MoodFilter>({ dateRange: 'all', selectedMoods: [] });
  const [showEditor, setShowEditor] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [selectedMood, setSelectedMood] = useState('happy');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');

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
    const savedFilter = storage.get<MoodFilter>(STORAGE_KEYS.MOOD_FILTER);

    setEntries(savedEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setTemplates(savedTemplates);
    if (savedCustomMoods) {
      const defaultIds = DEFAULT_MOODS.map(m => m.id);
      const userMoods = savedCustomMoods.filter(m => !defaultIds.includes(m.id));
      setCustomMoods([...DEFAULT_MOODS, ...userMoods]);
    }
    if (savedFilter) {
      setFilter(savedFilter);
    }
  }, []);

  const saveEntries = useCallback((newEntries: MoodEntry[]) => {
    setEntries(newEntries);
    storage.set(STORAGE_KEYS.MOOD_ENTRIES, newEntries);
  }, []);

  const saveTemplates = useCallback((newTemplates: MoodTemplate[]) => {
    setTemplates(newTemplates);
    storage.set(STORAGE_KEYS.MOOD_TEMPLATES, newTemplates);
  }, []);

  const saveCustomMoods = useCallback((newMoods: CustomMood[]) => {
    setCustomMoods(newMoods);
    const userMoods = newMoods.filter(m => !m.isDefault);
    storage.set(STORAGE_KEYS.CUSTOM_MOODS, userMoods);
  }, []);

  const saveFilter = useCallback((newFilter: MoodFilter) => {
    setFilter(newFilter);
    storage.set(STORAGE_KEYS.MOOD_FILTER, newFilter);
  }, []);

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Date range filter
    if (filter.dateRange === 'thisMonth') {
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      result = result.filter(e => {
        const date = new Date(e.createdAt);
        return !isBefore(date, start) && !isAfter(date, end);
      });
    } else if (filter.dateRange === 'custom' && filter.startDate && filter.endDate) {
      const start = parseISO(filter.startDate);
      const end = parseISO(filter.endDate);
      result = result.filter(e => {
        const date = new Date(e.createdAt);
        return !isBefore(date, start) && !isAfter(date, end);
      });
    }

    // Mood filter
    if (filter.selectedMoods.length > 0) {
      result = result.filter(e => filter.selectedMoods.includes(e.mood));
    }

    return result;
  }, [entries, filter]);

  const handleSave = () => {
    const content = entryEditor?.getHTML() || '';
    if (!content.trim()) return;

    if (editingEntry) {
      const updated = entries.map(e => e.id === editingEntry.id ? { ...e, content, mood: selectedMood, templateId: selectedTemplate || undefined } : e);
      saveEntries(updated);
    } else {
      const newEntry: MoodEntry = {
        id: Date.now().toString(),
        content,
        mood: selectedMood,
        templateId: selectedTemplate || undefined,
        createdAt: new Date().toISOString(),
      };
      saveEntries([newEntry, ...entries]);
    }
    setShowEditor(false);
    setEditingEntry(null);
    setSelectedMood('happy');
    setSelectedTemplate('');
    entryEditor?.commands.setContent('');
  };

  const handleDelete = (id: string) => saveEntries(entries.filter(e => e.id !== id));

  const handleEdit = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setSelectedMood(entry.mood);
    setSelectedTemplate(entry.templateId || '');
    entryEditor?.commands.setContent(entry.content);
    setShowEditor(true);
  };

  const handleAddTemplate = () => {
    const content = templateEditor?.getHTML() || '';
    if (!newTemplateName.trim() || !content.trim()) return;
    const newTemplate: MoodTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      content,
      isDefault: false,
    };
    saveTemplates([...templates, newTemplate]);
    setNewTemplateName('');
    templateEditor?.commands.setContent('');
  };

  const handleDeleteTemplate = (id: string) => saveTemplates(templates.filter(t => t.id !== id));

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) entryEditor?.commands.setContent(template.content);
  };

  const handleExportCSV = () => {
    const csvData = filteredEntries.map(e => ({
      id: e.id,
      content: e.content.replace(/<[^>]*>/g, ''),
      mood: customMoods.find(m => m.id === e.mood)?.name || e.mood,
      templateId: e.templateId || '',
      createdAt: e.createdAt,
    }));
    const csv = storage.exportToCSV(csvData);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim());
      const newEntries: MoodEntry[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const entry: any = {};
        headers.forEach((h, idx) => entry[h] = values[idx]);
        if (entry.content) {
          newEntries.push({
            id: entry.id || Date.now().toString() + i,
            content: `<p>${entry.content}</p>`,
            mood: entry.mood || 'happy',
            templateId: entry.templateId || undefined,
            createdAt: entry.createdAt || new Date().toISOString(),
          });
        }
      }
      const merged = [...entries, ...newEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveEntries(merged);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const groupEntriesByDate = () => {
    const groups: Record<string, MoodEntry[]> = {};
    filteredEntries.forEach(entry => {
      const date = format(new Date(entry.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return groups;
  };

  const groupedEntries = groupEntriesByDate();

  const getMoodById = (id: string) => customMoods.find(m => m.id === id) || DEFAULT_MOODS[1];

  return (
    <div className="min-h-screen bg-warm-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">日志</h1>
            <p className="text-gray-500 text-sm mt-1">记录心情，追踪情绪变化</p>
          </div>
          <div className="flex gap-3">
            <MoodFilterComponent filter={filter} onFilterChange={saveFilter} customMoods={customMoods} />
            <button onClick={() => { setShowEditor(true); setEditingEntry(null); entryEditor?.commands.setContent(''); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
              <Plus className="w-4 h-4" />新建
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
              <Download className="w-4 h-4" />
            </button>
            <label className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
          </div>
        </div>

        <AnimatePresence>
          {showTemplates && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-medium text-gray-800 mb-4">模板管理</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {templates.map(template => (
                  <div key={template.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">{template.name}</span>
                      {!template.isDefault && (
                        <button onClick={() => handleDeleteTemplate(template.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-2 prose prose-sm" dangerouslySetInnerHTML={{ __html: template.content }} />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">新建模板</h4>
                <input type="text" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="模板名称" className="w-full px-4 py-2 border border-gray-200 rounded-xl mb-3" />
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <EditorToolbar editor={templateEditor} />
                  <div className="p-4 min-h-[120px] prose prose-sm max-w-none"><EditorContent editor={templateEditor} /></div>
                </div>
                <button onClick={handleAddTemplate} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">添加模板</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEditor && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">{editingEntry ? '编辑日志' : '新建日志'}</h3>
                <button onClick={() => setShowEditor(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-500">心情：</span>
                  <div className="flex flex-wrap gap-2">
                    {customMoods.map(mood => (
                      <button
                        key={mood.id}
                        onClick={() => setSelectedMood(mood.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                          selectedMood === mood.id
                            ? 'ring-2 ring-offset-1'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={{
                          backgroundColor: selectedMood === mood.id ? mood.color + '20' : undefined,
                          color: selectedMood === mood.id ? mood.color : undefined,
                          ringColor: mood.color,
                        }}
                      >
                        <span>{mood.icon}</span>
                        <span className="text-sm">{mood.name}</span>
                      </button>
                    ))}
                  </div>
                  <CustomMoodManager moods={customMoods} onMoodsChange={saveCustomMoods} />
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">模板：</span>
                  <select value={selectedTemplate} onChange={e => handleSelectTemplate(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                    <option value="">不使用</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-1 px-3 py-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 text-sm">
                    <FileText className="w-3.5 h-3.5" />管理模板
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <EditorToolbar editor={entryEditor} />
                <div className="p-4 min-h-[200px] prose prose-sm max-w-none"><EditorContent editor={entryEditor} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowEditor(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">取消</button>
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"><Save className="w-4 h-4" />保存</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{format(new Date(date), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}</span>
              </div>
              <div className="space-y-3">
                {dayEntries.map(entry => {
                  const mood = getMoodById(entry.mood);
                  return (
                    <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-xl"
                            style={{ backgroundColor: mood.color + '15' }}
                          >
                            <span className="text-xl" style={{ color: mood.color }}>{mood.icon}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{mood.name}</span>
                              {entry.templateId && <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{templates.find(t => t.id === entry.templateId)?.name}</span>}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><Clock className="w-3 h-3" />{format(new Date(entry.createdAt), 'HH:mm')}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(entry)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="mt-3 text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: entry.content }} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-gray-400" /></div>
              <p className="text-gray-500">{entries.length === 0 ? '还没有日志记录' : '没有符合条件的日志'}</p>
              <p className="text-gray-400 text-sm mt-1">{entries.length === 0 ? '点击上方"新建"开始记录' : '尝试调整筛选条件'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
