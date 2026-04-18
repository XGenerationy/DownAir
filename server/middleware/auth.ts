import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = () => process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRY = '24h';

export function generateToken(payload: { id: number; email: string }): string {
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: JWT_EXPIRY });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET()) as { id: number; email: string };
    (req as Request & { adminUser?: { id: number; email: string } }).adminUser = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }
}

export function extendExpressRequest(req: Request): { id: number; email: string } | undefined {
  return (req as Request & { adminUser?: { id: number; email: string } }).adminUser;
}
