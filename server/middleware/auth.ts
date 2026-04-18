import type { Request, Response, NextFunction, CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import { config, requireSecrets } from '../config.js';

const JWT_EXPIRY = '2h';
export const AUTH_COOKIE = 'downair_admin';

export function generateToken(payload: { id: number; email: string }): string {
  return jwt.sign(payload, requireSecrets().jwt, { expiresIn: JWT_EXPIRY });
}

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 2 * 60 * 60 * 1000,
    domain: config.COOKIE_DOMAIN,
  };
}

function readToken(req: Request): string | undefined {
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.[AUTH_COOKIE];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = readToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    return;
  }
  try {
    const decoded = jwt.verify(token, requireSecrets().jwt) as { id: number; email: string };
    (req as Request & { adminUser?: { id: number; email: string } }).adminUser = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }
}

export function extendExpressRequest(req: Request): { id: number; email: string } | undefined {
  return (req as Request & { adminUser?: { id: number; email: string } }).adminUser;
}
