import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { adminUsers, contentPages, contactSubmissions, dmcaRequests, downloads, activityLog } from '../../shared/schema.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';
import { eq, desc, count } from 'drizzle-orm';
import { z } from 'zod';
import type { ApiResponse, DashboardStats, AdminLoginResponse, ContentPageCategory } from '../../shared/types.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const contentPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  metaDescription: z.string().optional(),
  content: z.string().min(1),
  isPublished: z.boolean().optional(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

router.post('/login', async (req, res) => {
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

    const response: ApiResponse<AdminLoginResponse> = {
      success: true,
      data: {
        token,
        admin: { id: admin.id, email: admin.email, name: admin.name || 'Admin' },
      },
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.get('/dashboard', authMiddleware, async (_req, res) => {
  try {
    const db = getDb();
    const allDownloads = await db.select().from(downloads);
    const allPages = await db.select().from(contentPages);
    const allContacts = await db.select().from(contactSubmissions);
    const allDmca = await db.select().from(dmcaRequests);
    const recentActivity = await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(20);

    const stats: DashboardStats = {
      totalDownloads: allDownloads.length,
      totalContentPages: allPages.length,
      publishedPages: allPages.filter((p) => p.isPublished).length,
      draftPages: allPages.filter((p) => !p.isPublished).length,
      contactSubmissions: allContacts.length,
      dmcaRequests: allDmca.length,
      pendingDmca: allDmca.filter((d) => d.status === 'pending').length,
    };

    res.json({ success: true, data: { stats, recentActivity } });
  } catch {
    res.json({
      success: true,
      data: {
        stats: { totalDownloads: 0, totalContentPages: 0, publishedPages: 0, draftPages: 0, contactSubmissions: 0, dmcaRequests: 0, pendingDmca: 0 },
        recentActivity: [],
      },
    });
  }
});

router.get('/content', authMiddleware, async (_req, res) => {
  try {
    const db = getDb();
    const pages = await db.select().from(contentPages).orderBy(desc(contentPages.createdAt));
    res.json({ success: true, data: pages });
  } catch {
    res.json({ success: true, data: [] });
  }
});

router.get('/content/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id as string);
    const [page] = await db.select().from(contentPages).where(eq(contentPages.id, id)).limit(1);
    if (!page) {
      res.status(404).json({ success: false, error: 'Page not found' });
      return;
    }
    res.json({ success: true, data: page });
  } catch {
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
      category: data.category as ContentPageCategory,
      metaDescription: data.metaDescription || null,
      content: data.content,
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
    const data = contentPageSchema.partial().parse(req.body);
    const db = getDb();
    const id = parseInt(req.params.id as string);
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
    const db = getDb();
    const id = parseInt(req.params.id as string);
    await db.delete(contentPages).where(eq(contentPages.id, id));
    res.json({ success: true, message: 'Page deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete page' });
  }
});

router.get('/contacts', authMiddleware, async (_req, res) => {
  try {
    const db = getDb();
    const contacts = await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
    res.json({ success: true, data: contacts });
  } catch {
    res.json({ success: true, data: [] });
  }
});

router.put('/contacts/:id/read', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id as string);
    await db.update(contactSubmissions).set({ isRead: true }).where(eq(contactSubmissions.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update' });
  }
});

router.get('/dmca', authMiddleware, async (_req, res) => {
  try {
    const db = getDb();
    const requests = await db.select().from(dmcaRequests).orderBy(desc(dmcaRequests.createdAt));
    res.json({ success: true, data: requests });
  } catch {
    res.json({ success: true, data: [] });
  }
});

router.put('/dmca/:id/status', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id as string);
    const { status } = req.body as { status: string };
    await db.update(dmcaRequests).set({ status }).where(eq(dmcaRequests.id, id));
    res.json({ success: true });
  } catch {
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
