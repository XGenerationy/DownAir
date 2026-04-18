import { Router } from 'express';
import { z } from 'zod';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '../db.js';
import { contentPages } from '../../shared/schema.js';
import { CONTENT_CATEGORIES } from '../../shared/types.js';

const router = Router();

const listQuerySchema = z.object({
  category: z.enum(CONTENT_CATEGORIES as [string, ...string[]]).optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

const slugSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9\-]+$/i),
});

router.get('/', async (req, res) => {
  try {
    const { category, page, limit } = listQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    const where = category
      ? and(eq(contentPages.isPublished, true), eq(contentPages.category, category))
      : eq(contentPages.isPublished, true);

    const db = getDb();
    const pages = await db
      .select({
        id: contentPages.id,
        slug: contentPages.slug,
        title: contentPages.title,
        category: contentPages.category,
        metaDescription: contentPages.metaDescription,
        isPublished: contentPages.isPublished,
        views: contentPages.views,
        createdAt: contentPages.createdAt,
      })
      .from(contentPages)
      .where(where)
      .orderBy(desc(contentPages.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ success: true, data: pages });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[guides]', error);
    res.status(500).json({ success: false, error: 'Failed to load guides' });
  }
});

router.get('/categories', (_req, res) => {
  res.json({ success: true, data: CONTENT_CATEGORIES });
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = slugSchema.parse(req.params);
    const db = getDb();
    const [page] = await db
      .select()
      .from(contentPages)
      .where(and(eq(contentPages.slug, slug), eq(contentPages.isPublished, true)))
      .limit(1);

    if (!page) {
      res.status(404).json({ success: false, error: 'Page not found' });
      return;
    }

    await db.update(contentPages)
      .set({ views: sql`${contentPages.views} + 1` })
      .where(eq(contentPages.id, page.id));

    res.json({ success: true, data: page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[guides/:slug]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch page' });
  }
});

export default router;
