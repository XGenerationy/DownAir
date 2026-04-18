import { Router } from 'express';
import { getDb } from '../db.js';
import { contentPages } from '../../shared/schema.js';
import { eq, and, like, sql } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const category = req.query.category as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    let query = db
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
      .where(eq(contentPages.isPublished, true))
      .limit(limit)
      .offset(offset);

    if (category) {
      query = db
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
        .where(and(eq(contentPages.isPublished, true), eq(contentPages.category, category)))
        .limit(limit)
        .offset(offset);
    }

    const pages = await query;
    res.json({ success: true, data: pages });
  } catch {
    res.json({ success: true, data: [] });
  }
});

router.get('/categories', async (_req, res) => {
  res.json({
    success: true,
    data: [
      'Servers', 'Networking', 'Cybersecurity', 'Cloud Computing',
      'AI & Machine Learning', 'Databases', 'Linux', 'Web Development',
      'DevOps', 'Mobile Development', 'Health Tech', 'Hardware', 'Data Science',
    ],
  });
});

router.get('/:slug', async (req, res) => {
  try {
    const db = getDb();
    const [page] = await db
      .select()
      .from(contentPages)
      .where(and(eq(contentPages.slug, req.params.slug), eq(contentPages.isPublished, true)))
      .limit(1);

    if (!page) {
      res.status(404).json({ success: false, error: 'Page not found' });
      return;
    }

    await db
      .update(contentPages)
      .set({ views: sql`${contentPages.views} + 1` })
      .where(eq(contentPages.id, page.id));

    res.json({ success: true, data: page });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch page' });
  }
});

export default router;
