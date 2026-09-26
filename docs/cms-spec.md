# Suburban Integrated Services — Custom CMS Specification

**Status:** Phases 1–5 implemented (branch `feat/cms`); Phase 6 (VPS deploy) pending §14 answers · **Last updated:** 2026-09-26
**Decisions locked:** Custom CMS on the existing NestJS API (`apps/api`) · Admin UI inside the Next.js app (`apps/web`) · VPS deployment · NestJS kept as the single backend.

---

## 1. Goal & scope

Enable the client's staff to manage **all site content themselves** — copy, photos, video, projects, team, clients, and contact details — through a browser dashboard, with no developer involvement and no redeploys for content changes.

**In scope**

- Admin dashboard at `/admin` (login-protected) for all content types listed in §4.
- NestJS REST API: auth, content CRUD, media uploads with automatic optimization, contact/newsletter intake.
- Public site switched from hard-coded `company.ts` to API-driven content with near-instant publish.
- Seed migration of all current content so the site is pixel-identical on day one.
- VPS deployment (nginx, Postgres, node services), backups, and an editor cheat sheet.

**Out of scope (this phase)**

- Design/layout editing by staff (design stays in code — deliberately).
- E-commerce / smart-lock product catalog (schema leaves room; see §4.9).
- Multi-language, comments, search, analytics dashboards.

---

## 2. Architecture

```
                    VPS (Ubuntu LTS)
┌─────────────────────────────────────────────────────┐
│  nginx (TLS via certbot)                            │
│   ├── example.com          → Next.js  (port 3000)   │
│   ├── example.com/api/*    → NestJS   (port 4000)   │
│   └── example.com/uploads/* → static from disk      │
│                                                     │
│  Next.js (apps/web)      NestJS (apps/api)          │
│   ├── public site  ────►  REST API                  │
│   └── /admin UI    ────►  auth + CRUD + uploads     │
│                              │                      │
│                          Postgres 16 (local)        │
│                          /var/www/suburban/uploads  │
└─────────────────────────────────────────────────────┘
```

- **One backend.** NestJS owns auth, content, uploads, and form intake. No other server-side services.
- **Admin UI** is a route group `apps/web/src/app/(admin)/admin/…` — client components calling the API with credentialed fetches. Reuses the site's Tailwind theme.
- **Publish flow:** editor hits *Publish* → API writes → API calls Next's on-demand revalidation webhook (`/api/revalidate?secret=…&tag=<entity>`) → public pages re-render within seconds. Fallback: time-based revalidation every 5 minutes.
- Process management: PM2 or Coolify (final choice at deploy time; spec is agnostic — both run the same two node services).

---

## 3. Data model (Prisma / Postgres)

Conventions: all tables have `id` (cuid), `createdAt`, `updatedAt`. Content tables have `status` (`DRAFT | PUBLISHED`) and `sortOrder` (int) unless noted. Public API returns only `PUBLISHED` rows, ordered by `sortOrder`.

### 3.1 `User`
| Field | Type | Notes |
|---|---|---|
| email | unique | login identifier |
| passwordHash | string | argon2id |
| name | string | shown in admin |
| role | enum `ADMIN`/`EDITOR` | see §6 role matrix |
| isActive | boolean | soft-disable accounts |
| lastLoginAt | datetime? | audit |

### 3.2 `Media`
| Field | Type | Notes |
|---|---|---|
| filename | string | slugified, unique on disk |
| mimeType | string | whitelist, see §7 |
| kind | enum `IMAGE`/`VIDEO`/`DOCUMENT` | |
| alt | string | required for images (a11y) |
| width/height | int? | original dimensions |
| sizeBytes | int | original |
| variants | JSON | generated renditions, e.g. `{thumb: {path,w,h}, md: …, lg: …, webp: …}` |
| uploadedById | FK User | audit |

### 3.3 Collections
- **`Service`** — slug (unique), title, summary, `items: string[]` (Postgres text[]), imageId (FK Media), status, sortOrder.
- **`Project`** — title, client, year (string, allows "2023/24"), description?, status, sortOrder.
- **`GalleryPhoto`** — imageId (FK Media), caption, status, sortOrder.
- **`Client`** — name, logoId (FK Media)?, websiteUrl?, status, sortOrder.
- **`TeamMember`** — name, role, `bio: string[]`, photoId (FK Media)?, status, sortOrder.
- **`CoreValue`** — title, description, sortOrder, status.
- **`WhyPoint`** — title, description, sortOrder, status.

