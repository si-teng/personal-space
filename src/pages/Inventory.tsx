import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, Calendar, DollarSign, FileText, Trash2, Edit2, Download, X, Image as ImageIcon, Link as LinkIcon, Loader2, Archive, Filter, Settings } from 'lucide-react';
import { InventoryItem } from '../types';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../types';
import { imageManager } from '../utils/imageManager';
import { ImageUploader } from '../components/ImageUploader';
import { ImageViewer } from '../components/ImageViewer';
import { format, differenceInDays, parseISO } from 'date-fns';

const STORAGE_KEY = STORAGE_KEYS.INVENTORY;
const TAG_COLOR_KEY = 'personal_space_inventory_tag_colors';

const THEME_COLORS = [
  { name: '琥珀', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  { name: '玫瑰', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },
  { name: '天空', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-400' },
  { name: '翠绿', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  { name: '紫罗兰', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400' },
  { name: '橘橙', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  { name: '青蓝', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-400' },
  { name: '粉红', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-400' },
];

type CostViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

const viewModeLabels: Record<CostViewMode, { short: string; full: string }> = {
  daily: { short: '日均', full: '日均成本' },
  weekly: { short: '周均', full: '周均成本' },
  monthly: { short: '月均', full: '月均成本' },
  yearly: { short: '年均', full: '年均成本' },
};

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [manualType, setManualType] = useState<'link' | 'image'>('link');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [manualImageUrl, setManualImageUrl] = useState<string>('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [tagColors, setTagColors] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(TAG_COLOR_KEY) || '{}'); } catch { return {}; }
  });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchaseDate: '',
    retireDate: '',
    cost: '',
    costViewMode: 'daily' as CostViewMode,
    notes: '',
    manualUrl: '',
    manualImageId: '',
    imageIds: [] as string[]
  });

  useEffect(() => {
    const saved = storage.get<InventoryItem[]>(STORAGE_KEY);
    if (saved) setItems(saved);
  }, []);

  useEffect(() => {
    if (showModal || showDetail || showTagManager || viewerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal, showDetail, showTagManager, viewerOpen]);

  useEffect(() => {
    const loadImageUrls = async () => {
      const allImageIds = new Set<string>();
      items.forEach(item => {
        item.imageUrls?.forEach(id => allImageIds.add(id));
        if (item.manualImageId) allImageIds.add(item.manualImageId);
      });

      const urls: Record<string, string> = {};
      for (const imageId of allImageIds) {
        try {
          urls[imageId] = await imageManager.getImageUrl(imageId);
        } catch {
          urls[imageId] = '';
        }
      }
      setImageUrls(urls);
    };
    loadImageUrls();
  }, [items]);

  useEffect(() => {
    const loadManualImage = async () => {
      if (showDetail?.manualImageId) {
        try {
          const url = await imageManager.getImageUrl(showDetail.manualImageId);
          setManualImageUrl(url || '');
        } catch {
          setManualImageUrl('');
        }
      } else {
        setManualImageUrl('');
      }
    };
    loadManualImage();
  }, [showDetail]);

  const saveItems = (newItems: InventoryItem[]) => {
    setItems(newItems);
    storage.set(STORAGE_KEY, newItems);
  };

  const calculateAverageCost = (cost: number, purchaseDate: string, retireDate?: string, mode: CostViewMode = 'daily') => {
    const endDate = retireDate ? parseISO(retireDate) : new Date();
    const days = differenceInDays(endDate, parseISO(purchaseDate));
    if (days <= 0) return cost.toFixed(2);
    switch (mode) {
      case 'weekly':
        return (cost / (days / 7)).toFixed(2);
      case 'monthly':
        return (cost / (days / 30.4375)).toFixed(2);
      case 'yearly':
        return (cost / (days / 365.25)).toFixed(2);
      case 'daily':
      default:
        return (cost / days).toFixed(2);
    }
  };

  const viewModeLabels: Record<CostViewMode, { short: string; full: string }> = {
    daily: { short: '日均', full: '日均成本' },
    weekly: { short: '周均', full: '周均成本' },
    monthly: { short: '月均', full: '月均成本' },
    yearly: { short: '年均', full: '年均成本' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemId = editingItem?.id || Date.now().toString();

    const renamedImageIds: string[] = [];
    for (let i = 0; i < formData.imageIds.length; i++) {
      const oldId = formData.imageIds[i];
      if (oldId.startsWith('inventory_')) {
        renamedImageIds.push(oldId);
      } else {
        const newId = `inventory_${itemId}_${i}`;
        try {
          const imageData = await imageManager.getImage(oldId);
          if (imageData) {
            const file = new File([imageData.data], `${newId}.jpg`, { type: imageData.type });
            await imageManager.saveImage(file, 'inventory', newId);
            await imageManager.deleteImage(oldId);
          }
        } catch (e) {
          console.error('Failed to rename image:', e);
        }
        renamedImageIds.push(newId);
      }
    }

    let finalManualImageId = formData.manualImageId;
    if (manualType === 'image' && formData.manualImageId && !formData.manualImageId.startsWith('manual_')) {
      const newManualId = `manual_${itemId}`;
      try {
        const imageData = await imageManager.getImage(formData.manualImageId);
        if (imageData) {
          const file = new File([imageData.data], `${newManualId}.jpg`, { type: imageData.type });
          await imageManager.saveImage(file, 'manual', newManualId);
          await imageManager.deleteImage(formData.manualImageId);
          finalManualImageId = newManualId;
        }
      } catch (e) {
        console.error('Failed to rename manual image:', e);
      }
    }

    const newItem: InventoryItem = {
      id: itemId,
      name: formData.name,
      category: formData.category,
      purchaseDate: formData.purchaseDate,
      retireDate: formData.retireDate || undefined,
      cost: parseFloat(formData.cost),
      costViewMode: formData.costViewMode,
      notes: formData.notes,
      manualUrl: manualType === 'link' ? formData.manualUrl : undefined,
      manualImageId: manualType === 'image' ? finalManualImageId : undefined,
      imageUrls: renamedImageIds,
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    if (editingItem) {
      const oldImages = editingItem.imageUrls || [];
      const newImages = renamedImageIds;
      const removedImages = oldImages.filter(id => !newImages.includes(id));
      for (const imageId of removedImages) {
        try {
          await imageManager.deleteImage(imageId);
        } catch (e) {
          console.error('Failed to delete image:', e);
        }
      }

      if (editingItem.manualImageId && editingItem.manualImageId !== finalManualImageId) {
        try {
          await imageManager.deleteImage(editingItem.manualImageId);
        } catch (e) {
          console.error('Failed to delete manual image:', e);
        }
      }

      saveItems(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      saveItems([...items, newItem]);
    }

    setShowModal(false);
    setEditingItem(null);
    setFormData({ name: '', category: '', purchaseDate: '', retireDate: '', cost: '', costViewMode: 'daily', notes: '', manualUrl: '', manualImageId: '', imageIds: [] });
    setManualType('link');
  };

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (item?.imageUrls) {
      for (const imageId of item.imageUrls) {
        try {
          await imageManager.deleteImage(imageId);
        } catch (e) {
          console.error('Failed to delete image:', e);
        }
      }
    }
    if (item?.manualImageId) {
      try {
        await imageManager.deleteImage(item.manualImageId);
      } catch (e) {
        console.error('Failed to delete manual image:', e);
      }
    }
    saveItems(items.filter(i => i.id !== id));
    if (showDetail?.id === id) setShowDetail(null);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      purchaseDate: item.purchaseDate,
      retireDate: item.retireDate || '',
      cost: item.cost.toString(),
      costViewMode: item.costViewMode || 'daily',
      notes: item.notes || '',
      manualUrl: item.manualUrl || '',
      manualImageId: item.manualImageId || '',
      imageIds: item.imageUrls || []
    });
    setManualType(item.manualImageId ? 'image' : 'link');
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', category: '', purchaseDate: '', retireDate: '', cost: '', costViewMode: 'daily', notes: '', manualUrl: '', manualImageId: '', imageIds: [] });
    setManualType('link');
    setShowModal(true);
  };

  const handleExport = () => {
    const csv = storage.exportToCSV(items);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.retireDate && !b.retireDate) return 1;
      if (!a.retireDate && b.retireDate) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categories = Array.from(new Set(items.map(i => i.category))).sort((a, b) => {
    if (a === '已退役') return 1;
    if (b === '已退役') return -1;
    return 0; // keep natural order
  });

  // Auto-assign colors to new tags
  const getTagColor = (tag: string) => {
    if (!tag) return null;
    if (tagColors[tag] !== undefined) return THEME_COLORS[tagColors[tag]];
    // Assign new color
    const usedColors = new Set(Object.values(tagColors));
    const available = THEME_COLORS.map((_, i) => i).filter(i => !usedColors.has(i));
    const picked = available.length > 0 ? available[0] : Math.floor(Math.random() * THEME_COLORS.length);
    const newMap = { ...tagColors, [tag]: picked };
    setTagColors(newMap);
    localStorage.setItem(TAG_COLOR_KEY, JSON.stringify(newMap));
    return THEME_COLORS[picked];
  };

  const getTagColorOnly = (tag: string) => {
    if (!tag || tagColors[tag] === undefined) return null;
    return THEME_COLORS[tagColors[tag]];
  };

  const getCoverImage = (item: InventoryItem): string => {
    if (item.imageUrls && item.imageUrls.length > 0) {
      return imageUrls[item.imageUrls[0]] || '';
    }
    return '';
  };

  const getItemImages = (item: InventoryItem): string[] => {
    if (!item.imageUrls) return [];
    return item.imageUrls.map(id => imageUrls[id]).filter(Boolean);
  };

  const openImageViewer = (item: InventoryItem, index: number) => {
    const images = getItemImages(item);
    if (images.length > 0) {
      setViewerImages(images);
      setViewerIndex(index);
      setViewerOpen(true);
    }
  };

  const openManualViewer = () => {
    if (manualImageUrl) {
      setViewerImages([manualImageUrl]);
      setViewerIndex(0);
      setViewerOpen(true);
    }
  };

  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const itemId = editingItem?.id || 'new';
    const customId = `manual_${itemId}_${Date.now()}`;

    try {
      const compressed = await imageManager.compressImage(file, 1200, 1200);
      const imageId = await imageManager.saveImage(compressed, 'manual', customId);
      setFormData(prev => ({ ...prev, manualImageId: imageId }));
    } catch (error) {
      console.error('Failed to upload manual image:', error);
    }
  };

  const removeManualImage = async () => {
    if (formData.manualImageId) {
      try {
        await imageManager.deleteImage(formData.manualImageId);
      } catch (e) {
        console.error('Failed to delete manual image:', e);
      }
    }
    setFormData(prev => ({ ...prev, manualImageId: '' }));
  };

  return (
    <div className="min-h-screen bg-stone-50 px-3 sm:px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
              <Package className="w-8 h-8 text-indigo-600" />
              物品台账
            </h1>
            <p className="text-stone-500 mt-1">管理您的物品，追踪每日均摊成本</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchTerm(''); }} className={`p-2 rounded-lg transition ${showSearch ? 'bg-indigo-100 text-indigo-600' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}>
              <Search size={18} />
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors text-sm">
              <Download size={16} /> 导出
            </button>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={18} /> 添加物品
            </button>
          </div>
        </div>

        {/* Hidden search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
              <input type="text" placeholder="搜索物品..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" autoFocus />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag Filter Buttons */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button onClick={() => setCategoryFilter('')} className={`px-4 py-2 rounded-full text-sm transition-colors ${!categoryFilter ? 'bg-indigo-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}>全部</button>
          {categories.map(cat => {
            const tc = getTagColorOnly(cat) || THEME_COLORS[0];
            return (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${categoryFilter === cat ? 'bg-indigo-600 text-white' : `bg-white text-stone-600 hover:bg-stone-100`}`}>{cat}</button>
            );
          })}
          <button onClick={() => setShowTagManager(true)} className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors ml-1"><Settings size={18} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md cursor-pointer transition-shadow"
              onClick={() => setShowDetail(item)}>
              {getCoverImage(item) ? (
                <div className="w-full aspect-[4/3] bg-stone-100 rounded-xl mb-4 overflow-hidden relative">
                  <img src={getCoverImage(item)} alt={item.name} className="w-full h-full object-cover" />
                  <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded-full backdrop-blur-sm ${(getTagColorOnly(item.category) || THEME_COLORS[0]).bg} ${(getTagColorOnly(item.category) || THEME_COLORS[0]).text}`}>{item.category}</span>
                  {item.imageUrls && item.imageUrls.length > 1 && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                      {item.imageUrls.length} 张
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-[4/3] bg-stone-100 rounded-xl mb-4 flex items-center justify-center text-stone-400 relative">
                  <ImageIcon className="w-12 h-12" />
                  <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded-full backdrop-blur-sm ${(getTagColorOnly(item.category) || THEME_COLORS[0]).bg} ${(getTagColorOnly(item.category) || THEME_COLORS[0]).text}`}>{item.category}</span>
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-stone-800">{item.name}</h3>
                    {item.retireDate && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full">
                        <Archive className="w-3 h-3" /> 已退役
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(item)} className="p-2 text-stone-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-stone-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-stone-600"><Calendar className="w-4 h-4" />购买: {format(parseISO(item.purchaseDate), 'yyyy年MM月dd日')}</div>
                {item.retireDate && (
                  <div className="flex items-center gap-2 text-amber-600"><Archive className="w-4 h-4" />退役: {format(parseISO(item.retireDate), 'yyyy年MM月dd日')}</div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-stone-600"><DollarSign className="w-4 h-4" />¥{item.cost.toFixed(2)}</span>
                  <span className="text-indigo-600 font-medium">{viewModeLabels[item.costViewMode || 'daily'].short}: ¥{calculateAverageCost(item.cost, item.purchaseDate, item.retireDate, item.costViewMode || 'daily')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showDetail && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(null)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{showDetail.name}</h2>
                  <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                {showDetail.imageUrls && showDetail.imageUrls.length > 0 && (
                  <div className="mb-6">
                    {showDetail.imageUrls.length === 1 ? (
                      <img
                        src={imageUrls[showDetail.imageUrls[0]]}
                        alt={showDetail.name}
                        className="w-full aspect-[4/3] object-cover rounded-xl cursor-zoom-in"
                        onClick={() => openImageViewer(showDetail, 0)}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {showDetail.imageUrls.map((imageId, index) => (
                          <img
                            key={imageId}
                            src={imageUrls[imageId]}
                            alt={`${showDetail.name} - ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-xl cursor-zoom-in"
                            onClick={() => openImageViewer(showDetail, index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2"><span className="text-stone-500">分类:</span><span className={`px-2 py-1 rounded-full text-sm ${(getTagColorOnly(showDetail.category) || THEME_COLORS[0]).bg} ${(getTagColorOnly(showDetail.category) || THEME_COLORS[0]).text}`}>{showDetail.category}</span></div>
                  {showDetail.retireDate && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-sm">
                        <Archive className="w-3 h-3" /> 已退役
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-stone-400" /><span>购买: {format(parseISO(showDetail.purchaseDate), 'yyyy年MM月dd日')}</span></div>
                  {showDetail.retireDate && (
                    <div className="flex items-center gap-2"><Archive className="w-4 h-4 text-amber-500" /><span>退役: {format(parseISO(showDetail.retireDate), 'yyyy年MM月dd日')}</span></div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-stone-400" />¥{showDetail.cost.toFixed(2)}</span>
                    <span className="text-indigo-600 font-medium">{viewModeLabels[showDetail.costViewMode || 'daily'].short}: ¥{calculateAverageCost(showDetail.cost, showDetail.purchaseDate, showDetail.retireDate, showDetail.costViewMode || 'daily')}</span>
                  </div>
                  {showDetail.retireDate && (
                    <div className="text-xs text-stone-400 text-right">（按购买至退役计算）</div>
                  )}
                </div>

                {(showDetail.manualUrl || showDetail.manualImageId) && (
                  <div className="mb-4">
                    <span className="text-stone-500 text-sm">说明书:</span>
                    {showDetail.manualImageId ? (
                      <div className="mt-2 border border-stone-200 rounded-lg overflow-hidden cursor-zoom-in" onClick={openManualViewer}>
                        {manualImageUrl ? (
                          <img src={manualImageUrl} alt="说明书" className="w-full h-40 object-contain bg-stone-50 hover:bg-stone-100 transition-colors" />
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center bg-stone-50">
                            <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <a href={showDetail.manualUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 mt-1">
                        <FileText className="w-4 h-4" /> 查看说明书
                      </a>
                    )}
                  </div>
                )}

                {showDetail.notes && (
                  <div className="bg-stone-50 rounded-xl p-4">
                    <span className="text-stone-500 text-sm">备注:</span>
                    <p className="text-stone-700 mt-1">{showDetail.notes}</p>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setShowDetail(null); openEdit(showDetail); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">编辑</button>
                  <button onClick={() => { handleDelete(showDetail.id); setShowDetail(null); }} className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors">删除</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{editingItem ? '编辑物品' : '添加物品'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">物品照片</label>
                    <ImageUploader
                      images={formData.imageIds}
                      onChange={(ids) => setFormData(prev => ({ ...prev, imageIds: ids }))}
                      maxImages={5}
                      compress={true}
                      maxWidth={400}
                      maxHeight={400}
                    />
                  </div>
                  <input type="text" placeholder="物品名称" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">物品分类</label>
                    {categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map(cat => {
                          const tc = getTagColorOnly(cat) || THEME_COLORS[0];
                          return (
                            <button key={cat} type="button" onClick={() => setFormData({ ...formData, category: cat })}
                              className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${tc.bg} ${tc.text} ${tc.border} ${formData.category === cat ? 'ring-2 ring-indigo-400' : ''}`}>{cat}</button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-400">暂无分类标签，请先在页面上方标签管理中新增</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">购买时间与价格</label>
                    <input type="date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none rounded-b-none" required />
                    <input type="number" placeholder="购买价格" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })}
                      className="w-full px-4 py-3 border border-t-0 border-stone-200 rounded-xl rounded-t-none focus:ring-2 focus:ring-indigo-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm text-stone-500 mb-2">费用展示模式</label>
                    <div className="flex bg-stone-100 rounded-lg p-0.5">
                      {(Object.entries(viewModeLabels) as [CostViewMode, { short: string; full: string }][]).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFormData({ ...formData, costViewMode: mode })}
                          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                            formData.costViewMode === mode
                              ? 'bg-white text-indigo-600 shadow-sm font-medium'
                              : 'text-stone-500 hover:text-stone-700'
                          }`}
                        >
                          {label.short}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-stone-600">是否已退役</span>
                      <button type="button" onClick={() => { setFormData({ ...formData, retireDate: formData.retireDate ? '' : (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() }); }}
                        className={`relative w-10 h-6 rounded-full transition-colors ${formData.retireDate ? 'bg-amber-500' : 'bg-stone-300'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${formData.retireDate ? 'translate-x-4' : ''}`} />
                      </button>
                    </div>
                    {formData.retireDate && (
                      <div>
                        <label className="block text-sm text-stone-500 mb-1">退役时间</label>
                        <input type="date" value={formData.retireDate} onChange={e => setFormData({ ...formData, retireDate: e.target.value })}
                          className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-stone-600 mb-2">说明书</label>
                    <div className="flex gap-2 mb-2">
                      <button type="button" onClick={() => setManualType('link')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${manualType === 'link' ? 'bg-indigo-100 text-indigo-600' : 'bg-stone-100'}`}>
                        <LinkIcon className="w-4 h-4" /> 链接
                      </button>
                      <button type="button" onClick={() => setManualType('image')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${manualType === 'image' ? 'bg-indigo-100 text-indigo-600' : 'bg-stone-100'}`}>
                        <ImageIcon className="w-4 h-4" /> 图片
                      </button>
                    </div>
                    {manualType === 'link' ? (
                      <input type="url" placeholder="说明书链接" value={formData.manualUrl} onChange={e => setFormData({ ...formData, manualUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    ) : (
                      <div className="flex items-center gap-3">
                        {formData.manualImageId && imageUrls[formData.manualImageId] ? (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-stone-100 group">
                            <img src={imageUrls[formData.manualImageId]} alt="说明书" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={removeManualImage}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-sm">上传说明书</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleManualImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors">取消</button>
                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">保存</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag Manager Modal */}
        {showTagManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowTagManager(false); setEditingTag(null); }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">管理分类标签</h3>
                <button onClick={() => { setShowTagManager(false); setEditingTag(null); }} className="p-2 hover:bg-stone-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {categories.map(cat => {
                  const tc = getTagColorOnly(cat) || THEME_COLORS[0];
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      {editingTag === cat ? (
                        <>
                          <input value={editTagName} onChange={e => setEditTagName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { const newName = editTagName.trim(); if (newName && newName !== cat) { const updated = items.map(i => i.category === cat ? { ...i, category: newName } : i); saveItems(updated); const newMap = { ...tagColors, [newName]: tagColors[cat] }; delete newMap[cat]; setTagColors(newMap); localStorage.setItem(TAG_COLOR_KEY, JSON.stringify(newMap)); if (categoryFilter === cat) setCategoryFilter(newName); } setEditingTag(null); } if (e.key === 'Escape') setEditingTag(null); }}
                            className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" autoFocus />
                          <button onClick={() => { const newName = editTagName.trim(); if (newName && newName !== cat) { const updated = items.map(i => i.category === cat ? { ...i, category: newName } : i); saveItems(updated); const newMap = { ...tagColors, [newName]: tagColors[cat] }; delete newMap[cat]; setTagColors(newMap); localStorage.setItem(TAG_COLOR_KEY, JSON.stringify(newMap)); if (categoryFilter === cat) setCategoryFilter(newName); } setEditingTag(null); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => setEditingTag(null)} className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <div className={`w-3 h-3 rounded-full shrink-0 ${tc.dot}`} />
                          <span className="flex-1 px-3 py-2 bg-stone-50 rounded-lg text-sm">{cat}</span>
                          <select value={tagColors[cat] ?? 0} onChange={e => { const newMap = { ...tagColors, [cat]: parseInt(e.target.value) }; setTagColors(newMap); localStorage.setItem(TAG_COLOR_KEY, JSON.stringify(newMap)); }}
                            className="text-[10px] border border-stone-200 rounded px-1 py-1 bg-white">
                            {THEME_COLORS.map((tc, i) => <option key={i} value={i}>{tc.name}</option>)}
                          </select>
                          <button onClick={() => { setEditingTag(cat); setEditTagName(cat); }} className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => { const updated = items.map(i => i.category === cat ? { ...i, category: '' } : i); saveItems(updated); if (categoryFilter === cat) setCategoryFilter(''); }} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  );
                })}
                {categories.length === 0 && <p className="text-sm text-stone-400 text-center py-4">暂无标签</p>}
              </div>
              <div className="flex items-center gap-2 border-t border-stone-100 pt-4">
                <input value={newTagName} onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { const name = newTagName.trim(); if (name && !categories.includes(name)) { const used = new Set(Object.values(tagColors)); const avail = THEME_COLORS.map((_, i) => i).filter(i => !used.has(i)); const picked = avail.length > 0 ? avail[0] : 0; const newMap = { ...tagColors, [name]: picked }; setTagColors(newMap); localStorage.setItem(TAG_COLOR_KEY, JSON.stringify(newMap)); setNewTagName(''); } } }}
                  placeholder="输入新标签名称" className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                <button onClick={() => { const name = newTagName.trim(); if (name && !categories.includes(name)) { const used = new Set(Object.values(tagColors)); const avail = THEME_COLORS.map((_, i) => i).filter(i => !used.has(i)); const picked = avail.length > 0 ? avail[0] : 0; const newMap = { ...tagColors, [name]: picked }; setTagColors(newMap); localStorage.setItem(TAG_COLOR_KEY, JSON.stringify(newMap)); setNewTagName(''); } }} disabled={!newTagName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">添加</button>
              </div>
            </div>
          </div>
        )}

        <ImageViewer
          images={viewerImages}
          initialIndex={viewerIndex}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      </div>
    </div>
  );
}
