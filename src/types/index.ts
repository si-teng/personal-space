// User Profile
export interface UserProfile {
  name: string;
  signature: string;
  bio: string;
  avatarPath?: string;
  coverPath?: string;
}

// Quote
export interface Quote {
  id: string;
  content: string;
  author: string;
  source?: string;
  createdAt: string;
  tags: string[];
}

// Gallery Item
export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  category: string;
  createdAt: string;
  story?: string;
  likes?: Like[];
  comments?: Comment[];
}

export interface Like {
  id: string;
  userName: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userName: string;
  content: string;
  createdAt: string;
}

// Mood Entry
export interface MoodEntry {
  id: string;
  content: string;
  mood: string;
  templateId?: string;
  createdAt: string;
}

export interface MoodTemplate {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

// Custom Mood
export interface CustomMood {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

// Mood Filter
export interface MoodFilter {
  dateRange: 'all' | 'thisMonth' | 'custom';
  startDate?: string;
  endDate?: string;
  selectedMoods: string[];
}

// Inventory Item
export interface InventoryItem {
  id: string;
  name: string;
  imageUrls: string[];
  purchaseDate: string;
  retireDate?: string;
  cost: number;
  category: string;
  costViewMode?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  manualUrl?: string;
  manualImageId?: string;
  createdAt: string;
}

// Local Storage Keys
export const STORAGE_KEYS = {
  PROFILE: 'personal_space_profile',
  QUOTES: 'personal_space_quotes',
  GALLERY: 'personal_space_gallery',
  MOOD_ENTRIES: 'personal_space_mood_entries',
  MOOD_TEMPLATES: 'personal_space_mood_templates',
  CUSTOM_MOODS: 'personal_space_custom_moods',
  MOOD_FILTER: 'personal_space_mood_filter',
  INVENTORY: 'personal_space_inventory',
  GALLERY_CATEGORIES: 'personal_space_gallery_categories',
} as const;
