import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { dmcaRequests, activityLog } from '../../shared/schema.js';
import type { ApiResponse } from '../../shared/types.js';
import { publicWriteLimiter } from '../middleware/rateLimit.js';

const router = Router();

const dmcaSchema = z.object({
  copyrightOwner: z.string().trim().min(2, 'Copyright owner name is required').max(255),
  email: z.string().email('Valid email is required').max(255),
  contentUrl: z.string().url('Valid content URL is required').max(2048),
  originalUrl: z.string().url('Valid original URL is required').max(2048),
  description: z.string().max(5_000).optional(),
  signature: z.string().trim().min(2, 'Digital signature is required').max(255),
});

router.post('/', publicWriteLimiter, async (req, res) => {
  try {
    const data = dmcaSchema.parse(req.body);
    const db = getDb();

    const [request] = await db.insert(dmcaRequests).values({
      copyrightOwner: data.copyrightOwner,
      email: data.email,
      contentUrl: data.contentUrl,
      originalUrl: data.originalUrl,
      description: data.description || null,
      signature: data.signature,
    }).returning();

    await db.insert(activityLog).values({
      action: 'dmca_submit',
      entity: 'dmca',
      entityId: request.id,
      details: { email: data.email, contentUrl: data.contentUrl },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Your DMCA request has been submitted. We will review it within 48 hours.',
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[dmca]', error);
    res.status(500).json({ success: false, error: 'Failed to submit DMCA request' });
  }
});

export default router;
