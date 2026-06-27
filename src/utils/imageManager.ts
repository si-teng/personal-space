import { STORAGE_KEYS } from '../types';

const DB_NAME = 'PersonalSpaceImages';
const DB_VERSION = 1;
const STORE_NAME = 'images';

interface ImageRecord {
  id: string;
  data: Blob;
  type: string;
  size: number;
  createdAt: string;
}

class ImageManager {
  private db: IDBDatabase | null = null;
  private urlCache: Map<string, string> = new Map();

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveImage(file: File, prefix: string = 'img', customId?: string): Promise<string> {
    await this.init();
    const id = customId || `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const record: ImageRecord = {
        id,
        data: file,
        type: file.type,
        size: file.size,
        createdAt: new Date().toISOString()
      };
      
      const request = store.put(record);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getImage(id: string): Promise<ImageRecord | null> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getImageUrl(id: string): Promise<string | null> {
    if (this.urlCache.has(id)) return this.urlCache.get(id)!;
    const record = await this.getImage(id);
    if (!record) return null;

    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(record.data);
    });
    this.urlCache.set(id, url);
    return url;
  }

  async deleteImage(id: string): Promise<void> {
    await this.init();
    this.urlCache.delete(id);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllImages(): Promise<ImageRecord[]> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getImagesByPrefix(prefix: string): Promise<ImageRecord[]> {
    const allImages = await this.getAllImages();
    return allImages.filter(img => img.id.startsWith(prefix));
  }

  async compressImage(file: File, maxWidth: number = 1200, maxHeight: number = 1200): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async createThumbnail(file: File, size: number = 400): Promise<File> {
    return this.compressImage(file, size, size);
  }

  async saveImages(files: File[], prefix: string = 'img'): Promise<string[]> {
    const ids: string[] = [];
    for (const file of files) {
      const id = await this.saveImage(file, prefix);
      ids.push(id);
    }
    return ids;
  }

  async exportAllImages(): Promise<Record<string, Blob>> {
    const images = await this.getAllImages();
    const result: Record<string, Blob> = {};
    
    for (const img of images) {
      result[img.id] = img.data;
    }
    
    return result;
  }

  async importImages(images: Record<string, Blob>): Promise<void> {
    for (const [id, data] of Object.entries(images)) {
      const record: ImageRecord = {
        id,
        data,
        type: data.type || 'image/jpeg',
        size: data.size,
        createdAt: new Date().toISOString()
      };
      
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async clearAllImages(): Promise<void> {
    await this.init();
    this.urlCache.clear();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const imageManager = new ImageManager();
