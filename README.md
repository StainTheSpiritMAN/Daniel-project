# Suburban Integrated Services Limited — Website

[![CI](https://github.com/StainTheSpiritMAN/Daniel-project/actions/workflows/ci.yml/badge.svg)](https://github.com/StainTheSpiritMAN/Daniel-project/actions/workflows/ci.yml)

Corporate website for **Suburban Integrated Services Limited** (IT, Power & Energy Consulting).
Monorepo with a **NestJS** API and a **Next.js** front-end. All configuration is driven
by environment variables.

Repository: <https://github.com/StainTheSpiritMAN/Daniel-project>

```
suburban/
├── apps/
│   ├── api/   # NestJS + Prisma (PostgreSQL) — CMS API: auth, content, media, settings, inbox
│   └── web/   # Next.js (App Router) + Tailwind — public site + /admin dashboard
├── docs/      # CMS specification and the editor guide for staff
└── package.json   # npm workspaces + dev/build scripts
```

## Prerequisites

- Node.js ≥ 18.18 (developed on Node 25)
- PostgreSQL running locally (or a remote `DATABASE_URL`)

## Setup

```bash
# 0. Clone the repository
git clone https://github.com/StainTheSpiritMAN/Daniel-project.git
cd Daniel-project

# 1. Install all workspace dependencies
npm install

# 2. Configure environment
cp .env.example apps/api/.env          # then edit DATABASE_URL / SMTP / CORS
cp apps/web/.env.example apps/web/.env.local

# 3. Create the database and run migrations
createdb suburban                      # if it doesn't exist
npm run prisma:migrate                 # generates client + applies migrations

# 4. Load the current site content, media and the first admin account
npm run seed                           # safe to re-run; never overwrites edits
```

The seed creates the first admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
(only if there are no users yet). Sign in at http://localhost:3000/admin and change
the password under **My account**.

## Running

```bash
npm run dev        # runs API (:4000) and web (:3000) together
npm run dev:api    # API only
npm run dev:web    # web only
```

- Web: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin
- API: http://localhost:4000/api  (health check: `/api/health`)

## Build & production

```bash
npm run build              # builds both apps
npm run start:api          # node dist/main.js  (apps/api)
npm run start:web          # next start         (apps/web)
```

## Configuration (environment variables)

### API (`apps/api/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `NODE_ENV` | Environment name | `development` |
| `API_PORT` | Port the API listens on | `4000` |
| `API_GLOBAL_PREFIX` | URL prefix for all routes | `api` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Session signing secrets (`openssl rand -base64 48`) | — (required) |
| `COOKIE_SECURE` / `COOKIE_DOMAIN` | Session cookie flags | `true` in production / _empty_ |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | First admin, created by `npm run seed` | — |
| `UPLOAD_DIR` | Where uploaded media is stored (served at `/uploads`) | `./uploads` |
| `WEB_URL` / `REVALIDATE_SECRET` | Site to notify after content changes, and the shared secret | `http://localhost:3000` / — |
| `DATABASE_URL` | PostgreSQL connection string (Prisma) | — (required) |
| `SMTP_HOST` | SMTP host. **Empty → emails are logged to console** | _empty_ |
| `SMTP_PORT` / `SMTP_SECURE` | SMTP port / TLS flag | `587` / `false` |
| `SMTP_USER` / `SMTP_PASSWORD` | SMTP credentials | _empty_ |
| `MAIL_FROM` / `MAIL_TO` | Sender / company inbox for enquiries | see `.env.example` |

### Web (`apps/web/.env.local`)

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API incl. prefix (e.g. `http://localhost:4000/api`) |
| `NEXT_PUBLIC_SITE_NAME` | Site name used in metadata |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `API_INTERNAL_URL` | Optional server-side API address (e.g. `http://127.0.0.1:4000/api`) |
| `REVALIDATE_SECRET` | Must equal the API's `REVALIDATE_SECRET` |

## API endpoints

Public (read-only, published content only): `GET /api/services`, `/projects`, `/gallery`,
`/clients`, `/team`, `/values`, `/why-us`, `/settings`, `/settings/:key`; intake
`POST /api/contact` and `POST /api/newsletter/subscribe` (rate-limited, honeypot).

Staff (session cookie from `POST /api/auth/login`):

| Path | Purpose |
| --- | --- |
| `/api/auth/*` | `login`, `refresh`, `logout`, `me`, `change-password` |
| `/api/admin/{collection}` | CRUD, `POST /reorder`, `POST /:id/publish` · `/unpublish` for each collection above |
| `/api/admin/settings/:key` | `GET` / `PUT` one settings block (validated per key) |
| `/api/admin/media` | Upload (multipart `file`), list, edit alt text, delete (blocked while in use) |
| `/api/admin/contact-messages`, `/api/admin/newsletter` | Inbox, subscriber list, `export.csv` |
| `/api/admin/users`, `/api/admin/audit` | User management and activity log — **admins only** |

## Content (CMS)

All site content — copy, photos, hero video, services, projects, gallery, clients, team,
contact details and SEO — is stored in PostgreSQL and edited at **`/admin`**. Publishing
refreshes the affected pages within seconds (on-demand revalidation, with a 5-minute
fallback). Page layout and design stay in code on purpose.

- Staff guide: [`docs/editor-guide.md`](docs/editor-guide.md)
- Design & decisions: [`docs/cms-spec.md`](docs/cms-spec.md)
- [`apps/web/src/data/company.ts`](apps/web/src/data/company.ts) is now only the seed
  source for a fresh database; editing it does not change the live site.

## Continuous Integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull
request to `main`. It installs dependencies with `npm ci`, generates the Prisma client,
and builds both the API and the web app. No database or running API is required for the
build (pages fill in from the API on their first revalidation).

## License

Proprietary — © Suburban Integrated Services Limited. All rights reserved.
See [LICENSE](LICENSE).
