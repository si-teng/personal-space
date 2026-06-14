import { UserProfile, Quote, GalleryItem, MoodEntry, MoodTemplate, InventoryItem } from '../types';

export const initialProfile: UserProfile = {
  name: '林小语',
  coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
  signature: '在平凡的日子里，寻找不平凡的光芒',
  bio: '热爱阅读、摄影与文字记录。相信每一个瞬间都值得被珍藏，每一种情绪都值得被倾听。'
};

export const initialQuotes: Quote[] = [
  {
    id: '1',
    content: '生活不是等待暴风雨过去，而是学会在雨中跳舞。',
    author: '维维安·格林',
    source: '《心灵鸡汤》',
    createdAt: '2024-01-15T10:30:00Z',
    tags: ['生活', '励志']
  },
  {
    id: '2',
    content: '读书的意义，大概就是用生活所感去读书，用读书所得去生活。',
    author: '杨绛',
    createdAt: '2024-02-20T14:20:00Z',
    tags: ['阅读', '人生']
  },
  {
    id: '3',
    content: '愿你出走半生，归来仍是少年。',
    author: '孙光曼',
    createdAt: '2024-03-10T09:15:00Z',
    tags: ['成长', '初心']
  }
];

export const initialGallery: GalleryItem[] = [
  {
    id: '1',
    title: '春日午后',
    description: '阳光透过窗帘的缝隙，在书桌上投下斑驳的光影。',
    imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600',
    category: '摄影',
    createdAt: '2024-01-20T16:00:00Z'
  },
  {
    id: '2',
    title: '咖啡时光',
    description: '一杯手冲咖啡，一本好书，便是周末最好的打开方式。',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
    category: '生活',
    createdAt: '2024-02-15T11:30:00Z'
  },
  {
    id: '3',
    title: '山间漫步',
    description: '远离城市的喧嚣，在山林间寻找内心的宁静。',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600',
    category: '旅行',
    createdAt: '2024-03-25T08:45:00Z'
  }
];

export const initialMoodTemplates: MoodTemplate[] = [
  {
    id: '1',
    name: '今日心情',
    content: '<p>今天的心情是：<strong></strong></p><p>发生的事情：</p><p>我的感受：</p><p>想要记住的瞬间：</p>',
    isDefault: true
  },
  {
    id: '2',
    name: '感恩日记',
    content: '<p>今天值得感恩的三件事：</p><p>1. </p><p>2. </p><p>3. </p><p>今天学到的东西：</p>',
    isDefault: true
  }
];

export const initialMoodEntries: MoodEntry[] = [
  {
    id: '1',
    content: '<p>今天的心情是：<strong>平静而满足</strong></p><p>发生的事情：完成了拖延已久的阅读计划</p><p>我的感受：内心充实，对未来充满期待</p><p>想要记住的瞬间：傍晚时分，夕阳染红了整片天空</p>',
    mood: '平静',
    templateId: '1',
    createdAt: '2024-04-01T19:30:00Z'
  },
  {
    id: '2',
    content: '<p>今天值得感恩的三件事：</p><p>1. 早晨的第一杯咖啡</p><p>2. 朋友发来的问候消息</p><p>3. 顺利完成工作任务</p><p>今天学到的东西：专注当下，享受过程</p>',
    mood: '感恩',
    templateId: '2',
    createdAt: '2024-04-02T21:00:00Z'
  }
];

export const initialInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Kindle Paperwhite',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    purchaseDate: '2023-06-15',
    cost: 998,
    category: '电子产品',
    notes: '阅读神器，每天使用',
    createdAt: '2023-06-15T10:00:00Z'
  },
  {
    id: '2',
    name: '手冲咖啡套装',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    purchaseDate: '2023-09-20',
    cost: 368,
    category: '生活用品',
    notes: '周末早晨的仪式感',
    createdAt: '2023-09-20T14:30:00Z'
  },
  {
    id: '3',
    name: '机械键盘',
    imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400',
    purchaseDate: '2024-01-10',
    cost: 599,
    category: '电子产品',
    notes: '打字手感极佳',
    createdAt: '2024-01-10T09:00:00Z'
  }
];
