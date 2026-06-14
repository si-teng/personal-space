import { motion } from 'framer-motion';
import { Quote, Image, BookHeart, Package, ArrowRight, Camera, Check, X, Download, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { storage } from '../utils/storage';
import { imageManager } from '../utils/imageManager';
import { dataExporter } from '../utils/dataExporter';
import { dataImporter } from '../utils/dataImporter';
import type { UserProfile, Quote as QuoteType } from '../types';
import { STORAGE_KEYS } from '../types';

const modules = [
  { id: 'quotes', name: '收藏语录', icon: Quote, path: '/quotes', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'gallery', name: '作品画廊', icon: Image, path: '/gallery', color: 'bg-amber-50 text-amber-600' },
  { id: 'mood', name: '情绪日志', icon: BookHeart, path: '/mood', color: 'bg-rose-50 text-rose-600' },
  { id: 'inventory', name: '物品台账', icon: Package, path: '/inventory', color: 'bg-emerald-50 text-emerald-600' },
];

export default function Home() {
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
  const [importing, setImporting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = storage.get<UserProfile>('personal_space_profile');
    if (saved) {
      setProfile(saved);
      loadImages(saved);
    }
  }, []);

  const loadImages = async (profileData: UserProfile) => {
    if (profileData.avatarPath) {
      try {
        const url = await imageManager.getImageUrl(profileData.avatarPath);
        setAvatarUrl(url || '');
      } catch {
        setAvatarUrl('');
      }
    }
    if (profileData.coverPath) {
      try {
        const url = await imageManager.getImageUrl(profileData.coverPath);
        setCoverUrl(url || '');
      } catch {
        setCoverUrl('');
      }
    }
  };

  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    storage.set('personal_space_profile', newProfile);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await imageManager.compressImage(file, type === 'avatar' ? 400 : 1200, type === 'avatar' ? 400 : 800);
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const customId = `${type}_${timestamp}_${random}`;
      const imageId = await imageManager.saveImage(compressed, type, customId);

      if (type === 'avatar' && profile.avatarPath) {
        try {
          await imageManager.deleteImage(profile.avatarPath);
        } catch (e) {
          console.error('Failed to delete old avatar:', e);
        }
      }
      if (type === 'cover' && profile.coverPath) {
        try {
          await imageManager.deleteImage(profile.coverPath);
        } catch (e) {
          console.error('Failed to delete old cover:', e);
        }
      }

      const newProfile = { ...profile, [type === 'avatar' ? 'avatarPath' : 'coverPath']: imageId };
      saveProfile(newProfile);

      const url = await imageManager.getImageUrl(imageId);
      if (type === 'avatar') {
        setAvatarUrl(url || '');
      } else {
        setCoverUrl(url || '');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const startEdit = (field: string, value: string) => {
    setEditing(field);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (editing) {
      saveProfile({ ...profile, [editing]: editValue });
      if (editing === 'bio' && editValue.trim()) {
        const quotes = storage.get<QuoteType[]>(STORAGE_KEYS.QUOTES) || [];
        const newQuote: QuoteType = {
          id: Date.now().toString(),
          content: editValue,
          author: profile.name,
          createdAt: new Date().toISOString(),
          tags: ['个人感悟']
        };
        storage.set(STORAGE_KEYS.QUOTES, [newQuote, ...quotes]);
      }
      setEditing(null);
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const handleExport = async (mode: 'full' | 'data-only') => {
    await dataExporter.exportData(mode);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      let result;
      if (file.name.endsWith('.zip')) {
        result = await dataImporter.importFromZip(file);
      } else {
        result = await dataImporter.importFromJson(file);
      }

      if (result.success) {
        if (result.missingImages.length > 0) {
          alert(`导入成功，但以下图片未找到：${result.missingImages.join(', ')}`);
        } else {
          alert('导入成功！');
        }
        window.location.reload();
      } else {
        alert('导入失败，请检查文件格式');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败：' + (error as Error).message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-72"
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : 'linear-gradient(to bottom right, #e0e7ff, #fef3c7)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute top-4 right-4 p-2 bg-white/80 rounded-full hover:bg-white transition"
        >
          <Camera size={20} className="text-stone-600" />
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, 'cover')}
          className="hidden"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div
              className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-light text-indigo-600">{profile.name.charAt(0)}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full">
              <Camera size={14} className="text-white" />
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'avatar')}
              className="hidden"
            />
          </motion.div>
        </div>
      </motion.div>

      <div className="px-6 py-8 max-w-2xl mx-auto text-center">
        {editing === 'name' ? (
          <div className="flex items-center justify-center gap-2 mb-2">
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-2xl font-semibold text-center border-b-2 border-indigo-500 outline-none bg-transparent"
            />
            <button onClick={saveEdit} className="p-1 text-green-600"><Check size={18} /></button>
            <button onClick={cancelEdit} className="p-1 text-red-600"><X size={18} /></button>
          </div>
        ) : (
          <h1
            className="text-2xl font-semibold text-stone-800 mb-2 cursor-pointer hover:text-indigo-600 transition-colors"
            onDoubleClick={() => startEdit('name', profile.name)}
          >
            {profile.name}
          </h1>
        )}

        {editing === 'signature' ? (
          <div className="flex items-center justify-center gap-2 mb-4">
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm text-center border-b border-stone-300 outline-none bg-transparent w-64"
            />
            <button onClick={saveEdit} className="p-1 text-green-600"><Check size={16} /></button>
            <button onClick={cancelEdit} className="p-1 text-red-600"><X size={16} /></button>
          </div>
        ) : (
          <p
            className="text-sm text-stone-500 italic mb-4 cursor-pointer hover:text-indigo-600 transition-colors"
            onDoubleClick={() => startEdit('signature', profile.signature)}
          >
            {profile.signature}
          </p>
        )}

        {editing === 'bio' ? (
          <div className="flex flex-col items-center gap-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full max-w-md p-3 border border-stone-200 rounded-lg outline-none resize-none"
              rows={3}
            />
            <p className="text-xs text-stone-400">保存后将自动同步到语录</p>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="px-4 py-1 bg-indigo-600 text-white rounded-lg">保存</button>
              <button onClick={cancelEdit} className="px-4 py-1 border border-stone-200 rounded-lg">取消</button>
            </div>
          </div>
        ) : (
          <p
            className="text-stone-600 leading-relaxed max-w-md cursor-pointer hover:text-indigo-600 transition-colors mx-auto"
            onDoubleClick={() => startEdit('bio', profile.bio)}
          >
            {profile.bio}
          </p>
        )}
      </div>

      <div className="px-6 pb-12 max-w-4xl mx-auto">
        <div className="flex justify-end mb-8">
          <div className="relative group">
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <Download size={16} /> 
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-stone-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('full')}
                disabled={importing}
                className="w-full px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 first:rounded-t-lg disabled:opacity-50"
              >
                导出完整包
              </button>
              <button
                onClick={() => handleExport('data-only')}
                disabled={importing}
                className="w-full px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                导出数据
              </button>
              <label className="w-full px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 cursor-pointer last:rounded-b-lg block">
                <input
                  type="file"
                  accept=".json,.zip"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                />
                {importing ? '导入中...' : '导入数据'}
              </label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={module.path}
                className="group block p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all border border-stone-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center`}>
                      <module.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-800">{module.name}</h3>
                      <p className="text-sm text-stone-400 mt-0.5">点击进入</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
