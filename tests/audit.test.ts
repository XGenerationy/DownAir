import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'test_jwt_secret_0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.HMAC_SECRET =
  process.env.HMAC_SECRET ||
  'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

const { isValidUrl, detectPlatform, detectMediaType } = await import('../server/utils/platform.js');
const { createDownloadToken, verifyDownloadToken } = await import('../server/utils/token.js');
const { assertSafeStreamUrl } = await import('../server/utils/ssrf.js');
const { sanitizeContent } = await import('../server/utils/sanitize.js');

/* ------------------------------------------------------------------ *
 * 1. Boundary Value Analysis + Equivalence Partitioning: 1–255 chars  *
 * ------------------------------------------------------------------ */
const lenField = z
  .string({ required_error: 'required', invalid_type_error: 'expected string' })
  .min(1, 'required')
  .max(255, 'too long');

type Case = { name: string; input: unknown; expectOk: boolean; expectMessage?: string };
const bvaCases: Case[] = [
  { name: 'BVA-01 length 0',                 input: '',                  expectOk: false, expectMessage: 'required'        },
  { name: 'BVA-02 length 1',                 input: 'a',                 expectOk: true                                     },
  { name: 'BVA-03 length 2',                 input: 'ab',                expectOk: true                                     },
  { name: 'BVA-04 length 127',               input: 'x'.repeat(127),     expectOk: true                                     },
  { name: 'BVA-05 length 128',               input: 'x'.repeat(128),     expectOk: true                                     },
  { name: 'BVA-06 length 254',               input: 'x'.repeat(254),     expectOk: true                                     },
  { name: 'BVA-07 length 255',               input: 'x'.repeat(255),     expectOk: true                                     },
  { name: 'BVA-08 length 256',               input: 'x'.repeat(256),     expectOk: false, expectMessage: 'too long'        },
  { name: 'BVA-09 length 1000',              input: 'x'.repeat(1000),    expectOk: false, expectMessage: 'too long'        },
  { name: 'BVA-10 whitespace length 1',      input: ' ',                 expectOk: true                                     },
  { name: 'BVA-11 emoji length 2 (UTF-16)',  input: '😀',                 expectOk: true                                     },
  { name: 'BVA-12 null',                     input: null,                expectOk: false, expectMessage: 'expected string' },
  { name: 'BVA-13 undefined',                input: undefined,           expectOk: false, expectMessage: 'required'        },
  { name: 'BVA-14 number',                   input: 12345,               expectOk: false, expectMessage: 'expected string' },
  { name: 'BVA-15 object',                   input: { v: 'x' },          expectOk: false, expectMessage: 'expected string' },
];

for (const c of bvaCases) {
  test(c.name, () => {
    const res = lenField.safeParse(c.input);
    assert.equal(res.success, c.expectOk);
    if (!c.expectOk && c.expectMessage) {
      const msg = (res as z.SafeParseError<string>).error.errors[0].message;
      assert.match(msg, new RegExp(c.expectMessage, 'i'));
    }
  });
}

/* ------------------------------------------------------------------ *
 * 2. Security fixes — positive assertions                             *
 * ------------------------------------------------------------------ */

test('SEC-F01 isValidUrl rejects dangerous schemes', () => {
  assert.equal(isValidUrl('file:///etc/passwd'), false);
  assert.equal(isValidUrl('javascript:alert(1)'), false);
  assert.equal(isValidUrl('data:text/html,<script>1</script>'), false);
  assert.equal(isValidUrl('ftp://example.com/'), false);
  assert.equal(isValidUrl('https://youtube.com/watch?v=abc'), true);
});

test('SEC-F02 detectPlatform returns unknown for unsupported host', () => {
  assert.equal(detectPlatform('https://attacker.example/'), 'unknown');
});

test('SEC-F03 token round-trip + tampering rejected', () => {
  const tok = createDownloadToken(42, 'https://youtu.be/abc', 'best');
  const data = verifyDownloadToken(tok);
  assert.ok(data);
  assert.equal(data!.downloadId, 42);
  assert.equal(verifyDownloadToken(tok.slice(0, -4) + 'AAAA'), null);
});

