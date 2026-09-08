# Fiborge's Sales & Sourcing Hub

Yarn price intelligence for worsted wool sourcing: live mill and competitor prices,
quotations, sales orders, delivery notes, invoices, purchase orders, goods receipts,
reconciliation, margin and trend analysis.

Built with Next.js (App Router), PostgreSQL + Drizzle ORM, Tailwind CSS.

---

## Deploy: Vercel + Neon + GitHub Codespaces

### 1. Neon — create the database
1. Go to [neon.tech](https://neon.tech) → **New Project** → copy the connection string
   (the **pooled** one, host ends with `-pooler`, keep `?sslmode=require`).
2. In the Neon dashboard, open **SQL Editor** and run these three files **in order**
   (open each file in this repo, copy everything, paste, Run):

| # | File                                 | What it does                                                       |
| - | ------------------------------------ | ------------------------------------------------------------------ |
| 1 | `scripts/migrations/0000_full_schema.sql` | Creates all 34 tables, indexes and relations                  |
| 2 | `scripts/seed-base.sql`              | Admin user + mills, treatments, certificates, yarn catalog, prices |
| 3 | `scripts/seed-demo.sql`              | Demo customers, orders, quotations, 26-week price history (idempotent) |

> Verify with: `SELECT count(*) FROM users;` → should be `3` after step 3.

### 2. Codespaces — edit & run locally
1. On your GitHub repo → **Code → Codespaces → Create codespace on main**.
2. In the Codespace terminal:

```bash
cp .env.example .env
# edit .env:  DATABASE_URL = your Neon pooled URL (with ?sslmode=require)
#             AUTH_SECRET  = any long random string, e.g. openssl rand -hex 32

npm install
npm run dev     # opens the app on the forwarded port
```

3. Commit & push as usual — Vercel picks it up automatically.

### 3. Vercel — deploy
1. **Add New → Project** → import this repo.
2. **Settings → Environment Variables**, add:

| Name           | Value                                       |
| -------------- | ------------------------------------------- |
| `DATABASE_URL` | Neon pooled connection string               |
| `AUTH_SECRET`  | Random 64-char hex (`openssl rand -hex 32`) |

3. **Deploy** — the default build settings (`next build`) work as-is.

### Demo logins (after running the 3 SQL files)

| Username | Password   | Role              |
| -------- | ---------- | ----------------- |
| `admin`  | `admin123` | full admin        |
| `sofia`  | `admin123` | editor            |
| `kai`    | `admin123` | viewer (read-only) |

Change these passwords (or delete the demo users) before real use.

---

## Environment variables

| Name           | Required | Purpose                                  |
| -------------- | -------- | ---------------------------------------- |
| `DATABASE_URL` | yes      | PostgreSQL connection (SSL for Neon)     |
| `AUTH_SECRET`  | yes      | HMAC key that signs session cookies      |

## Security notes

- Sessions are HMAC-SHA256 signed tokens in httpOnly cookies (7-day expiry).
- Edge middleware authenticates every `/api/*` route, enforces roles
  (`viewer`/`visitor` = read-only, user management = admin) and rejects
  cross-origin mutations.
- Passwords are hashed with bcrypt.

## Local development (non-Codespaces)

```bash
npm install
npx drizzle-kit push     # applies schema to the local DATABASE_URL
npm run dev
```
