import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Filter, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { GalleryItem } from '../types';
import { storage } from '../utils/storage';
import { imageManager } from '../utils/imageManager';
import { ImageUploader } from '../components/ImageUploader';
import { ImageViewer } from '../components/ImageViewer';

const STORAGE_KEY = 'personal_space_gallery';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['全部', '摄影', '绘画', '设计']);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageIds: [] as string[],
    category: '摄影',
    story: ''
  });

  const storyEditor = useEditor({
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: '写下这个作品背后的故事...' })],
    content: '',
  });

  useEffect(() => {
    const saved = storage.get<GalleryItem[]>(STORAGE_KEY);
    setItems(saved || []);
  }, []);

  useEffect(() => {
    const loadImageUrls = async () => {
      const allImageIds = new Set<string>();
      items.forEach(item => {
        item.imageUrls?.forEach(id => allImageIds.add(id));
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

  const filteredItems = activeCategory === '全部'
    ? items
    : items.filter(item => item.category === activeCategory);

  const getCoverImage = (item: GalleryItem): string => {
    if (item.imageUrls && item.imageUrls.length > 0) {
      return imageUrls[item.imageUrls[0]] || '';
    }
    return '';
  };

  const getItemImages = (item: GalleryItem): string[] => {
    if (!item.imageUrls) return [];
    return item.imageUrls.map(id => imageUrls[id]).filter(Boolean);
  };

  const handleSubmit = async () => {
    if (!formData.title || formData.imageIds.length === 0) return;
    const storyContent = storyEditor?.getHTML() || '';
    const itemId = selectedItem?.id || Date.now().toString();

    const renamedImageIds: string[] = [];
    for (let i = 0; i < formData.imageIds.length; i++) {
      const oldId = formData.imageIds[i];
      if (oldId.startsWith('gallery_')) {
        renamedImageIds.push(oldId);
      } else {
        const newId = `gallery_${itemId}_${i}`;
        try {
          const imageData = await imageManager.getImage(oldId);
          if (imageData) {
            const file = new File([imageData.data], `${newId}.jpg`, { type: imageData.type });
            await imageManager.saveImage(file, 'gallery', newId);
            await imageManager.deleteImage(oldId);
          }
        } catch (e) {
          console.error('Failed to rename image:', e);
        }
        renamedImageIds.push(newId);
      }
    }

    const newItem: GalleryItem = {
      id: itemId,
      title: formData.title,
      description: formData.description,
      imageUrls: renamedImageIds,
      category: formData.category,
      story: storyContent,
      createdAt: selectedItem?.createdAt || new Date().toISOString().split('T')[0]
    };

    if (selectedItem) {
      const oldImages = selectedItem.imageUrls || [];
      const newImages = renamedImageIds;
      const removedImages = oldImages.filter(id => !newImages.includes(id));
      for (const imageId of removedImages) {
        try {
          await imageManager.deleteImage(imageId);
        } catch (e) {
          console.error('Failed to delete image:', e);
        }
      }
    }

    const updated = selectedItem
      ? items.map(i => i.id === selectedItem.id ? newItem : i)
      : [...items, newItem];
    setItems(updated);
    storage.set(STORAGE_KEY, updated);
    closeModal();
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
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    storage.set(STORAGE_KEY, updated);
    if (selectedItem?.id === id) setShowDetailModal(false);
  };

  const openDetail = (item: GalleryItem) => {
    setSelectedItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      imageIds: item.imageUrls || [],
      category: item.category,
      story: item.story || ''
    });
    storyEditor?.commands.setContent(item.story || '');
    setIsEditing(false);
    setShowDetailModal(true);
  };

  const openAdd = () => {
    setSelectedItem(null);
    setFormData({ title: '', description: '', imageIds: [], category: '摄影', story: '' });
    storyEditor?.commands.setContent('');
    setIsEditing(true);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowDetailModal(false);
    setSelectedItem(null);
    setIsEditing(false);
  };

  const startEdit = () => {
    setIsEditing(true);
  };

  const openImageViewer = (item: GalleryItem, index: number) => {
    const images = getItemImages(item);
    if (images.length > 0) {
      setViewerImages(images);
      setViewerIndex(index);
      setViewerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-stone-800">作品画廊</h1>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={20} /> 添加作品
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Filter size={18} className="text-stone-500" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => openDetail(item)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="aspect-[4/3] bg-stone-100 relative">
                {getCoverImage(item) ? (
                  <img src={getCoverImage(item)} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    无图片
                  </div>
                )}
                {item.imageUrls && item.imageUrls.length > 1 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                    {item.imageUrls.length} 张
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-indigo-600 font-medium">{item.category}</span>
                <h3 className="text-lg font-semibold text-stone-800 mt-1">{item.title}</h3>
                <p className="text-stone-500 text-sm mt-2 line-clamp-2">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {(showAddModal || (showDetailModal && isEditing)) && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{selectedItem ? '编辑作品' : '添加新作品'}</h2>
                  <button onClick={closeModal} className="p-2 hover:bg-stone-100 rounded-lg"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">作品图片</label>
                    <ImageUploader
                      images={formData.imageIds}
                      onChange={(ids) => setFormData(prev => ({ ...prev, imageIds: ids }))}
                      maxImages={10}
                    />
                  </div>

                  <input
                    type="text" placeholder="作品标题"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {categories.filter(c => c !== '全部').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea
                    placeholder="简短描述（卡片展示）"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">作品故事</label>
                    <div className="border border-stone-200 rounded-lg p-3 min-h-[150px] prose prose-sm max-w-none">
                      <EditorContent editor={storyEditor} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={closeModal} className="flex-1 py-2 border border-stone-200 rounded-lg hover:bg-stone-50">取消</button>
                  <button onClick={handleSubmit} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDetailModal && selectedItem && !isEditing && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-indigo-600 font-medium">{selectedItem.category}</span>
                  <div className="flex gap-2">
                    <button onClick={startEdit} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(selectedItem.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    <button onClick={closeModal} className="p-2 hover:bg-stone-100 rounded-lg"><X size={20} /></button>
                  </div>
                </div>

                {selectedItem.imageUrls && selectedItem.imageUrls.length > 0 && (
                  <div className="mb-6">
                    {selectedItem.imageUrls.length === 1 ? (
                      <img
                        src={imageUrls[selectedItem.imageUrls[0]]}
                        alt={selectedItem.title}
                        className="w-full h-64 object-cover rounded-xl cursor-zoom-in"
                        onClick={() => openImageViewer(selectedItem, 0)}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedItem.imageUrls.map((imageId, index) => (
                          <img
                            key={imageId}
                            src={imageUrls[imageId]}
                            alt={`${selectedItem.title} - ${index + 1}`}
                            className="w-full h-40 object-cover rounded-xl cursor-zoom-in"
                            onClick={() => openImageViewer(selectedItem, index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <h2 className="text-2xl font-bold text-stone-800 mb-2">{selectedItem.title}</h2>
                <p className="text-stone-600 mb-4">{selectedItem.description}</p>

                {selectedItem.story && (
                  <div className="bg-stone-50 rounded-xl p-4">
                    <h3 className="font-medium text-stone-800 mb-2">作品故事</h3>
                    <div className="prose prose-sm max-w-none text-stone-600" dangerouslySetInnerHTML={{ __html: selectedItem.story }} />
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
