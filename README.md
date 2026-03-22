# Finance Tracker

A personal finance dashboard built around real DIB purchase notifications.

This project turns bank purchase emails into a clean spending system: transactions are ingested automatically, categorized with rules, reviewed in a fast dashboard, and corrected manually when reality is messier than the bank feed.

## What The App Does

- Pulls DIB purchase notifications from Gmail through Google Apps Script
- Sends normalized transaction batches into a secure ingest API
- Stores transactions in Postgres with dedupe protection
- Auto-categorizes merchants using rule matching
- Shows spending trends, category breakdowns, and transaction history
- Lets you edit merchant, amount, category, and exclusion status from the UI
- Lets you add manual transactions directly from the dashboard
- Protects dashboard access with Supabase Auth plus app-level authorization

## Product Highlights

### Automated ingest

The intended workflow is hands-off. Once the Gmail label and Apps Script trigger are configured, new purchase emails are picked up automatically and posted to the app in batches.

### A dashboard built for correction, not just viewing

Most finance tools are good at showing data and bad at fixing it. This one is built for cleanup:

- edit merchant names
- correct wrong amounts
- move transactions between categories
- exclude noise from KPIs and charts
- add manual rows when a transaction did not come through the bank flow

### Timeframes that actually help

The main dashboard uses a shared timeframe across chart and category breakdown:

- `This Month`
- `3M`
- `6M`
- `12M`
- `YTD`

`This Month` uses daily buckets, while longer windows use monthly buckets.

### Simple but real auth

Authentication is handled with Supabase Auth using email/password and password reset flows. Authorization is controlled in the app database through `app_users`, so only explicitly approved users can access the dashboard.

## Repo Structure

- `apps/web`: Next.js app, dashboard UI, API routes, auth flow, and database-backed business logic
- `apps/script/Code.gs`: Google Apps Script that reads Gmail and posts transactions to the ingest API
- `apps/web/migrations`: SQL schema and additive migrations
- `apps/remotion`: optional promotional / showcase video app
- `deploy/nginx.conf.snippet`: reverse proxy example
- `docker-compose.yml`: simple app-container deployment setup

## Core Flow

1. DIB purchase emails land in Gmail under a specific label.
2. Google Apps Script searches those messages, parses the purchase data, and batches transactions to `POST /api/ingest/dib`.
3. The backend validates the payload, checks the ingest secret, dedupes by `gmail_message_id`, and inserts transactions into Postgres.
4. Merchant rules attempt to assign categories automatically.
5. The dashboard surfaces trends, categories, and transaction rows for review and cleanup.

## Authentication Model

- Identity: Supabase Auth
- Authorization: `app_users` table in Postgres
- Password reset: Supabase Auth recovery flow
- Protected dashboard / APIs: app-side authorization checks on top of authenticated Supabase sessions

This split keeps password/session handling external while preserving app-level control over who can actually use the product.

## Ingest Security

`POST /api/ingest/dib` is intentionally reachable by the Apps Script, so protection is based on a shared secret header:

- required header: `X-INGEST-SECRET`
- optional IP allowlist
- optional user-agent regex check
- dedupe by `gmail_message_id`

Important: the repo can be public, but the production `INGEST_SECRET`, database credentials, SMTP credentials, and any Supabase management tokens must remain private.

## Gmail / Apps Script Setup

### 1. Create the Gmail label

Use this label:

- `bank/transactions/Purchase`

Apply it only to DIB purchase notifications from:

- `DIB.notification@dib.ae`

Keep OTP emails out of this label.

### 2. Configure Apps Script

1. Create a Google Apps Script project at https://script.google.com
2. Paste in `apps/script/Code.gs`
3. In script properties, set:
   - `INGEST_URL`: `https://your-domain.com/api/ingest/dib`
   - `INGEST_SECRET`: same value as the backend `INGEST_SECRET`
4. Add an hourly trigger for `runDibIngest`

Current Gmail search query used by the script:

- `label:"bank/transactions/Purchase" from:DIB.notification@dib.ae newer_than:120d`

## Environment

Copy `.env.example` to `.env` and fill in the real values:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`
- `INGEST_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional ingest hardening:

- `INGEST_ALLOWED_IPS`
- `INGEST_ALLOWED_UA_REGEX`

Notes:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is expected to be public
- local `.env` and `.env.local` files must stay untracked

## Migrations

```bash
cd apps/web
npm install
DATABASE_URL='postgresql://...' npm run migrate
```

This applies the SQL migrations and seeds `Uncategorized` if needed.

Access provisioning is currently manual:

1. create the user in Supabase Auth
2. insert the same email into `app_users`

## Local Development

```bash
cd apps/web
npm run dev
```

Useful routes:

- dashboard: `http://localhost:3000/dashboard`
- login: `http://localhost:3000/login`
- healthcheck: `http://localhost:3000/healthz`

## Deployment

### Vercel

The live app is designed to run well on Vercel. This repo includes `apps/web/vercel.json` to pin critical functions near the data/auth region.

### Docker / VPS

From repo root:

```bash
docker compose build
docker compose up -d
```

`docker-compose.yml` runs the app container only. Postgres is external.

### Reverse proxy

Use `deploy/nginx.conf.snippet` as a baseline and replace:

- domain name
- TLS certificate paths

## API Overview

### Public routes

- `GET /healthz`
- `POST /api/ingest/dib`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `/forgot-password`
- `/reset-password`

### Session-protected routes

- `GET /api/me`
- `GET/POST /api/categories`
- `PATCH/DELETE /api/categories/:id`
- `GET/POST /api/rules`
- `PATCH/DELETE /api/rules/:id`
- `GET /api/transactions`
- `POST /api/transactions`
- `PATCH/DELETE /api/transactions/:id`
- `GET /api/stats/monthly`
- `GET /api/stats/by-category`
- `GET /api/stats/top-merchants`
- `POST /api/admin/recategorize`

## Testing

```bash
cd apps/web
npm test
```

The parser tests mirror the ingest parsing logic used for DIB email extraction.
