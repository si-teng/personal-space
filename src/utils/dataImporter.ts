import JSZip from 'jszip';
import { STORAGE_KEYS } from '../types';
import { imageManager } from './imageManager';

export type ImportMode = 'auto' | 'manual';

interface ImportData {
  profile: string | null;
  quotes: string | null;
  gallery: string | null;
  moodEntries: string | null;
  moodTemplates: string | null;
  inventory: string | null;
  exportTime?: string;
  version?: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  missingImages: string[];
  importedImages: number;
}

class DataImporter {
  async importFromZip(file: File, merge = false): Promise<ImportResult> {
    try {
      const zip = await JSZip.loadAsync(file);

      const dataFile = zip.file('data.json');
      if (!dataFile) {
        return {
          success: false,
          message: 'ZIP 文件中未找到 data.json',
          missingImages: [],
          importedImages: 0
        };
      }

      const dataContent = await dataFile.async('string');
      const data: ImportData = JSON.parse(dataContent);

      const imageResults = await this.importImagesFromZip(zip);

      this.saveDataToStorage(data, merge);

      return {
        success: true,
        message: '数据导入成功',
        missingImages: imageResults.missing,
        importedImages: imageResults.imported
      };
    } catch (error) {
      return {
        success: false,
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
        missingImages: [],
        importedImages: 0
      };
    }
  }

  async importFromJson(file: File, imageFiles?: File[], merge = false): Promise<ImportResult> {
    try {
      const content = await file.text();
      const data: ImportData = JSON.parse(content);

      let importedImages = 0;
      const missingImages: string[] = [];

      if (imageFiles && imageFiles.length > 0) {
        for (const imgFile of imageFiles) {
          try {
            const id = imgFile.name.replace(/\.(jpg|jpeg|png)$/i, '');
            await imageManager.saveImage(imgFile, id.split('_')[0]);
            importedImages++;
          } catch {
            missingImages.push(imgFile.name);
          }
        }
      }

      this.saveDataToStorage(data, merge);

      return {
        success: true,
        message: '数据导入成功',
        missingImages,
        importedImages
      };
    } catch (error) {
      return {
        success: false,
        message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
        missingImages: [],
        importedImages: 0
      };
    }
  }

  private async importImagesFromZip(zip: JSZip): Promise<{ imported: number; missing: string[] }> {
    const imported: string[] = [];
    const missing: string[] = [];

    const imageFiles = Object.keys(zip.files).filter(
      name => name.startsWith('images/') && !zip.files[name].dir
    );

    if (imageFiles.length === 0) {
      return { imported: 0, missing: [] };
    }

    for (const filePath of imageFiles) {
      try {
        const file = zip.file(filePath);
        if (!file) continue;

        const blob = await file.async('blob');
        const fileName = filePath.replace('images/', '');
        const id = fileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
        const prefix = id.split('_')[0];
        const extension = fileName.match(/\.([^.]+)$/)?.[1] || 'jpg';
        const mimeType = blob.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`;

        const imageFile = new File([blob], fileName, { type: mimeType });
        await imageManager.saveImage(imageFile, prefix, id);
        imported.push(id);
      } catch (error) {
        missing.push(filePath);
      }
    }

    return { imported: imported.length, missing };
  }

  private saveDataToStorage(data: ImportData, merge: boolean): void {
    if (merge) {
      this.mergeDataToStorage(data);
      return;
    }
    if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, data.profile);
    if (data.quotes) localStorage.setItem(STORAGE_KEYS.QUOTES, data.quotes);
    if (data.gallery) localStorage.setItem(STORAGE_KEYS.GALLERY, data.gallery);
    if (data.moodEntries) localStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, data.moodEntries);
    if (data.moodTemplates) localStorage.setItem(STORAGE_KEYS.MOOD_TEMPLATES, data.moodTemplates);
    if (data.inventory) localStorage.setItem(STORAGE_KEYS.INVENTORY, data.inventory);
  }

  private mergeDataToStorage(data: ImportData): void {
    const arrayFields: Array<{ key: string; field: keyof ImportData }> = [
      { key: STORAGE_KEYS.QUOTES, field: 'quotes' },
      { key: STORAGE_KEYS.GALLERY, field: 'gallery' },
      { key: STORAGE_KEYS.MOOD_ENTRIES, field: 'moodEntries' },
      { key: STORAGE_KEYS.MOOD_TEMPLATES, field: 'moodTemplates' },
      { key: STORAGE_KEYS.INVENTORY, field: 'inventory' },
    ];

    for (const { key, field } of arrayFields) {
      const imported = data[field];
      if (!imported) continue;
      try {
        const importedArr = JSON.parse(imported) as Array<{ id: string }>;
        if (!Array.isArray(importedArr)) continue;
        const existingStr = localStorage.getItem(key);
        const existingArr: Array<{ id: string }> = existingStr ? JSON.parse(existingStr) : [];
        if (!Array.isArray(existingArr)) {
          localStorage.setItem(key, imported);
          continue;
        }
        const importIds = new Set(importedArr.map(i => i.id));
        const kept = existingArr.filter(i => !importIds.has(i.id));
        localStorage.setItem(key, JSON.stringify([...importedArr, ...kept]));
      } catch {
        localStorage.setItem(key, imported);
      }
    }

    // profile: skip in merge mode to preserve existing user info
  }

  async validateImportFile(file: File): Promise<{ valid: boolean; message: string }> {
    if (file.name.endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(file);
        const hasDataJson = zip.file('data.json') !== null;
        return {
          valid: hasDataJson,
          message: hasDataJson ? '有效的备份文件' : 'ZIP 文件中缺少 data.json'
        };
      } catch {
        return { valid: false, message: '无效的 ZIP 文件' };
      }
    } else if (file.name.endsWith('.json')) {
      try {
        const content = await file.text();
        JSON.parse(content);
        return { valid: true, message: '有效的 JSON 文件' };
      } catch {
        return { valid: false, message: '无效的 JSON 文件' };
      }
    }
    
    return { valid: false, message: '不支持的文件格式' };
  }

  async migrateFromBase64(): Promise<{ migrated: number; failed: number }> {
    let migrated = 0;
    let failed = 0;
    
    const gallery = localStorage.getItem(STORAGE_KEYS.GALLERY);
    if (gallery) {
      try {
        const items = JSON.parse(gallery);
        for (const item of items) {
          if (item.imageUrl && item.imageUrl.startsWith('data:')) {
            try {
              const blob = await this.base64ToBlob(item.imageUrl);
              const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
              const id = await imageManager.saveImage(file, 'gallery');
              item.imageUrls = [id];
              delete item.imageUrl;
              migrated++;
            } catch {
              failed++;
            }
          }
        }
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(items));
      } catch {
        failed++;
      }
    }
    
    const inventory = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (inventory) {
      try {
        const items = JSON.parse(inventory);
        for (const item of items) {
          if (item.imageUrl && item.imageUrl.startsWith('data:')) {
            try {
              const blob = await this.base64ToBlob(item.imageUrl);
              const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
              const id = await imageManager.saveImage(file, 'inventory');
              item.imageUrls = [id];
              delete item.imageUrl;
              migrated++;
            } catch {
              failed++;
            }
          }
        }
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
      } catch {
        failed++;
      }
    }
    
    return { migrated, failed };
  }

  private async base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
  }
}

export const dataImporter = new DataImporter();
