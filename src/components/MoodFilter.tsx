import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Calendar, ChevronDown } from 'lucide-react';
import { MoodFilter, CustomMood } from '../types';
import { format, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from 'date-fns';

interface MoodFilterProps {
  filter: MoodFilter;
  onFilterChange: (filter: MoodFilter) => void;
  customMoods: CustomMood[];
}

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: 'thisMonth', label: '本月' },
  { value: 'custom', label: '自定义区间' },
] as const;

export default function MoodFilterComponent({ filter, onFilterChange, customMoods }: MoodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilter, setLocalFilter] = useState<MoodFilter>(filter);
  const [showCustomDate, setShowCustomDate] = useState(filter.dateRange === 'custom');

  useEffect(() => {
    setLocalFilter(filter);
    setShowCustomDate(filter.dateRange === 'custom');
  }, [filter]);

  const handleApply = () => {
    onFilterChange(localFilter);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilter: MoodFilter = {
      dateRange: 'all',
      selectedMoods: [],
    };
    setLocalFilter(resetFilter);
    onFilterChange(resetFilter);
    setShowCustomDate(false);
    setIsOpen(false);
  };

  const handleDateRangeChange = (value: 'all' | 'thisMonth' | 'custom') => {
    setLocalFilter(prev => ({ ...prev, dateRange: value }));
    setShowCustomDate(value === 'custom');
  };

  const toggleMood = (moodId: string) => {
    setLocalFilter(prev => ({
      ...prev,
      selectedMoods: prev.selectedMoods.includes(moodId)
        ? prev.selectedMoods.filter(id => id !== moodId)
        : [...prev.selectedMoods, moodId],
    }));
  };

  const hasActiveFilters = filter.dateRange !== 'all' || filter.selectedMoods.length > 0;

  const getFilterSummary = () => {
    const parts: string[] = [];
    if (filter.dateRange === 'thisMonth') parts.push('本月');
    if (filter.dateRange === 'custom' && filter.startDate && filter.endDate) {
      parts.push(`${format(parseISO(filter.startDate), 'MM/dd')}-${format(parseISO(filter.endDate), 'MM/dd')}`);
    }
    if (filter.selectedMoods.length > 0) {
      parts.push(`${filter.selectedMoods.length}个心情`);
    }
    return parts.length > 0 ? parts.join(' · ') : '筛选';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
          hasActiveFilters
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm">{getFilterSummary()}</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 bg-indigo-500 rounded-full" />
        )}
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
              className="bg-white rounded-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">筛选日志</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Date Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    时间范围
                  </label>
                  <div className="space-y-2">
                    {DATE_RANGE_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleDateRangeChange(option.value)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                          localFilter.dateRange === option.value
                            ? 'bg-indigo-50 border-2 border-indigo-200'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <span className={`text-sm ${localFilter.dateRange === option.value ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                        {localFilter.dateRange === option.value && (
                          <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Range */}
                  <AnimatePresence>
                    {showCustomDate && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 space-y-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">开始日期</label>
                            <input
                              type="date"
                              value={localFilter.startDate || ''}
                              onChange={e => setLocalFilter(prev => ({ ...prev, startDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">结束日期</label>
                            <input
                              type="date"
                              value={localFilter.endDate || ''}
                              onChange={e => setLocalFilter(prev => ({ ...prev, endDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mood Selection */}
                <div className="border-t border-gray-100 pt-6">
                  <label className="text-sm font-medium text-gray-700 mb-3 block">心情标签</label>
                  <div className="flex flex-wrap gap-2">
                    {customMoods.map(mood => (
                      <button
                        key={mood.id}
                        onClick={() => toggleMood(mood.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
                          localFilter.selectedMoods.includes(mood.id)
                            ? 'ring-2 ring-offset-1'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: localFilter.selectedMoods.includes(mood.id) ? mood.color + '20' : mood.color + '10',
                          color: mood.color,
                          ringColor: mood.color,
                        }}
                      >
                        <span>{mood.icon}</span>
                        <span>{mood.name}</span>
                      </button>
                    ))}
                  </div>
                  {customMoods.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">暂无自定义心情</p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  重置
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  应用筛选
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
