import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { imageManager } from '../utils/imageManager';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 10,
  compress = true,
  maxWidth = 1200,
  maxHeight = 1200,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File, index: number): Promise<string | null> => {
    try {
      const imageId = await imageManager.saveImage(file, 'img');
      return imageId;
    } catch (error) {
      console.error('Failed to process image:', error);
      return null;
    }
  };

  const handleFiles = async (files: FileList) => {
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setUploading(true);
    setUploadProgress(0);

    const newImageIds: string[] = [];
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      if (!file.type.startsWith('image/')) continue;
      const imageId = await processFile(file, i);
      if (imageId) {
        newImageIds.push(imageId);
      }
      setUploadProgress(((i + 1) / filesToProcess.length) * 100);
    }

    if (newImageIds.length > 0) {
      onChange([...images, ...newImageIds]);
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [images]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const removeImage = async (index: number) => {
    const imageId = images[index];
    try {
      await imageManager.deleteImage(imageId);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const getImageUrl = async (imageId: string): Promise<string> => {
    try {
      return await imageManager.getImageUrl(imageId);
    } catch {
      return '';
    }
  };

  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const imageId of images) {
        if (!imageUrls[imageId]) {
          urls[imageId] = await getImageUrl(imageId);
        }
      }
      setImageUrls(prev => ({ ...prev, ...urls }));
    };
    loadUrls();
  }, [images]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 mb-4">
        <AnimatePresence>
          {images.map((imageId, index) => (
            <motion.div
              key={imageId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 group"
            >
              {imageUrls[imageId] ? (
                <img
                  src={imageUrls[imageId]}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                </div>
              )}
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1.5 rounded-full bg-stone-900/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-900"
              >
                <X size={14} />
              </button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
                  封面
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {images.length < maxImages && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative aspect-square rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
              isDragging
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-stone-300 hover:border-stone-400 bg-stone-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">{Math.round(uploadProgress)}%</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">点击或拖拽</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleInputChange}
              disabled={uploading}
            />
          </motion.div>
        )}
      </div>

      {images.length === 0 && (
        <div
          className={`w-full py-12 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
            isDragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-stone-300 hover:border-stone-400 bg-stone-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center text-stone-400">
            <ImageIcon className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">拖拽图片到此处，或点击上传</p>
            <p className="text-xs mt-1 text-stone-400">
              支持 JPG、PNG、GIF、WebP 格式，最多 {maxImages} 张
            </p>
          </div>
        </div>
      )}

      <div className="text-xs text-stone-500 text-right">
        {images.length} / {maxImages}
      </div>
    </div>
  );
};