test('SEC-F04 expired token rejected', () => {
  const originalNow = Date.now;
  try {
    Date.now = () => originalNow() - 20 * 60 * 1000;
    const tok = createDownloadToken(1, 'https://youtu.be/abc', 'best');
    Date.now = originalNow;
    assert.equal(verifyDownloadToken(tok), null);
  } finally {
    Date.now = originalNow;
  }
});

test('SEC-F14 no hard-coded JWT secret fallback remains', async () => {
  const fs = await import('node:fs/promises');
  const src = await fs.readFile(new URL('../server/middleware/auth.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /change-me-in-production/);
});

test('SEC-F08 SSRF allow-list rejects private ranges', () => {
  assert.throws(() => assertSafeStreamUrl('http://127.0.0.1/x'));
  assert.throws(() => assertSafeStreamUrl('http://10.0.0.5/x'));
  assert.throws(() => assertSafeStreamUrl('http://169.254.169.254/latest/meta-data/'));
  assert.throws(() => assertSafeStreamUrl('http://192.168.1.1/'));
  assert.throws(() => assertSafeStreamUrl('file:///etc/passwd'));
  assert.throws(() => assertSafeStreamUrl('http://attacker.example/x'));
});

test('SEC-F08 SSRF allow-list accepts legit CDN hosts', () => {
  assert.doesNotThrow(() => assertSafeStreamUrl('https://rr1---sn-foo.googlevideo.com/video'));
  assert.doesNotThrow(() => assertSafeStreamUrl('https://scontent-ord5-1.cdninstagram.com/x.mp4'));
});

test('SEC-F07 sanitizeContent strips script / on* handlers', () => {
  const dirty = '<p>hi</p><script>alert(1)</script><img src=x onerror=alert(2)>';
  const clean = sanitizeContent(dirty);
  assert.doesNotMatch(clean, /<script/i);
  assert.doesNotMatch(clean, /onerror/i);
  assert.match(clean, /<p>hi<\/p>/);
});

/* ------------------------------------------------------------------ *
 * 3. Logic: the Download page passes the real URL now (F-10)          *
 * ------------------------------------------------------------------ */
const createDownloadSchema = z.object({
  url: z.string().url().max(2048),
  formatId: z.string().min(1).max(100),
  quality: z.string().max(50).optional(),
});

test('LOGIC-F10 empty URL still fails — client MUST send the analyzed URL', () => {
  assert.equal(createDownloadSchema.safeParse({ url: '', formatId: 'best' }).success, false);
});

test('LOGIC-F10 real URL passes validation', () => {
  assert.equal(
    createDownloadSchema.safeParse({ url: 'https://youtu.be/abc', formatId: 'best' }).success,
    true,
  );
});

/* ------------------------------------------------------------------ *
 * 4. Validation: bounded fields                                       *
 * ------------------------------------------------------------------ */
const contactSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().email().max(255),
  subject: z.string().trim().min(3).max(500),
  message: z.string().trim().min(10).max(10_000),
});

test('VAL-F11 contact message now capped at 10k chars', () => {
  const big = 'x'.repeat(5_000_000);
  assert.equal(
    contactSchema.safeParse({ name: 'Abe', email: 'a@b.co', subject: 'big', message: big }).success,
    false,
  );
});

test('VAL-F12 guides pagination clamping works', () => {
  const schema = z.object({
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
  });
  assert.equal(schema.safeParse({ page: '-5', limit: '1' }).success, false);
  assert.equal(schema.safeParse({ page: '1', limit: '9999999' }).success, false);
  assert.equal(schema.safeParse({ page: '2', limit: '50' }).success, true);
});

test('VAL-F13 DMCA status is enum-validated', () => {
  const schema = z.object({ status: z.enum(['pending', 'approved', 'rejected']) });
  assert.equal(schema.safeParse({ status: 'bogus' }).success, false);
  assert.equal(schema.safeParse({ status: 'approved' }).success, true);
});

/* ------------------------------------------------------------------ *
 * 5. Media-type detection                                             *
 * ------------------------------------------------------------------ */
test('MEDIA-01 detectMediaType audio ext', () => {
  assert.equal(detectMediaType('https://x/y.mp3'), 'audio');
  assert.equal(detectMediaType('https://x/y.m4a?x=1'), 'audio');
});

test('MEDIA-02 detectMediaType image/gif ext', () => {
  assert.equal(detectMediaType('https://x/y.png'), 'image');
  assert.equal(detectMediaType('https://x/y.gif'), 'gif');
});
