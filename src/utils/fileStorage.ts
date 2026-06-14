import { STORAGE_KEYS } from '../types';

export const fileStorage = {
  async exportAllData(): Promise<void> {
    const data = {
      profile: localStorage.getItem(STORAGE_KEYS.PROFILE),
      quotes: localStorage.getItem(STORAGE_KEYS.QUOTES),
      gallery: localStorage.getItem(STORAGE_KEYS.GALLERY),
      moodEntries: localStorage.getItem(STORAGE_KEYS.MOOD_ENTRIES),
      moodTemplates: localStorage.getItem(STORAGE_KEYS.MOOD_TEMPLATES),
      inventory: localStorage.getItem(STORAGE_KEYS.INVENTORY),
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-space-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, data.profile);
          if (data.quotes) localStorage.setItem(STORAGE_KEYS.QUOTES, data.quotes);
          if (data.gallery) localStorage.setItem(STORAGE_KEYS.GALLERY, data.gallery);
          if (data.moodEntries) localStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, data.moodEntries);
          if (data.moodTemplates) localStorage.setItem(STORAGE_KEYS.MOOD_TEMPLATES, data.moodTemplates);
          if (data.inventory) localStorage.setItem(STORAGE_KEYS.INVENTORY, data.inventory);
          
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  },

  setupAutoSave(intervalMinutes: number = 30): void {
    setInterval(() => {
      this.exportAllData();
    }, intervalMinutes * 60 * 1000);
  }
};
