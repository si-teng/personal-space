import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, X, Save, Palette } from 'lucide-react';
import { CustomMood } from '../types';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#f43f5e', '#78716c', '#374151',
];

const EMOJI_LIBRARY = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫',
  '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
  '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
  '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸',
  '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲',
  '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱',
  '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠',
  '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻',
  '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀',
  '😿', '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
  '⭐', '🌟', '✨', '⚡', '🔥', '💥', '💫', '🌈', '☀️', '🌤️',
  '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️',
];

const KAOMOJI_LIBRARY = [
  '(◕‿◕)', '(｡♥‿♥｡)', '(◠‿◠)', '(◕‿◕✿)', '(◠‿◠✿)',
  '(◕‿◕)ノ', '(｡◕‿◕｡)', '(◠‿◠)ノ', '(◕‿◕✿)ノ', '(◠‿◠✿)ノ',
  '(╯°□°）╯', '(╯°□°)╯', '(╯°□°)╯︵', '(╯°□°)╯︵ ┻━┻',
  '(╯°□°)╯︵ ┻━┻ ︵ ╯(°□° ╯)', '(╯°□°)╯︵ ┻━┻ ︵ ╯(°□° ╯)',
  '(ಠ_ಠ)', '(ಠ‿ಠ)', '(ಠ_ಠ)ノ', '(ಠ‿ಠ)ノ', '(ಠ_ಠ)┌',
  '(╥﹏╥)', '(╥_╥)', '(╥﹏╥)ノ', '(╥_╥)ノ', '(╥﹏╥)┌',
  '(◡‿◡)', '(◡‿◡)ノ', '(◡‿◡)✿', '(◡‿◡)✿ノ', '(◡‿◡)✿┌',
  '(｡◕‿◕｡)', '(｡◕‿◕｡)ノ', '(｡◕‿◕｡)✿', '(｡◕‿◕｡)✿ノ', '(｡◕‿◕｡)✿┌',
  '(◠‿◠)', '(◠‿◠)ノ', '(◠‿◠)✿', '(◠‿◠)✿ノ', '(◠‿◠)✿┌',
  '(◕‿◕)', '(◕‿◕)ノ', '(◕‿◕)✿', '(◕‿◕)✿ノ', '(◕‿◕)✿┌',
  '(✿◠‿◠)', '(✿◠‿◠)ノ', '(✿◠‿◠)✿', '(✿◠‿◠)✿ノ', '(✿◠‿◠)✿┌',
  '(◠‿◠)✿', '(◠‿◠)✿ノ', '(◠‿◠)✿┌', '(◠‿◠)✿✿', '(◠‿◠)✿✿ノ',
  '(◕‿◕)✿', '(◕‿◕)✿ノ', '(◕‿◕)✿┌', '(◕‿◕)✿✿', '(◕‿◕)✿✿ノ',
  '(｡♥‿♥｡)', '(｡♥‿♥｡)ノ', '(｡♥‿♥｡)✿', '(｡♥‿♥｡)✿ノ', '(｡♥‿♥｡)✿┌',
  '(◠‿◠)♥', '(◠‿◠)♥ノ', '(◠‿◠)♥┌', '(◠‿◠)♥♥', '(◠‿◠)♥♥ノ',
  '(◕‿◕)♥', '(◕‿◕)♥ノ', '(◕‿◕)♥┌', '(◕‿◕)♥♥', '(◕‿◕)♥♥ノ',
];

const SPECIAL_CHARS = [
  '★', '☆', '✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮',
  '✯', '✰', '✱', '✲', '✳', '✴', '✵', '✶', '✷', '✸',
  '✹', '✺', '✻', '✼', '✽', '✾', '✿', '❀', '❁', '❂',
  '❃', '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋', '❖',
  '♠', '♥', '♦', '♣', '♤', '♡', '♢', '♧', '☀', '☁',
  '☂', '☃', '☄', '★', '☆', '☇', '☈', '☉', '☊', '☋',
  '☌', '☍', '☎', '☏', '☐', '☑', '☒', '☓', '☔', '☕',
  '☖', '☗', '☘', '☙', '☚', '☛', '☜', '☝', '☞', '☟',
  '☠', '☡', '☢', '☣', '☤', '☥', '☦', '☧', '☨', '☩',
  '☪', '☫', '☬', '☭', '☮', '☯', '☰', '☱', '☲', '☳',
];

