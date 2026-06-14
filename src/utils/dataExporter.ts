import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { STORAGE_KEYS } from '../types';
import { imageManager } from './imageManager';

export type ExportMode = 'full' | 'data-only';

interface ExportData {
  profile: string | null;
  quotes: string | null;
  gallery: string | null;
  moodEntries: string | null;
  moodTemplates: string | null;
  inventory: string | null;
  exportTime: string;
  version: string;
}

class DataExporter {
  async exportData(mode: ExportMode = 'full'): Promise<void> {
    const data = this.collectData();
    
    if (mode === 'data-only') {
      await this.exportDataOnly(data);
    } else {
      await this.exportFullPackage(data);
    }
  }

  private collectData(): ExportData {
    return {
      profile: localStorage.getItem(STORAGE_KEYS.PROFILE),
      quotes: localStorage.getItem(STORAGE_KEYS.QUOTES),
      gallery: localStorage.getItem(STORAGE_KEYS.GALLERY),
      moodEntries: localStorage.getItem(STORAGE_KEYS.MOOD_ENTRIES),
      moodTemplates: localStorage.getItem(STORAGE_KEYS.MOOD_TEMPLATES),
      inventory: localStorage.getItem(STORAGE_KEYS.INVENTORY),
      exportTime: new Date().toISOString(),
      version: '2.0'
    };
  }

  private async exportDataOnly(data: ExportData): Promise<void> {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const date = new Date().toISOString().split('T')[0];
    saveAs(blob, `personal-space-data-${date}.json`);
  }

  private async exportFullPackage(data: ExportData): Promise<void> {
    const zip = new JSZip();
    
    zip.file('data.json', JSON.stringify(data, null, 2));
    
    const imagesFolder = zip.folder('images');
    if (imagesFolder) {
      const allImages = await imageManager.exportAllImages();
      
      for (const [id, blob] of Object.entries(allImages)) {
        const extension = blob.type === 'image/png' ? 'png' : 'jpg';
        imagesFolder.file(`${id}.${extension}`, blob);
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const date = new Date().toISOString().split('T')[0];
    saveAs(content, `personal-space-backup-${date}.zip`);
  }

  async exportGalleryImages(): Promise<void> {
    const galleryImages = await imageManager.getImagesByPrefix('gallery');
    const zip = new JSZip();
    const folder = zip.folder('gallery-images');
    
    if (folder) {
      for (const img of galleryImages) {
        const extension = img.type === 'image/png' ? 'png' : 'jpg';
        folder.file(`${img.id}.${extension}`, img.data);
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `gallery-images-${new Date().toISOString().split('T')[0]}.zip`);
  }

  async exportInventoryImages(): Promise<void> {
    const inventoryImages = await imageManager.getImagesByPrefix('inventory');
    const zip = new JSZip();
    const folder = zip.folder('inventory-images');
    
    if (folder) {
      for (const img of inventoryImages) {
        const extension = img.type === 'image/png' ? 'png' : 'jpg';
        folder.file(`${img.id}.${extension}`, img.data);
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `inventory-images-${new Date().toISOString().split('T')[0]}.zip`);
  }
}

export const dataExporter = new DataExporter();
