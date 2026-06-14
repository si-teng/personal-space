import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetView();
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetView();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.25, 5));
  };

  const zoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev / 1.25, 0.5);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, 0.5), 5);
    setScale(newScale);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetView();
    } else {
      setScale(2);
    }
  };

  const prevImage = () => {
    setCurrentIndex(prev => {
      const newIndex = prev === 0 ? images.length - 1 : prev - 1;
      resetView();
      return newIndex;
    });
  };

  const nextImage = () => {
    setCurrentIndex(prev => {
      const newIndex = prev === images.length - 1 ? 0 : prev + 1;
      resetView();
      return newIndex;
    });
  };

  const handleDownload = async () => {
    const imageUrl = images[currentIndex];
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image_${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-stone-900/95 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="absolute inset-0 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-stone-900/50">
              <div className="text-stone-200 text-sm">
                {currentIndex + 1} / {images.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={zoomOut}
                  className="p-2 rounded-lg bg-stone-800/50 text-stone-300 hover:bg-stone-700/50 transition-colors"
                  title="缩小"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="px-3 py-1 text-sm text-stone-400 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  className="p-2 rounded-lg bg-stone-800/50 text-stone-300 hover:bg-stone-700/50 transition-colors"
                  title="放大"
                >
                  <ZoomIn size={20} />
                </button>
                <button
                  onClick={resetView}
                  className="p-2 rounded-lg bg-stone-800/50 text-stone-300 hover:bg-stone-700/50 transition-colors"
                  title="重置"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-stone-800/50 text-stone-300 hover:bg-stone-700/50 transition-colors"
                  title="下载"
                >
                  <Download size={20} />
                </button>
                <div className="w-px h-6 bg-stone-700 mx-2" />
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-stone-800/50 text-stone-300 hover:bg-stone-700/50 transition-colors"
                  title="关闭 (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              ref={containerRef}
              className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
              onClick={e => e.stopPropagation()}
            >
              <motion.img
                key={currentIndex}
                src={images[currentIndex]}
                alt={`图片 ${currentIndex + 1}`}
                className="absolute top-1/2 left-1/2 max-w-full max-h-full object-contain"
                style={{
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                }}
                draggable={false}
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-stone-800/70 text-stone-200 hover:bg-stone-700/70 transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-stone-800/70 text-stone-200 hover:bg-stone-700/70 transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="px-6 py-4 bg-stone-900/50">
                <div className="flex justify-center gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                        resetView();
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-indigo-400' : 'bg-stone-600 hover:bg-stone-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
