# Expense Tracker

A full-stack personal finance app: track income and expenses across accounts,
move money between them, set per-category budgets, view monthly reports and
cashflow charts, import bank statements, and auto-detect recurring subscriptions.

A **Django REST** backend (`Backend/`) and a **React + Tailwind** dashboard
(`Frontend/`) in one repo. Single currency (PKR). JWT authentication. Both halves
deploy to Vercel; the backend uses a Neon Postgres database and runs recurring
detection as a nightly Vercel Cron job — no always-on worker required.

![CI](https://github.com/ahmad-zaman123/expense-tracker/actions/workflows/ci.yml/badge.svg)

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

## Repository layout

```
Backend/     Django REST API
  config/          settings split (base/dev/prod/test), urls, wsgi/asgi
  apps/core        BaseModel (UUID pk + timestamps), pagination
  apps/users       email-based custom User + JWT auth
  apps/finance     Account, Category, Transaction, Transfer, Budget, RecurringRule
                   services/ (balances, transfers, imports, recurring)
  apps/reports     aggregation services + report endpoints
  api/index.py     Vercel WSGI entrypoint

Frontend/    Vite + React dashboard
  src/api/         fetch client + endpoint wrappers
  src/auth/        JWT auth context
  src/components/  Layout, ProtectedRoute, shared UI, chart
  src/pages/       Dashboard, Accounts, Transactions, Transfers, Budgets, Recurring
```

Backend business logic lives in `services/`; views stay thin and every list/detail
endpoint is scoped to the authenticated user via `UserScopedMixin`. Transfers are two
linked transaction "legs" (out=EXPENSE, in=INCOME) that count toward balances but are
excluded from income/expense reports.

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

Register from the UI, then use the dashboard. Run recurring detection manually with
`make detect-recurring` (from `Backend/`).

## API

Interactive docs at `GET /api/docs/` (Swagger) · schema at `GET /api/schema/`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register |
| POST | `/api/auth/token/` · `/refresh/` | Obtain / refresh JWT |
| GET | `/api/auth/me/` | Current user |
| GET/POST · detail | `/api/accounts/` | Accounts (list has `current_balance`) |
| GET/POST · detail | `/api/categories/` | Categories |
| GET/POST · detail | `/api/budgets/` | Budgets |
| GET/POST · detail | `/api/transactions/` | Transactions (filter/search) |
| POST | `/api/transactions/import/` | CSV statement import (multipart) |
| GET/POST · detail | `/api/transfers/` | Transfers |
| GET | `/api/recurring/` · `POST /{id}/dismiss/` | Recurring rules |
| GET | `/api/reports/monthly/?month=YYYY-MM` | Monthly income/expense + breakdown |
| GET | `/api/reports/budget-status/` | Budget spent/remaining this month |
| GET | `/api/reports/cashflow/?from=&to=&granularity=` | Net cashflow per bucket |

### CSV import format

```csv
date,description,amount,payee,kind
2026-07-01,ATM Withdrawal,5000,,EXPENSE
2026-07-02,Netflix,1100,Netflix,EXPENSE
2026-07-05,Salary,50000,Employer,INCOME
```

`date` is `YYYY-MM-DD`; `amount` positive; `payee` optional; `kind` defaults to
`EXPENSE`. `account_id` is sent as a form field alongside the file.

## Testing

```bash
cd Backend
pytest              # full suite (PostgreSQL required)
pytest --cov=apps   # with coverage
```

CI (GitHub Actions) runs black/isort/flake8 and the test suite with coverage against a
Postgres service on every push and pull request.

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full Vercel + Neon guide (two Vercel projects — one
per folder — plus the nightly cron setup).
