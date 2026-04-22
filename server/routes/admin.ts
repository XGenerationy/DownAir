import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db.js';
import {
  adminUsers,
  contentPages,
  contactSubmissions,
  dmcaRequests,
  downloads,
  activityLog,
} from '../../shared/schema.js';
import { AUTH_COOKIE, authMiddleware, generateToken, getAuthCookieOptions } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { sanitizeContent } from '../utils/sanitize.js';
import { CONTENT_CATEGORIES } from '../../shared/types.js';
import type { ApiResponse, DashboardStats } from '../../shared/types.js';

const router = Router();

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(255),
});

const contentPageSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9\-]+$/i, 'Slug must be kebab-case'),
  title: z.string().min(1).max(500),
  category: z.enum(CONTENT_CATEGORIES as [string, ...string[]]),
  metaDescription: z.string().max(500).optional(),
  content: z.string().min(1).max(500_000),
  isPublished: z.boolean().optional(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6).max(255),
  newPassword: z.string().min(8).max(255),
});

const dmcaStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const db = getDb();

    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    if (!admin) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ id: admin.id, email: admin.email });
    res.cookie(AUTH_COOKIE, token, getAuthCookieOptions());

    res.json({
      success: true,
      data: {
        admin: { id: admin.id, email: admin.email, name: admin.name || 'Admin' },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[admin/login]', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE, { ...getAuthCookieOptions(), maxAge: 0 });
  res.json({ success: true });
});

router.get('/me', authMiddleware, (req, res) => {
  const adminUser = (req as unknown as { adminUser: { id: number; email: string } }).adminUser;
  res.json({ success: true, data: adminUser });
});

router.get('/dashboard', authMiddleware, async (_req, res) => {
  try {
    const db = getDb();
    const [[dl], [cp], [cs], [dm], [pendingD], [pub], [draft]] = await Promise.all([
      db.select({ c: count() }).from(downloads),
      db.select({ c: count() }).from(contentPages),
      db.select({ c: count() }).from(contactSubmissions),
      db.select({ c: count() }).from(dmcaRequests),
      db.select({ c: count() }).from(dmcaRequests).where(eq(dmcaRequests.status, 'pending')),
      db.select({ c: count() }).from(contentPages).where(eq(contentPages.isPublished, true)),
      db.select({ c: count() }).from(contentPages).where(eq(contentPages.isPublished, false)),
    ]);
    const recentActivity = await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(20);

    const stats: DashboardStats = {
      totalDownloads: Number(dl.c),
      totalContentPages: Number(cp.c),
      publishedPages: Number(pub.c),
      draftPages: Number(draft.c),
      contactSubmissions: Number(cs.c),
      dmcaRequests: Number(dm.c),
      pendingDmca: Number(pendingD.c),
    };

    res.json({ success: true, data: { stats, recentActivity } });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin/dashboard]', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
});

router.get('/content', authMiddleware, async (_req, res) => {
  try {
    const db = getDb();
    const pages = await db.select().from(contentPages).orderBy(desc(contentPages.createdAt));
    res.json({ success: true, data: pages });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to load content' });
  }
});

router.get('/content/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const db = getDb();
    const [page] = await db.select().from(contentPages).where(eq(contentPages.id, id)).limit(1);
    if (!page) {
      res.status(404).json({ success: false, error: 'Page not found' });
      return;
    }
    res.json({ success: true, data: page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to fetch page' });
  }
});

router.post('/content', authMiddleware, async (req, res) => {
  try {
    const data = contentPageSchema.parse(req.body);
    const db = getDb();
    const [page] = await db.insert(contentPages).values({
      slug: data.slug,
      title: data.title,
      category: data.category,
      metaDescription: data.metaDescription || null,
      content: sanitizeContent(data.content),
      isPublished: data.isPublished || false,
    }).returning();
    res.json({ success: true, data: page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create page' });
  }
});

router.put('/content/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = contentPageSchema.partial().parse(req.body);
    if (typeof data.content === 'string') {
      data.content = sanitizeContent(data.content);
    }
    const db = getDb();
    const [page] = await db.update(contentPages).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(contentPages.id, id)).returning();
    if (!page) {
      res.status(404).json({ success: false, error: 'Page not found' });
      return;
    }
    res.json({ success: true, data: page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to update page' });
  }
});

router.delete('/content/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const db = getDb();
    await db.delete(contentPages).where(eq(contentPages.id, id));
    res.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to delete page' });
  }
});

router.get('/contacts', authMiddleware, async (_req, res) => {
  try {
    const db = getDb();
    const contacts = await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(500);
    res.json({ success: true, data: contacts });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to load contacts' });
  }
});

router.put('/contacts/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const db = getDb();
    await db.update(contactSubmissions).set({ isRead: true }).where(eq(contactSubmissions.id, id));
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to update' });
  }
});

router.get('/dmca', authMiddleware, async (_req, res) => {
  try {
    const db = getDb();
    const requests = await db.select().from(dmcaRequests).orderBy(desc(dmcaRequests.createdAt)).limit(500);
    res.json({ success: true, data: requests });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to load DMCA requests' });
  }
});

router.put('/dmca/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status } = dmcaStatusSchema.parse(req.body);
    const db = getDb();
    await db.update(dmcaRequests).set({ status }).where(eq(dmcaRequests.id, id));
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to update' });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = passwordChangeSchema.parse(req.body);
    const db = getDb();

    const adminUser = (req as unknown as { adminUser: { id: number; email: string } }).adminUser;
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, adminUser.id)).limit(1);
    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin not found' });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      res.status(400).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.update(adminUsers).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(adminUsers.id, admin.id));

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

export default router;
