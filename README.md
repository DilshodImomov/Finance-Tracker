# DIB Personal Finance Tracker

Production-ready personal finance tracker for Dubai Islamic Bank (DIB) purchase notifications.

## Structure

- `apps/web`: Next.js web app (API + dashboard)
- `apps/script/Code.gs`: Google Apps Script hourly ingestor
- `apps/remotion`: optional promo / video app
- `apps/web/migrations`: SQL migrations
- `deploy/nginx.conf.snippet`: reverse proxy sample
- `docker-compose.yml`: VPS deployment

## Features

- Secure ingest webhook: `POST /api/ingest/dib`
  - Requires `X-INGEST-SECRET`
  - Optional allowlist by IP and user-agent regex
  - In-memory rate limiting
- Data safety
  - No raw email body storage
  - Unique `gmail_message_id` dedupe in DB
  - OTP emails are excluded by sender + Gmail label filter
- Authenticated dashboard
  - Supabase Auth email/password login
  - App-owned `app_users` table controls who is allowed in
  - Password reset flow via Supabase Auth
- Analytics and management
  - Overview totals (this month, last month, YTD, all-time)
  - Shared dashboard timeframe: `This Month`, `3M`, `6M`, `12M`, `YTD`
  - Daily chart buckets for `This Month`, monthly buckets for longer ranges
  - Category breakdown that follows the selected chart timeframe
  - Transaction table with filters + sorting + pagination
  - Inline editing for merchant, amount, category, exclude flag
  - Manual transaction creation from the UI
  - Category + rule CRUD and re-categorize all action

## 1) Create Gmail label + filter

1. In Gmail create label: `bank/transactions/Purchase`
2. Create filter targeting purchase notifications from `DIB.notification@dib.ae` and apply label `bank/transactions/Purchase`
3. Keep OTP sender rules separate (not this sender) so OTP emails are never labeled for ingest

## 2) Configure Apps Script

1. Go to https://script.google.com and create a project
2. Paste `apps/script/Code.gs`
3. In **Project Settings -> Script properties**, set:
   - `INGEST_URL`: `https://finance.example.com/api/ingest/dib`
   - `INGEST_SECRET`: same value as backend `INGEST_SECRET`
4. Add hourly trigger for `runDibIngest`

Search query used by the script:

- `label:"bank/transactions/Purchase" from:DIB.notification@dib.ae newer_than:120d`

State handling:

- Script property `LAST_RUN_AT` is updated after successful runs
- Backend dedupe by `gmail_message_id` ensures idempotency

## 3) Backend environment

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required env vars:

- `DATABASE_URL`
- `INGEST_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional hardening:

- `INGEST_ALLOWED_IPS` (comma-separated)
- `INGEST_ALLOWED_UA_REGEX` (regex, e.g. `Google-Apps-Script`)

## 4) Run migrations

```bash
cd apps/web
npm install
DATABASE_URL='postgresql://...' npm run migrate
```

This applies SQL from `apps/web/migrations` and seeds `Uncategorized`.

Manual access provisioning:

1. Create the auth user in the Supabase Auth dashboard
2. Insert the same email into `app_users` with an active role (for now, `admin`)

Security notes:

- `DATABASE_URL`, `INGEST_SECRET`, SMTP credentials, and any Supabase management tokens must stay private and must not be committed.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is expected to be public; it is safe to expose in the browser.
- `POST /api/ingest/dib` is intentionally public but protected by `X-INGEST-SECRET`, plus optional IP / user-agent restrictions.
- Local files like `.env` and `.env.local` are for development only and should stay untracked.

## 5) Local run

```bash
cd apps/web
npm run dev
```

- Dashboard: `http://localhost:3000/dashboard`
- Healthcheck: `http://localhost:3000/healthz`

## 6) VPS deployment (Docker)

From repo root:

```bash
docker compose build
docker compose up -d
```

`docker-compose.yml` runs only the app container. Postgres is external (Neon/Supabase).

## 7) Nginx reverse proxy + TLS

Use `deploy/nginx.conf.snippet` as baseline. Replace:

- `finance.example.com`
- TLS certificate paths

Ensure TLS is active in production.

## API Summary

Public:

- `GET /healthz`
- `POST /api/ingest/dib` (secret header auth)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- password reset is handled by the app pages `/forgot-password` and `/reset-password`

Session-protected:

- `GET /api/me`
- `GET/POST /api/categories`
- `PATCH/DELETE /api/categories/:id`
- `GET/POST /api/rules`
- `PATCH/DELETE /api/rules/:id`
- `GET /api/transactions` with filters
- `POST /api/transactions` for manual transaction creation
- `PATCH/DELETE /api/transactions/:id`
- `GET /api/stats/monthly`
- `GET /api/stats/by-category`
- `GET /api/stats/top-merchants`
- `POST /api/admin/recategorize`

## Tests

Parser tests mirror ingest regex logic:

```bash
cd apps/web
npm test
```