### 3.4 `SiteSetting` (singletons)
One row per key; `value` is a JSON column validated per-key by a Zod/class-validator schema in the API:

| key | payload (validated shape) |
|---|---|
| `company` | name, shortName, tagline, emails[], phones[], address, mapUrl? |
| `hero` | badge, headline, highlight, subtext, stats[{value,label}] (max 4), videoId?, posterId?, fallbackImageId? |
| `about` | paragraphs[], consultancy{title,body}, expertise{title,body} |
| `missionVision` | mission, vision |
| `ceo` | name, title, thankYou, statement[] |
| `seo` | defaultTitle, defaultDescription, ogImageId? |

### 3.5 Intake
- **`ContactSubmission`** — name, email, phone?, subject?, message, readAt?, ip, userAgent. No status/sortOrder.
- **`NewsletterSubscriber`** — email (unique), unsubscribedAt?.

### 3.6 `AuditLog`
actorId, action (`CREATE|UPDATE|DELETE|PUBLISH|LOGIN|…`), entity, entityId, diff (JSON). Append-only; visible to ADMIN.

---

## 4. Content types → site mapping

| # | Admin section | Powers | Editable by staff |
|---|---|---|---|
| 4.1 | Site settings → Company | Footer, contact page, structured data | phones, emails, address, tagline |
| 4.2 | Site settings → Hero | Homepage hero | headline, badge, stats, **background video + poster** |
| 4.3 | Services | Homepage cards + /services blocks | title, summary, bullets, photo |
| 4.4 | Projects | /projects list | title, client, year |
| 4.5 | Gallery | /projects "Our work in pictures" + homepage team image | photo, caption, order |
| 4.6 | Clients | Logo strips | name, logo |
| 4.7 | Team | /about management section | name, role, bio, photo |
| 4.8 | Core values / Why-us | Homepage + /about | title, description |
| 4.9 | *(reserved)* Products | future smart-lock catalog | schema stub only — not built |
| 4.10 | Inbox | Contact + newsletter | read/mark-read/export CSV |

---

## 5. API surface (REST, `/api/v1`)

### Auth (`/auth`)
- `POST /auth/login` — email+password → sets httpOnly cookies (access 15 min, refresh 7 days, rotated). Rate-limited 5/min/IP.
- `POST /auth/refresh`, `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/change-password`
- Admin-only user management: `GET/POST/PATCH /users`, deactivate (no hard delete).

### Content (pattern repeated per collection)
- Public: `GET /services` (published only, cacheable), `GET /projects`, `GET /gallery`, `GET /clients`, `GET /team`, `GET /values`, `GET /why-us`, `GET /settings/:key`
- Authed: `POST /admin/services`, `PATCH /admin/services/:id`, `DELETE …`, `POST /admin/services/reorder` (array of ids), `POST /admin/services/:id/publish|unpublish`
- Singletons: `PUT /admin/settings/:key` (validated per-key).

### Media (`/admin/media`)
- `POST` multipart upload → validation → processing (§7) → returns Media with variants.
- `GET` paginated library with kind/search filters; `PATCH /:id` (alt, rename); `DELETE /:id` — **blocked with 409 if referenced** by any content row.

### Intake (public, rate-limited + honeypot)
- `POST /contact`, `POST /newsletter`
- Authed: `GET /admin/contact-submissions`, `PATCH …/:id/read`, `GET /admin/newsletter/export.csv`

### Revalidation
- API → `POST {WEB_URL}/api/revalidate` with shared secret and entity tag after any publish/update. Next tags fetches per entity (`services`, `projects`, `gallery`, `clients`, `team`, `values`, `settings`).

---

## 6. Roles & permissions

| Capability | EDITOR | ADMIN |
|---|---|---|
| Edit/publish all content & settings | ✅ | ✅ |
| Upload media | ✅ | ✅ |
| Read inbox / export | ✅ | ✅ |
| Delete media in use | ❌ (blocked for all) | ❌ |
| Manage users | ❌ | ✅ |
| View audit log | ❌ | ✅ |
| Change SEO settings | ❌ | ✅ |

