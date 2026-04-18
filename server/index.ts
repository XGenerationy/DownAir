import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

import downloadRouter from './routes/download.js';
import contactRouter from './routes/contact.js';
import dmcaRouter from './routes/dmca.js';
import adminRouter from './routes/admin.js';
import guidesRouter from './routes/guides.js';
import setupRouter from './routes/setup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.APP_PORT || '3001');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/setup', setupRouter);
app.use('/api/download', downloadRouter);
app.use('/api/contact', contactRouter);
app.use('/api/dmca', dmcaRouter);
app.use('/api/admin', adminRouter);
app.use('/api/guides', guidesRouter);

app.get('/api/sitemap', async (_req, res) => {
  try {
    const { getDb } = await import('./db.js');
    const { contentPages } = await import('../shared/schema.js');
    const { eq } = await import('drizzle-orm');
    const db = getDb();
    const pages = await db.select().from(contentPages).where(eq(contentPages.isPublished, true));
    const baseUrl = process.env.APP_URL || 'https://downair.net';

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
  } catch {
    res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
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

app.use('/admin', (req, res, next) => {
  if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    next();
  }
});

app.use((_req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, () => {
  console.log(`[DownAir] Server running on http://localhost:${PORT}`);
  console.log(`[DownAir] API available at http://localhost:${PORT}/api`);
  console.log(`[DownAir] Setup: ${process.env.SETUP_COMPLETED === 'true' ? 'Completed' : 'Pending'}`);
});
