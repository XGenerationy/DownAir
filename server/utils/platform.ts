import type { Platform, MediaType } from '../../shared/types.js';

const PLATFORM_PATTERNS: { pattern: RegExp; platform: Platform }[] = [
  { pattern: /(?:youtube\.com|youtu\.be)/i, platform: 'youtube' },
  { pattern: /tiktok\.com/i, platform: 'tiktok' },
  { pattern: /instagram\.com/i, platform: 'instagram' },
  { pattern: /(?:twitter\.com|x\.com)/i, platform: 'twitter' },
  { pattern: /facebook\.com/i, platform: 'facebook' },
  { pattern: /dailymotion\.com/i, platform: 'dailymotion' },
  { pattern: /vimeo\.com/i, platform: 'vimeo' },
  { pattern: /reddit\.com/i, platform: 'reddit' },
  { pattern: /twitch\.tv/i, platform: 'twitch' },
  { pattern: /pinterest\.com/i, platform: 'pinterest' },
  { pattern: /linkedin\.com/i, platform: 'linkedin' },
  { pattern: /snapchat\.com/i, platform: 'snapchat' },
];

export function detectPlatform(url: string): Platform {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return 'unknown';
}

export function detectMediaType(url: string, metadata?: Record<string, unknown>): MediaType {
  if (metadata) {
    const ext = (metadata.ext as string) || '';
    const mimeType = (metadata.mimetype as string) || '';
    
    if (mimeType.startsWith('audio/') || ['mp3', 'm4a', 'ogg', 'wav', 'flac', 'aac'].includes(ext)) {
      return 'audio';
    }
    if (mimeType.startsWith('image/gif') || ext === 'gif') {
      return 'gif';
    }
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext)) {
      return 'image';
    }
  }

  const lowerUrl = url.toLowerCase();
  if (/\.(mp3|m4a|ogg|wav|flac|aac)(\?|$)/i.test(lowerUrl)) return 'audio';
  if (/\.(gif)(\?|$)/i.test(lowerUrl)) return 'gif';
  if (/\.(jpg|jpeg|png|webp|bmp)(\?|$)/i.test(lowerUrl)) return 'image';

  const platform = detectPlatform(url);
  const imagePlatforms: Platform[] = ['pinterest', 'instagram', 'linkedin'];
  if (imagePlatforms.includes(platform)) {
    if (/\/p\/|\/pin\//i.test(lowerUrl)) return 'image';
  }

  return 'video';
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