Guards: Nest `RolesGuard` + `JwtAuthGuard` on every `/admin/*` route; public routes are read-only GET + intake POSTs.

---

## 7. Media pipeline

**Images** (`jpg|png|webp`, ≤ 15 MB):
1. Validate magic bytes (not just extension/mime header).
2. Strip EXIF. Re-encode via sharp: original capped at 2560px → `lg` 1920px, `md` 1280px, `thumb` 480px, plus WebP for lg/md. Quality 82.
3. Store under `/uploads/YYYY/MM/<slug>-<size>.<ext>`; DB `variants` JSON records paths.
4. `alt` text required before an image can be attached to content.

**Video** (`mp4|webm`, ≤ 200 MB): stored as uploaded (admin uploads a pre-compressed file; the cheat sheet documents the ffmpeg recipe we used: 1080p H.264 CRF 30, faststart, audio stripped). If `ffmpeg` exists on the VPS, generate a poster frame automatically; otherwise poster is a separate image upload. *No server-side transcoding in v1* — keeps the VPS small.

**Serving:** nginx serves `/uploads` directly with long-cache headers (filenames are content-unique). Next `<Image>` uses a custom loader pointing at the pre-generated variants (no on-the-fly optimizer needed for CMS images).

---

## 8. Admin UI (`/admin`)

- **Login** page; everything else behind auth middleware (Next middleware checks cookie, API is the source of truth).
- **Layout:** sidebar — Dashboard · Services · Projects · Gallery · Clients · Team · Values · Why Us · Media · Site Settings · Inbox · Users (admin) · Audit (admin).
- **Dashboard:** content counts, unread submissions, last 5 audit entries, "site preview" link.
- **List views:** table with drag-to-reorder (persists via `/reorder`), status pill, publish/unpublish inline, delete with confirm.
- **Edit forms:** field-level validation mirrored from API schemas; image fields open a **media picker modal** (library grid + upload tab). Array fields (service bullets, bio paragraphs, hero stats) are add/remove/reorder row widgets — no rich text editor in v1; plain text + paragraphs only (protects the design).
- **Site settings:** one page per singleton key with the same form widgets; hero page includes video upload + poster + live preview thumbnail.
- **Inbox:** submissions table, unread badge, detail drawer, CSV export.
- **UX guardrails:** char limits mirrored from schema (e.g. headline ≤ 90), image aspect hints per slot, "unsaved changes" warning.

---

## 9. Public site changes

- Replace `@/data/company` imports with typed fetchers in `apps/web/src/lib/api.ts` (`getServices()`, `getSetting('hero')`, …) using `fetch` with `next: { tags: [...] }`.
- `company.ts` is **kept** as the seed source and TypeScript type reference, but pages stop importing it.
- Rendering: static generation + tag-based on-demand revalidation (publish → live in seconds). `revalidate = 300` as a safety net.
- Graceful degradation: if the API is down at request time, serve last cached render (default Next behavior); build does not fail on empty collections (empty-state sections are hidden).
- Contact + newsletter forms post to the API instead of the current handler.

---

## 10. Security requirements

- Argon2id password hashing; login rate-limit (5/min/IP) + lockout after 10 failures/hour; generic error messages.
- JWT in httpOnly, `Secure`, `SameSite=Lax` cookies; refresh rotation with reuse detection.
- CORS locked to the site origin; Helmet on both apps; global validation pipes (`whitelist: true`) so unknown fields are stripped.
- Upload hardening per §7 (magic bytes, size caps, EXIF strip, no SVG in v1).
- Intake endpoints: rate limit + honeypot field + max lengths (spam control).
- Admin routes excluded from robots; no admin JS shipped on public pages (separate route group bundle).
- Secrets via env only; `.env.example` updated; no secrets in repo.

---

## 11. Deployment & operations (VPS)

