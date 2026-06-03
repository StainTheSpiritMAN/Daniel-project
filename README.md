# Suburban Integrated Services Limited — Website

[![CI](https://github.com/StainTheSpiritMAN/Daniel-project/actions/workflows/ci.yml/badge.svg)](https://github.com/StainTheSpiritMAN/Daniel-project/actions/workflows/ci.yml)

Corporate website for **Suburban Integrated Services Limited** (IT, Power & Energy Consulting).
Monorepo with a **NestJS** API and a **Next.js** front-end. All configuration is driven
by environment variables.

Repository: <https://github.com/StainTheSpiritMAN/Daniel-project>

```
suburban/
├── apps/
│   ├── api/   # NestJS + Prisma (PostgreSQL) — contact form, newsletter, health
│   └── web/   # Next.js (App Router) + Tailwind — public marketing site
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
```

## Running

```bash
npm run dev        # runs API (:4000) and web (:3000) together
npm run dev:api    # API only
npm run dev:web    # web only
```

- Web: http://localhost:3000
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
| `ADMIN_API_KEY` | Secret for admin routes (`x-admin-key` header) | — |
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

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/contact` | Submit a contact-form enquiry (stored + emailed) |
| `POST` | `/api/newsletter/subscribe` | Subscribe an email to updates |
| `GET` | `/api/admin/contact-messages` | List submissions (filter `?status=NEW\|READ\|ARCHIVED`, paginate `?skip=&take=`) — **admin** |
| `GET` | `/api/admin/contact-messages/:id` | Fetch a single submission — **admin** |
| `PATCH` | `/api/admin/contact-messages/:id/status` | Update status `{ "status": "READ" }` — **admin** |

**Admin auth:** admin routes require the `ADMIN_API_KEY` value sent as an
`x-admin-key` header (or `Authorization: Bearer <key>`). Example:

```bash
curl -H "x-admin-key: $ADMIN_API_KEY" http://localhost:4000/api/admin/contact-messages
```

## Content

All marketing copy (about, services, projects, management, etc.) is transcribed from the
corporate profile and lives in [`apps/web/src/data/company.ts`](apps/web/src/data/company.ts).
Edit that single file to update content across the whole site.

Imagery extracted from the profile lives in `apps/web/public/`:

- `public/images/` — hero/section photos (`hero-team`, `energy-platform`, `refinery`, `tools-blueprint`)
- `public/clients/` — client logo tiles (`client-01.jpg` … `client-11.jpg`), rendered as a logo wall on the home and projects pages

## Continuous Integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull
request to `main`. It installs dependencies with `npm ci`, generates the Prisma client,
and builds both the API and the web app. No database is required for the build.

## License

Proprietary — © Suburban Integrated Services Limited. All rights reserved.
See [LICENSE](LICENSE).