interface CustomMoodManagerProps {
  moods: CustomMood[];
  onMoodsChange: (moods: CustomMood[]) => void;
}

export default function CustomMoodManager({ moods, onMoodsChange }: CustomMoodManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMood, setEditingMood] = useState<CustomMood | null>(null);
  const [moodName, setMoodName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('😀');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [activeTab, setActiveTab] = useState<'emoji' | 'kaomoji' | 'special'>('emoji');

  const handleAdd = () => {
    if (!moodName.trim()) return;
    const newMood: CustomMood = {
      id: Date.now().toString(),
      name: moodName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      isDefault: false,
    };
    onMoodsChange([...moods, newMood]);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingMood || !moodName.trim()) return;
    const updated = moods.map(m =>
      m.id === editingMood.id
        ? { ...m, name: moodName.trim(), icon: selectedIcon, color: selectedColor }
        : m
    );
    onMoodsChange(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    onMoodsChange(moods.filter(m => m.id !== id));
  };

  const handleEdit = (mood: CustomMood) => {
    setEditingMood(mood);
    setMoodName(mood.name);
    setSelectedIcon(mood.icon);
    setSelectedColor(mood.color);
  };

  const resetForm = () => {
    setEditingMood(null);
    setMoodName('');
    setSelectedIcon('😀');
    setSelectedColor('#3b82f6');
  };

  const getIconLibrary = () => {
    switch (activeTab) {
      case 'emoji': return EMOJI_LIBRARY;
      case 'kaomoji': return KAOMOJI_LIBRARY;
      case 'special': return SPECIAL_CHARS;
      default: return EMOJI_LIBRARY;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
      >
        <Palette className="w-4 h-4" />
        <span>自定义心情</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">自定义心情</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                {/* Existing Moods */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">已有心情</h3>
                  <div className="flex flex-wrap gap-2">
                    {moods.map(mood => (
                      <div
                        key={mood.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all"
                        style={{ borderColor: mood.color + '40', backgroundColor: mood.color + '10' }}
                      >
                        <span className="text-lg">{mood.icon}</span>
                        <span className="text-sm font-medium" style={{ color: mood.color }}>
                          {mood.name}
                        </span>
                        {!mood.isDefault && (
                          <>
                            <button
                              onClick={() => handleEdit(mood)}
                              className="p-1 hover:bg-white/50 rounded"
                            >
                              <Edit3 className="w-3 h-3 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(mood.id)}
                              className="p-1 hover:bg-white/50 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add/Edit Form */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    {editingMood ? '编辑心情' : '新建心情'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">心情名称</label>
                      <input
                        type="text"
                        value={moodName}
                        onChange={e => setMoodName(e.target.value)}
                        placeholder="输入心情名称"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">选择图标</label>
                      <div className="flex gap-2 mb-3">
                        {(['emoji', 'kaomoji', 'special'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              activeTab === tab
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {tab === 'emoji' ? 'Emoji' : tab === 'kaomoji' ? '颜文字' : '特殊符号'}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-10 gap-2 p-3 bg-gray-50 rounded-xl max-h-40 overflow-y-auto">
                        {getIconLibrary().map((icon, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedIcon(icon)}
                            className={`p-2 rounded-lg text-lg hover:bg-white transition-colors ${
                              selectedIcon === icon ? 'bg-white shadow-sm ring-2 ring-indigo-500' : ''
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-500">已选：</span>
                        <span className="text-2xl">{selectedIcon}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">选择颜色</label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full transition-all ${
                              selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {editingMood && (
                        <button
                          onClick={resetForm}
                          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                        >
                          取消
                        </button>
                      )}
                      <button
                        onClick={editingMood ? handleUpdate : handleAdd}
                        disabled={!moodName.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {editingMood ? '保存' : '添加'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
