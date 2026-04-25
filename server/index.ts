import { config } from './config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

import downloadRouter from './routes/download.js';
import contactRouter from './routes/contact.js';
import dmcaRouter from './routes/dmca.js';
import adminRouter from './routes/admin.js';
import guidesRouter from './routes/guides.js';
import setupRouter from './routes/setup.js';
import adsRouter from './routes/ads.js';
import { apiLimiter } from './middleware/rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const corsOrigins = Array.from(
  new Set([
    config.APP_URL,
    config.APP_URL?.replace('https://', 'https://www.'),
    'http://localhost:5173',
    'http://localhost:3001',
  ].filter(Boolean)),
);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error('CORS: origin not allowed'));
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/setup', setupRouter);
app.use('/api/download', downloadRouter);
app.use('/api/contact', contactRouter);
app.use('/api/dmca', dmcaRouter);
app.use('/api/admin', adminRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/ads', adsRouter);

app.get('/api/sitemap', async (_req, res) => {
  try {
    const { getDb } = await import('./db.js');
    const { contentPages } = await import('../shared/schema.js');
    const { eq } = await import('drizzle-orm');
    const db = getDb();
    const pages = await db.select().from(contentPages).where(eq(contentPages.isPublished, true));
    const baseUrl = config.APP_URL || 'https://downair.net';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const staticPages = ['', '/about', '/contact', '/dmca', '/guides'];
    for (const p of staticPages) {
      xml += `  <url><loc>${baseUrl}${p}</loc><changefreq>weekly</changefreq><priority>${p === '' ? '1.0' : '0.8'}</priority></url>\n`;
    }
    for (const page of pages) {
      xml += `  <url><loc>${baseUrl}/guides/${page.slug}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
    }
    xml += '</urlset>';
    res.type('application/xml').send(xml);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[sitemap]', err);
    res.status(500).type('application/xml').send('<?xml version="1.0"?><error/>');
  }
});

const clientDistPath = path.join(__dirname, '..', 'dist', 'client');
const publicPath = path.join(__dirname, '..', 'public');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('[error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(config.APP_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[DownAir] Server running on http://localhost:${config.APP_PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[DownAir] Setup: ${config.setupDone ? 'Completed' : 'Pending'}`);
});
