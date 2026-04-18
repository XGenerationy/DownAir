import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { contactSubmissions, activityLog } from '../../shared/schema.js';
import type { ApiResponse } from '../../shared/types.js';
import { publicWriteLimiter } from '../middleware/rateLimit.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Valid email is required').max(255),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(500),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(10_000, 'Message too long'),
});

router.post('/', publicWriteLimiter, async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);
    const db = getDb();

    const [submission] = await db.insert(contactSubmissions).values({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    }).returning();

    await db.insert(activityLog).values({
      action: 'contact_submit',
      entity: 'contact',
      entityId: submission.id,
      details: { email: data.email, subject: data.subject },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[contact]', error);
    res.status(500).json({ success: false, error: 'Failed to submit contact form' });
  }
});

export default router;
