import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const HMAC_SECRET = process.env.HMAC_SECRET || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const TOKEN_EXPIRY_MINUTES = 10;

export interface TokenData {
  downloadId: number;
  sourceUrl: string;
  format: string;
  expiresAt: number;
  iv: string;
  authTag: string;
}

export function createDownloadToken(
  downloadId: number,
  sourceUrl: string,
  format: string
): string {
  const expiresAt = Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000;
  const iv = crypto.randomBytes(16).toString('hex');

  const payload = JSON.stringify({
    downloadId,
    sourceUrl,
    format,
    expiresAt,
  });

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
    Buffer.from(iv, 'hex')
  );

  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const hmac = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${encrypted}:${iv}:${authTag}`)
    .digest('hex');

  const token = Buffer.from(
    JSON.stringify({ encrypted, iv, authTag, hmac })
  ).toString('base64url');

  return token;
}

export function verifyDownloadToken(token: string): TokenData | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8')
    ) as { encrypted: string; iv: string; authTag: string; hmac: string };

    const expectedHmac = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${decoded.encrypted}:${decoded.iv}:${decoded.authTag}`)
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(decoded.hmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    )) {
      return null;
    }

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
      Buffer.from(decoded.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(decoded.authTag, 'hex'));

    let decrypted = decipher.update(decoded.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted) as {
      downloadId: number;
      sourceUrl: string;
      format: string;
      expiresAt: number;
    };

    if (data.expiresAt < Date.now()) {
      return null;
    }

    return { ...data, iv: decoded.iv, authTag: decoded.authTag };
  } catch {
    return null;
  }
}

export function generateSecrets(): {
  jwtSecret: string;
  encryptionKey: string;
  hmacSecret: string;
} {
  return {
    jwtSecret: crypto.randomBytes(64).toString('hex'),
    encryptionKey: crypto.randomBytes(32).toString('hex'),
    hmacSecret: crypto.randomBytes(32).toString('hex'),
  };
}
