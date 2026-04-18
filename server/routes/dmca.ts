import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { dmcaRequests, activityLog } from '../../shared/schema.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

const dmcaSchema = z.object({
  copyrightOwner: z.string().min(2, 'Copyright owner name is required'),
  email: z.string().email('Valid email is required'),
  contentUrl: z.string().url('Valid content URL is required'),
  originalUrl: z.string().url('Valid original URL is required'),
  description: z.string().optional(),
  signature: z.string().min(2, 'Digital signature is required'),
});

router.post('/', async (req, res) => {
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
    res.status(500).json({ success: false, error: 'Failed to submit DMCA request' });
  }
});

export default router;
