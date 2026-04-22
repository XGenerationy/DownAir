export type Platform = 
  | 'youtube' | 'tiktok' | 'instagram' | 'twitter' 
  | 'facebook' | 'dailymotion' | 'vimeo' | 'reddit' 
  | 'twitch' | 'pinterest' | 'linkedin' | 'snapchat' | 'unknown';

export type MediaType = 'video' | 'audio' | 'image' | 'gif';

export type FormatQuality = {
  formatId: string;
  format: string;
  quality: string;
  mimeType: string;
  fileSize?: string;
  isAudioOnly: boolean;
};

export type MediaAnalysis = {
  platform: Platform;
  mediaType: MediaType;
  title: string;
  thumbnail?: string;
  duration?: number;
  author?: string;
  description?: string;
  formats: FormatQuality[];
};

export type DownloadRequest = {
  url: string;
  formatId: string;
};

export type DownloadTokenPayload = {
  downloadId: number;
  sourceUrl: string;
  format: string;
  expiresAt: number;
};

export type SetupConfig = {
  appName: string;
  appUrl: string;
  appPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type ContentPageCategory =
  | 'Servers' | 'Networking' | 'Cybersecurity' | 'Cloud Computing'
  | 'AI & Machine Learning' | 'Databases' | 'Linux' | 'Web Development'
  | 'DevOps' | 'Mobile Development' | 'Health Tech' | 'Hardware' | 'Data Science';

export type DashboardStats = {
  totalDownloads: number;
  totalContentPages: number;
  publishedPages: number;
  draftPages: number;
  contactSubmissions: number;
  dmcaRequests: number;
  pendingDmca: number;
};

export type AdminLoginRequest = {
  email: string;
  password: string;
};

export type AdminLoginResponse = {
  admin: {
    id: number;
    email: string;
    name: string;
  };
};

export const PLATFORMS: { name: Platform; label: string; color: string }[] = [
  { name: 'youtube', label: 'YouTube', color: '#FF0000' },
  { name: 'tiktok', label: 'TikTok', color: '#000000' },
  { name: 'instagram', label: 'Instagram', color: '#E4405F' },
  { name: 'twitter', label: 'Twitter / X', color: '#1DA1F2' },
  { name: 'facebook', label: 'Facebook', color: '#1877F2' },
  { name: 'dailymotion', label: 'Dailymotion', color: '#00AAFF' },
  { name: 'vimeo', label: 'Vimeo', color: '#1AB7EA' },
  { name: 'reddit', label: 'Reddit', color: '#FF4500' },
  { name: 'twitch', label: 'Twitch', color: '#9146FF' },
  { name: 'pinterest', label: 'Pinterest', color: '#BD081C' },
  { name: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { name: 'snapchat', label: 'Snapchat', color: '#FFFC00' },
];

export const CONTENT_CATEGORIES: ContentPageCategory[] = [
  'Servers', 'Networking', 'Cybersecurity', 'Cloud Computing',
  'AI & Machine Learning', 'Databases', 'Linux', 'Web Development',
  'DevOps', 'Mobile Development', 'Health Tech', 'Hardware', 'Data Science',
];
