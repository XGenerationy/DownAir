import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

export const downloads = pgTable('downloads', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  mediaType: varchar('media_type', { length: 20 }).notNull(),
  format: varchar('format', { length: 50 }),
  quality: varchar('quality', { length: 50 }),
  title: text('title'),
  thumbnail: text('thumbnail'),
  duration: integer('duration'),
  fileSize: text('file_size'),
  token: text('token'),
  ipAddress: varchar('ip_address', { length: 45 }),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const contactSubmissions = pgTable('contact_submissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const dmcaRequests = pgTable('dmca_requests', {
  id: serial('id').primaryKey(),
  copyrightOwner: varchar('copyright_owner', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  contentUrl: text('content_url').notNull(),
  originalUrl: text('original_url').notNull(),
  description: text('description'),
  signature: text('signature').notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const contentPages = pgTable('content_pages', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  metaDescription: text('meta_description'),
  content: text('content').notNull(),
  isPublished: boolean('is_published').default(false),
  views: integer('views').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const downloadTokens = pgTable('download_tokens', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  downloadId: integer('download_id').references(() => downloads.id),
  sourceUrl: text('source_url').notNull(),
  format: varchar('format', { length: 50 }),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 50 }).notNull(),
  entityId: integer('entity_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Download = typeof downloads.$inferSelect;
export type NewDownload = typeof downloads.$inferInsert;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
export type DmcaRequest = typeof dmcaRequests.$inferSelect;
export type NewDmcaRequest = typeof dmcaRequests.$inferInsert;
export type ContentPage = typeof contentPages.$inferSelect;
export type NewContentPage = typeof contentPages.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type DownloadToken = typeof downloadTokens.$inferSelect;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
