# Expense Tracker

[![CI](https://github.com/ahmad-zaman123/Expense-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/ahmad-zaman123/Expense-Tracker/actions/workflows/ci.yml)

**🔗 Live demo: [expense-tracker-three-vert-61.vercel.app](https://expense-tracker-three-vert-61.vercel.app)**

A full-stack personal finance app: track income and expenses across accounts,
move money between them, set per-category budgets, view monthly reports and
cashflow charts, import bank statements, and auto-detect recurring subscriptions.

A **Django REST** backend (`Backend/`) and a **React + Tailwind** dashboard
(`Frontend/`) in one repo. Single currency (PKR). JWT authentication. Both halves
deploy to Vercel; the backend uses a Neon Postgres database and runs recurring
detection as a nightly Vercel Cron job — no always-on worker required.

## Screenshots

<!-- Add screenshots of the dashboard, transactions, and budgets pages here. -->
_Dashboard, transactions, budgets, and recurring screenshots go here._

## Features

- **Accounts** with live balances computed from transactions
- **Transactions** — income/expense with categories and payees; filter by month and
  category; bulk **CSV statement import**
- **Transfers** between accounts that update balances without polluting reports
- **Budgets** — monthly per-category limits with spent/remaining progress bars
- **Reports** — monthly income/expense/net and a 6-month cashflow chart
- **Recurring detection** — surfaces subscriptions (payee, cadence, next-due,
  confidence) from your transaction history

## Why this project

Most CRUD demos are forgettable. The backend is built around four problems that are
genuinely easy to get wrong — each is implemented deliberately and covered by tests.
(Paths below are under `Backend/`.)

### 1. Account balances via a single annotated query

`current_balance = opening_balance + Σ(income) − Σ(expense)` is computed with one
`annotate()` using filtered `Sum` aggregates — no per-account queries, no Python
loops. Transfer legs are **included**, so moving money between accounts is reflected
in balances. See `apps/finance/services/balances.py`.

### 2. Timezone-correct month buckets

"July spending" depends on the user's timezone, not the server's. Reports compute each
month's `[start, end)` boundaries at **Asia/Karachi** midnight and query in UTC, so a
transaction at `2026-08-01 00:30 PKT` (which is `2026-07-31 19:30 UTC`) correctly counts
in August. Proven by an explicit boundary test.
See `apps/reports/services.py` (`_month_bounds`, `REPORT_TZ`).

### 3. Idempotent CSV statement import

Bank statements are imported in bulk. Each row is hashed
(`sha256(account | date | amount | description)`) and written with
`bulk_create(ignore_conflicts=True)` against a partial unique constraint on
`(user, import_hash)`. **Re-uploading the same file creates zero duplicates.**
Malformed rows are reported, not fatal. See `apps/finance/services/imports.py`.

### 4. Recurring / subscription detection

A heuristic groups non-transfer transactions by `(payee, account, kind)` and, where at
least three occurrences fall 25–35 days apart, records a `RecurringRule` with the average
amount, cadence, next-expected date, and a confidence score derived from gap regularity.
Idempotent via `update_or_create`. Runs as a management command and a secret-gated cron
endpoint. See `apps/finance/services/recurring.py`.

## Tech stack

**Backend:** Python 3.11 · Django 4.2 · Django REST Framework · PostgreSQL · JWT
(`simplejwt`) · OpenAPI/Swagger (`drf-spectacular`) · pytest · black/isort/flake8

**Frontend:** React 19 · Vite · React Router · Tailwind CSS v4 · Recharts

**Deploy:** Vercel (serverless Python + static React) · Neon Postgres · Vercel Cron

## API

Interactive Swagger docs at `/api/docs/` —
[live](https://expense-tracker-beta-lake.vercel.app/api/docs/). JSON schema at `/api/schema/`.

## Local setup

Requires local PostgreSQL and Node 18+. Run the two halves in separate terminals.

### Backend

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate
pip install pip-tools && make install

cp .env.example .env          # set SECRET_KEY, DATABASE_URL, CRON_SECRET
createdb expense_tracker
make migrate
make superuser
make run                      # http://127.0.0.1:8000  (Swagger at /api/docs/)
```

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env          # set VITE_API_URL (e.g. http://127.0.0.1:8000/api)
npm run dev                   # http://localhost:5173
```
