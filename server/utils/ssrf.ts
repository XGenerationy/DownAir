const ALLOWED_HOST_SUFFIXES = [
  'googlevideo.com',
  'youtube.com',
  'youtu.be',
  'ytimg.com',
  'tiktokcdn.com',
  'tiktokcdn-us.com',
  'tiktok.com',
  'cdninstagram.com',
  'fbcdn.net',
  'twimg.com',
  'twitter.com',
  'x.com',
  'dmcdn.net',
  'dailymotion.com',
  'vimeocdn.com',
  'vimeo.com',
  'redd.it',
  'reddit.com',
  'redditmedia.com',
  'twitchcdn.net',
  'twitch.tv',
  'pinimg.com',
  'pinterest.com',
  'licdn.com',
  'linkedin.com',
  'snapchat.com',
];

const PRIVATE_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
];

export function assertSafeStreamUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid stream URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Disallowed scheme: ${parsed.protocol}`);
  }

  const host = parsed.hostname.toLowerCase();
  for (const re of PRIVATE_PATTERNS) {
    if (re.test(host)) throw new Error('Private/loopback hosts are not allowed');
  }

  const allowed = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith('.' + suffix),
  );
  if (!allowed) throw new Error(`Host not on allow-list: ${host}`);

  return parsed;
}
