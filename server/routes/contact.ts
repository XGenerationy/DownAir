import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { contactSubmissions, activityLog } from '../../shared/schema.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

router.post('/', async (req, res) => {
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
    res.status(500).json({ success: false, error: 'Failed to submit contact form' });
  }
});

export default router;
