import { execFile } from 'child_process';
import { promisify } from 'util';
import type { MediaAnalysis, FormatQuality } from '../../shared/types.js';
import { detectPlatform, detectMediaType } from './platform.js';

const execFileAsync = promisify(execFile);

const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

interface YtDlpFormat {
  format_id: string;
  ext: string;
  quality: number;
  height?: number;
  width?: number;
  filesize?: number;
  filesize_approx?: number;
  vcodec?: string;
  acodec?: string;
  tbr?: number;
  vbr?: number;
  abr?: number;
  format_note?: string;
  mimetype?: string;
}

interface YtDlpMetadata {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  uploader_id?: string;
  formats?: YtDlpFormat[];
  ext?: string;
  mimetype?: string;
}

export async function analyzeMedia(url: string): Promise<MediaAnalysis> {
  const platform = detectPlatform(url);

  try {
    const { stdout } = await execFileAsync(YT_DLP_PATH, [
      '--dump-json',
      '--no-warnings',
      '--no-check-certificates',
      '--prefer-free-formats',
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      url,
    ], { timeout: 30000, maxBuffer: 10 * 1024 * 1024 });

    const meta = JSON.parse(stdout) as YtDlpMetadata;
    const mediaType = detectMediaType(url, {
      ext: meta.ext,
      mimetype: meta.mimetype,
    });

    const formats = extractFormats(meta.formats || []);

    return {
      platform,
      mediaType,
      title: meta.title || 'Untitled',
      thumbnail: meta.thumbnail,
      duration: meta.duration ? Math.round(meta.duration) : undefined,
      author: meta.uploader,
      description: meta.description?.slice(0, 500),
      formats,
    };
  } catch (error) {
    const mediaType = detectMediaType(url);
    return {
      platform,
      mediaType,
      title: 'Media from ' + platform,
      formats: getDefaultFormats(mediaType),
    };
  }
}

function extractFormats(rawFormats: YtDlpFormat[]): FormatQuality[] {
  const formats: FormatQuality[] = [];
  const seen = new Set<string>();

  for (const f of rawFormats) {
    const isAudioOnly = !f.vcodec || f.vcodec === 'none';
    const isVideoOnly = !f.acodec || f.acodec === 'none';

    if (isAudioOnly && f.acodec && f.acodec !== 'none') {
      const key = `audio_${f.abr || f.tbr || 0}`;
      if (!seen.has(key)) {
        seen.add(key);
        formats.push({
          formatId: f.format_id,
          format: f.ext || 'mp3',
          quality: `${Math.round((f.abr || f.tbr || 0))}kbps`,
          mimeType: `audio/${f.ext || 'mp3'}`,
          fileSize: formatFileSize(f.filesize || f.filesize_approx),
          isAudioOnly: true,
        });
      }
    }

    if (!isAudioOnly && f.height) {
      if (f.height > 1080) continue;
      const qualityLabel = `${f.height}p`;
      const key = `video_${f.height}_${f.ext}`;
      if (!seen.has(key)) {
        seen.add(key);
        formats.push({
          formatId: f.format_id,
          format: f.ext || 'mp4',
          quality: qualityLabel,
          mimeType: `video/${f.ext || 'mp4'}`,
          fileSize: formatFileSize(f.filesize || f.filesize_approx),
          isAudioOnly: false,
        });
      }
    }
  }

  formats.sort((a, b) => {
    if (a.isAudioOnly !== b.isAudioOnly) return a.isAudioOnly ? 1 : -1;
    const qA = parseInt(a.quality) || 0;
    const qB = parseInt(b.quality) || 0;
    return qB - qA;
  });

  return formats.length > 0 ? formats : getDefaultFormats('video');
}

function getDefaultFormats(mediaType: string): FormatQuality[] {
  if (mediaType === 'audio') {
    return [
      { formatId: 'best_audio', format: 'mp3', quality: '320kbps', mimeType: 'audio/mp3', isAudioOnly: true },
      { formatId: 'good_audio', format: 'm4a', quality: '192kbps', mimeType: 'audio/m4a', isAudioOnly: true },
      { formatId: 'ok_audio', format: 'mp3', quality: '128kbps', mimeType: 'audio/mp3', isAudioOnly: true },
    ];
  }
  return [
    { formatId: 'best', format: 'mp4', quality: '1080p', mimeType: 'video/mp4', isAudioOnly: false },
    { formatId: 'good', format: 'mp4', quality: '720p', mimeType: 'video/mp4', isAudioOnly: false },
    { formatId: 'ok', format: 'mp4', quality: '480p', mimeType: 'video/mp4', isAudioOnly: false },
    { formatId: 'best_audio', format: 'mp3', quality: '320kbps', mimeType: 'audio/mp3', isAudioOnly: true },
  ];
}

function formatFileSize(bytes?: number): string | undefined {
  if (!bytes) return undefined;
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export async function streamDownload(
  url: string,
  formatId: string,
  outputPath?: string
): Promise<{ streamPath: string; mimeType: string; fileName: string }> {
  const args = [
    '--no-warnings',
    '--no-check-certificates',
    '--user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    '-f', formatId,
    '--merge-output-format', 'mp4',
    '-j',
    url,
  ];

  const { stdout } = await execFileAsync(YT_DLP_PATH, [
    '--no-warnings',
    '--no-check-certificates',
    '--user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    '--get-url',
    '-f', formatId === 'best' ? 'bestvideo[height<=1080][ext=mp4]+bestaudio/best[height<=1080]/best' : formatId === 'best_audio' ? 'bestaudio/best' : formatId,
    url,
  ], { timeout: 30000 });

  const directUrl = stdout.trim().split('\n')[0];
  const ext = formatId.includes('audio') ? 'mp3' : 'mp4';
  const mimeType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';
  const fileName = `downair_${Date.now()}.${ext}`;

  return { streamPath: directUrl, mimeType, fileName };
}