- **Provisioning:** Ubuntu LTS, node 20 LTS, Postgres 16, nginx, certbot, ffmpeg (optional), ufw (22/80/443 only), fail2ban.
- **Processes:** `suburban-api` (port 4000) and `suburban-web` (port 3000) under PM2 or Coolify, auto-restart + boot persistence.
- **nginx:** TLS, HTTP→HTTPS, `/api` → 4000, `/uploads` → disk (long cache), everything else → 3000. `client_max_body_size 210m` on `/api` for video uploads.
- **Backups (cron):** nightly `pg_dump` (14-day rotation) + rsync of `/uploads` to off-server storage. Restore procedure documented and **tested once** before handover.
- **Migrations:** `prisma migrate deploy` on release; seed script idempotent (`upsert` by slug/key) so re-runs are safe.
- **Monitoring v1:** PM2/Coolify health + a free uptime pinger on `/` and `/api/v1/health`.

---

## 12. Seed & migration plan

1. Seed script (`apps/api/prisma/seed.ts`) reads the current `company.ts` content and creates: 4 services, 16 projects, 11 gallery photos, clients, 2 team members + CEO, 6 core values, 5 why-points, all `SiteSetting` keys — all `PUBLISHED`, sorted to match today's order.
2. Media importer walks `apps/web/public/images/**` + `public/video/*`, registers each file as `Media` with variants generated, and links them to the seeded rows (mapping table maintained in the script).
3. Acceptance: fresh DB + seed + both apps running ⇒ public site is visually identical to the current static build.

---

## 13. Build phases & acceptance criteria

| Phase | Deliverable | Accepted when |
|---|---|---|
| 1 | Prisma schema, auth module, user management | Login/refresh/logout works; roles enforced; rate limits verified |
| 2 | Content CRUD + media pipeline + intake | All endpoints pass e2e tests; upload generates variants; delete-in-use blocked |
| 3 | Seed & media import | §12 acceptance — site identical from DB |
| 4 | Admin UI | Staff can perform every §4 operation without touching code; reorder + publish flows work |
| 5 | Public site on API + revalidation | Publish in admin → visible on site ≤ 10 s; build passes; Lighthouse ≥ current scores |
| 6 | VPS deploy + backups + docs | Restore drill passed; editor cheat sheet delivered; 1-hr staff training done |

Each phase leaves `main` deployable. Estimated effort: phases 1–2 ≈ 2 days, 3 ≈ ½ day, 4 ≈ 2 days, 5 ≈ 1 day, 6 ≈ 1 day.

---

## 14. Implementation notes (deviations from this spec)

- **API prefix** stays `/api` (not `/api/v1`) to avoid breaking the existing contact/newsletter routes.
- **Extra settings keys** so staff can edit *all* copy, not only the §3.4 list: `home`, `servicesPage`, `projectsPage`, `contactPage`, `cta` (page banners, section headings, CTA banner, header/section images, per-page meta descriptions).
- **Hero** stores `videoId` (MP4) and an optional `videoWebmId`; the poster falls back to an ffmpeg-extracted frame.
- **Contact submissions** reuse the existing `ContactMessage` model (status `NEW/READ/ARCHIVED` instead of `readAt`); IP and user agent are now recorded.
- **Client logos** are seeded as "Client 01…11" because the brochure logos are not labelled — staff should rename them.
- **Revalidation**: measured at ~0.1 s from publish to live on `next start`. Builds succeed without the API (sections render empty until the first revalidation), so the API should be up before `next build` on the server.
- **Login limiting** is per (IP address + email) — 10 failures/hour — instead of locking the account, so nobody can lock a real user out, and the reply is identical for unknown emails.
- **Refresh tokens** have a 30-second reuse grace period so parallel tabs don't trigger theft detection; a replay after that still ends the session.
- **Uploads** reject HEIC/AVIF photos and QuickTime .mov files with advice to convert them, and failed uploads leave no files behind.
- **Tests**: verified with scripted API smoke tests and a Playwright run of the admin flows; an automated e2e suite in the repo is still to do.

## 15. Open questions (answer before Phase 6)

1. **Domain + VPS provider/specs** — need final domain for CORS/TLS and a box (2 vCPU / 4 GB RAM / 40 GB disk is comfortable).
2. **Email delivery** — should contact submissions also notify by email? If yes: SMTP provider/credentials (v1 can be inbox-only).
3. **Client-name policy** — captions currently anonymize NAOC/ministry names; once staff can edit captions, do they have clearance to name clients?
4. **Who are the first accounts?** Names/emails for 1 ADMIN (owner) + up to 3 EDITORs.
5. **PM2 vs Coolify** on the VPS — either works; pick at deploy.
