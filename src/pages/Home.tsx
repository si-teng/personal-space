import { motion } from 'framer-motion';
import { Quote, Image, BookHeart, Package, Camera, Check, X, ImageOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { storage } from '../utils/storage';
import { imageManager } from '../utils/imageManager';
import type { UserProfile, Quote as QuoteType, GalleryItem } from '../types';
import { STORAGE_KEYS } from '../types';
import { ImageViewer } from '../components/ImageViewer';
import ItemInteractions from '../components/ItemInteractions';

const modules = [
  { id: 'quotes', name: '语录', icon: Quote, path: '/quotes', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
  { id: 'gallery', name: '画廊', icon: Image, path: '/gallery', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
  { id: 'mood', name: '日志', icon: BookHeart, path: '/mood', color: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
  { id: 'inventory', name: '台账', icon: Package, path: '/inventory', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
];

function getGridClass(count: number): string {
  if (count === 1) return 'grid-cols-1';
  if (count === 2 || count === 4) return 'grid-cols-2';
  return 'grid-cols-3';
}

function getImageSpanClass(count: number): string {
  if (count === 1) return 'aspect-[4/3]';
  return 'aspect-square';
}

export default function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    name: '你的名字',
    signature: '记录生活，珍藏美好',
    bio: '这里是我的个人空间，记录生活中的点滴感悟与收藏。',
    avatarPath: '',
    coverPath: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryImageUrls, setGalleryImageUrls] = useState<Record<string, string>>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [detailItem, setDetailItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const saved = storage.get<UserProfile>('personal_space_profile');
    if (saved) { setProfile(saved); loadImages(saved); }
  }, []);

  useEffect(() => {
    const saved = storage.get<GalleryItem[]>(STORAGE_KEYS.GALLERY);
    if (saved) setGalleryItems(saved.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10));
  }, []);

  useEffect(() => {
    const loadGalleryUrls = async () => {
      const allIds = new Set<string>();
      galleryItems.forEach(item => item.imageUrls?.forEach(id => allIds.add(id)));
      const entries = await Promise.all(
        Array.from(allIds).map(async (id) => {
          try { return [id, await imageManager.getImageUrl(id) || ''] as const; }
          catch { return [id, ''] as const; }
        })
      );
      setGalleryImageUrls(Object.fromEntries(entries));
    };
    loadGalleryUrls();
  }, [galleryItems]);

  const loadImages = async (profileData: UserProfile) => {
    if (profileData.avatarPath) {
      try { const url = await imageManager.getImageUrl(profileData.avatarPath); setAvatarUrl(url || ''); } catch { setAvatarUrl(''); }
    }
    if (profileData.coverPath) {
      try { const url = await imageManager.getImageUrl(profileData.coverPath); setCoverUrl(url || ''); } catch { setCoverUrl(''); }
    }
  };

  const saveProfile = (newProfile: UserProfile) => { setProfile(newProfile); storage.set('personal_space_profile', newProfile); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await imageManager.compressImage(file, type === 'avatar' ? 400 : 1200, type === 'avatar' ? 400 : 800);
      const random = Math.random().toString(36).substr(2, 9);
      const customId = `${type}_${Date.now()}_${random}`;
      const imageId = await imageManager.saveImage(compressed, type, customId);
      if (type === 'avatar' && profile.avatarPath) { try { await imageManager.deleteImage(profile.avatarPath); } catch (e) {} }
      if (type === 'cover' && profile.coverPath) { try { await imageManager.deleteImage(profile.coverPath); } catch (e) {} }
      const newProfile = { ...profile, [type === 'avatar' ? 'avatarPath' : 'coverPath']: imageId };
      saveProfile(newProfile);
      const url = await imageManager.getImageUrl(imageId);
      if (type === 'avatar') setAvatarUrl(url || ''); else setCoverUrl(url || '');
    } catch (error) { console.error('Failed to upload image:', error); }
  };

  const startEdit = (field: string, value: string) => { setEditing(field); setEditValue(value); };
  const saveEdit = () => {
    if (editing) {
      saveProfile({ ...profile, [editing]: editValue });
      if (editing === 'bio' && editValue.trim()) {
        const quotes = storage.get<QuoteType[]>(STORAGE_KEYS.QUOTES) || [];
        storage.set(STORAGE_KEYS.QUOTES, [{ id: Date.now().toString(), content: editValue, author: profile.name, createdAt: new Date().toISOString(), tags: ['个人感悟'] }, ...quotes]);
      }
      setEditing(null);
    }
  };
  const cancelEdit = () => { setEditing(null); setEditValue(''); };

  const getItemImages = (item: GalleryItem): string[] => {
    if (!item.imageUrls) return [];
    return item.imageUrls.slice(0, 9).map(id => galleryImageUrls[id]).filter(Boolean);
  };

  const openImageViewer = (item: GalleryItem, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const images = getItemImages(item);
    if (images.length > 0) { setViewerImages(images); setViewerIndex(index); setViewerOpen(true); }
  };

  const openDetail = (item: GalleryItem) => { setDetailItem(item); };

  const handleUpdateGalleryItem = (updatedItem: GalleryItem) => {
    setGalleryItems(prev =>
      prev.map(i => i.id === updatedItem.id ? updatedItem : i)
    );
    if (detailItem?.id === updatedItem.id) setDetailItem(updatedItem);
    const allItems = storage.get<GalleryItem[]>(STORAGE_KEYS.GALLERY) || [];
    const updatedAll = allItems.map(i => i.id === updatedItem.id ? updatedItem : i);
    storage.set(STORAGE_KEYS.GALLERY, updatedAll);
  };

  return (
    <div className="relative min-h-screen">
      {/* ========== 全屏封面背景 ========== */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: coverUrl ? `url(${coverUrl})` : 'linear-gradient(to bottom right, #e0e7ff, #fef3c7)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* 半透明遮罩让内容更可读 */}
        <div className="absolute inset-0 bg-white/70" />
      </div>

      {/* ========== 内容层 ========== */}
      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-8 pb-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* ===== 左栏（sticky 跟随滚动） ===== */}
          <div className="w-full md:w-[30%] lg:w-[28%] shrink-0">
            <div className="space-y-5 sticky top-[5.5rem]">

            {/* 头像 + 个人信息 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white/50 p-7 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative inline-block cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                <div className="w-28 h-28 rounded-full ring-4 ring-white/80 shadow-md flex items-center justify-center overflow-hidden mx-auto">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-light text-indigo-600">{profile.name.charAt(0)}</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full">
                  <Camera size={16} className="text-white" />
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} className="hidden" />
              </motion.div>

              <div className="mt-4">
                {editing === 'name' ? (
                  <div className="flex items-center justify-center gap-1">
                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-2xl font-semibold text-center border-b-2 border-indigo-500 outline-none bg-transparent w-44" />
                    <button onClick={saveEdit} className="p-1 text-green-600"><Check size={20} /></button>
                    <button onClick={cancelEdit} className="p-1 text-red-600"><X size={20} /></button>
                  </div>
                ) : (
                  <h1 className="text-2xl font-semibold text-stone-800 cursor-pointer hover:text-indigo-600 transition-colors" onDoubleClick={() => startEdit('name', profile.name)}>{profile.name}</h1>
                )}
                {editing === 'signature' ? (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-base text-center border-b border-stone-300 outline-none bg-transparent w-52" />
                    <button onClick={saveEdit} className="p-1 text-green-600"><Check size={16} /></button>
                    <button onClick={cancelEdit} className="p-1 text-red-600"><X size={16} /></button>
                  </div>
                ) : (
                  <p className="text-base text-stone-400 italic mt-1 cursor-pointer hover:text-indigo-600 transition-colors" onDoubleClick={() => startEdit('signature', profile.signature)}>{profile.signature}</p>
                )}
              </div>

              <div className="mt-3">
                {editing === 'bio' ? (
                  <div className="flex flex-col items-center gap-2">
                    <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-3 border border-stone-200 rounded-lg outline-none resize-none text-base" rows={3} />
                    <p className="text-sm text-stone-400">保存后将自动同步到语录</p>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="px-5 py-2 bg-indigo-600 text-white text-base rounded-lg">保存</button>
                      <button onClick={cancelEdit} className="px-5 py-2 border border-stone-200 text-base rounded-lg">取消</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-500 text-base leading-relaxed cursor-pointer hover:text-indigo-600 transition-colors line-clamp-3" onDoubleClick={() => startEdit('bio', profile.bio)}>{profile.bio}</p>
                )}
              </div>

              {/* 更换封面 */}
              <button
                onClick={() => coverInputRef.current?.click()}
                className="mt-4 flex items-center gap-1.5 mx-auto text-sm text-stone-400 hover:text-indigo-600 transition-colors"
              >
                <Camera size={16} /> 更换封面
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
            </div>

            {/* 模块导航 - 2x2 图标+文字 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white/50 p-6">
              <div className="grid grid-cols-2 gap-4">
                {modules.map((mod) => (
                  <Link
                    key={mod.id}
                    to={mod.path}
                    className="flex flex-col items-center gap-3 py-4 px-2 rounded-xl hover:bg-stone-50/80 transition-colors"
                  >
                    <div className={`w-14 h-14 rounded-xl ${mod.color} flex items-center justify-center`}>
                      <mod.icon className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-medium text-stone-600">{mod.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            </div>
          </div>

          {/* ===== 右栏 ===== */}
          <div className="w-full md:w-[70%] lg:w-[72%] min-w-0">

            {galleryItems.length === 0 ? (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white/50 p-12 text-center">
                <ImageOff className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-400">暂无作品</p>
                <p className="text-stone-300 text-sm mt-1">前往画廊添加你的第一个作品吧</p>
              </div>
            ) : (
              <div className="space-y-5" style={{ transform: 'translateZ(0)' }}>
                {galleryItems.map((item, index) => {
                  const images = getItemImages(item);
                  const gridClass = getGridClass(images.length);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-white/50 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openDetail(item)}
                    >
                      {/* 头像 + 昵称 */}
                      <div className="flex items-center gap-3 px-14 pt-10 pb-2">
                        <div className="w-14 h-14 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-medium text-stone-500">{profile.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-base font-medium text-stone-700">{profile.name}</span>
                      </div>

                      <div className="flex items-center justify-between px-14 pb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium shrink-0">{item.category}</span>
                          <h3 className="font-semibold text-stone-800 truncate">{item.title}</h3>
                        </div>
                        <span className="text-xs text-stone-400 shrink-0 ml-2">{item.createdAt}</span>
                      </div>

                      {item.description && (
                        <div className="px-14 pb-3" onClick={(e) => { e.stopPropagation(); openDetail(item); }}>
                          <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                      )}

                      {images.length > 0 && (
                        <div className={`px-14 pb-8 grid ${gridClass} gap-1.5`}>
                          {images.map((url, imgIdx) => (
                            <div
                              key={imgIdx}
                              className={`${getImageSpanClass(images.length)} bg-stone-100 rounded-lg overflow-hidden`}
                              onClick={(e) => openImageViewer(item, imgIdx, e)}
                            >
                              <img src={url} alt={`${item.title}-${imgIdx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ))}
                        </div>
                      )}

                      <ItemInteractions item={item} userName={profile.name} onUpdate={handleUpdateGalleryItem} variant="feed" />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== 图片查看器 ========== */}
      <ImageViewer images={viewerImages} initialIndex={viewerIndex} isOpen={viewerOpen} onClose={() => setViewerOpen(false)} />

      {/* ========== 作品详情弹窗 ========== */}
      {detailItem && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailItem(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full">{detailItem.category}</span>
              <button onClick={() => setDetailItem(null)} className="p-2 hover:bg-stone-100 rounded-lg"><X size={20} /></button>
            </div>
            {getItemImages(detailItem).length > 0 && (
              <div className="mb-6">
                {getItemImages(detailItem).length === 1 ? (
                  <img src={getItemImages(detailItem)[0]} alt={detailItem.title} className="w-full h-64 object-cover rounded-xl cursor-zoom-in" onClick={(e) => openImageViewer(detailItem, 0, e)} />
                ) : (
                  <div className={`grid ${getGridClass(getItemImages(detailItem).length)} gap-1.5`}>
                    {getItemImages(detailItem).map((url, idx) => (
                      <img key={idx} src={url} alt={`${detailItem.title}-${idx + 1}`} className="w-full aspect-square object-cover rounded-xl cursor-zoom-in" onClick={(e) => openImageViewer(detailItem, idx, e)} />
                    ))}
                  </div>
                )}
              </div>
            )}
            <h2 className="text-xl font-bold text-stone-800 mb-2">{detailItem.title}</h2>
            <p className="text-stone-500 mb-4">{detailItem.description}</p>
            {detailItem.story && (
              <div className="bg-stone-50 rounded-xl p-4">
                <h3 className="font-medium text-stone-700 mb-2">作品故事</h3>
                <div className="prose prose-sm max-w-none text-stone-600" dangerouslySetInnerHTML={{ __html: detailItem.story }} />
              </div>
            )}
            <div className="mt-4 border-t border-stone-100 pt-4">
              <ItemInteractions item={detailItem} userName={profile.name} onUpdate={handleUpdateGalleryItem} variant="detail" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setDetailItem(null); navigate('/gallery'); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">前往画廊</button>
              <button onClick={() => setDetailItem(null)} className="flex-1 py-3 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors">关闭</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
