# Expense Tracker API

A backend-heavy personal finance API built with Django REST Framework and
PostgreSQL. It tracks income and expenses across accounts, enforces per-category
budgets, computes account balances and time-bucketed reports, imports bank
statements idempotently, and auto-detects recurring subscriptions.

Single currency (PKR). JWT authentication. Deployable to Vercel (serverless) with
a Neon Postgres database; recurring detection runs as a nightly Vercel Cron job —
no always-on worker required.

![CI](https://github.com/ahmad-zaman123/expense-tracker-api/actions/workflows/ci.yml/badge.svg)

## Why this project

Most CRUD demos are forgettable. This one is built around four backend problems
that are genuinely easy to get wrong — each is implemented deliberately and
covered by tests.

### 1. Account balances via a single annotated query

`current_balance = opening_balance + Σ(income) − Σ(expense)` is computed with one
`annotate()` using filtered `Sum` aggregates — no per-account queries, no Python
loops. Transfer legs are **included**, so moving money between accounts is
reflected in balances.
See `apps/finance/services/balances.py`.

### 2. Timezone-correct month buckets

"July spending" depends on the user's timezone, not the server's. Reports compute
each month's `[start, end)` boundaries at **Asia/Karachi** midnight and query in
UTC, so a transaction at `2026-08-01 00:30 PKT` (which is `2026-07-31 19:30 UTC`)
correctly counts in August. Proven by an explicit boundary test.
See `apps/reports/services.py` (`_month_bounds`, `REPORT_TZ`).

### 3. Idempotent CSV statement import

Bank statements are imported in bulk. Each row is hashed
(`sha256(account | date | amount | description)`) and written with
`bulk_create(ignore_conflicts=True)` against a partial unique constraint on
`(user, import_hash)`. **Re-uploading the same file creates zero duplicates.**
Malformed rows are reported, not fatal.
See `apps/finance/services/imports.py`.

### 4. Recurring / subscription detection

A heuristic groups non-transfer transactions by `(payee, account, kind)` and, where
at least three occurrences fall 25–35 days apart, records a `RecurringRule` with the
average amount, cadence, next-expected date, and a confidence score derived from gap
regularity. Idempotent via `update_or_create`. Runs as a management command and a
secret-gated cron endpoint.
See `apps/finance/services/recurring.py`.

## Tech stack

- Python 3.11 · Django 4.2 · Django REST Framework
- PostgreSQL (local for dev, Neon serverless for production)
- JWT auth via `djangorestframework-simplejwt`
- OpenAPI schema + Swagger UI via `drf-spectacular`
- Tooling: pip-tools, black, isort, flake8, pytest (+ coverage)
- Deploy: Vercel serverless (`@vercel/python`) + Vercel Cron

## Architecture

```
config/          settings split (base/dev/prod/test), urls, wsgi/asgi
apps/core        BaseModel (UUID pk + timestamps), pagination
apps/users       email-based custom User + JWT auth
apps/finance     Account, Category, Transaction, Transfer, Budget, RecurringRule
                 services/ (balances, transfers, imports, recurring)
                 filters, signals (seed default categories), management command
apps/reports     aggregation services + report endpoints (no models of its own)
api/index.py     Vercel WSGI entrypoint
```

Business logic lives in `services/`; views stay thin. Every list/detail endpoint is
scoped to the authenticated user via `UserScopedMixin`. Transfers are modeled as two
linked transaction "legs" (out=EXPENSE, in=INCOME) that count toward balances but are
excluded from income/expense reports.

## API

Interactive docs: `GET /api/docs/` (Swagger UI) · schema: `GET /api/schema/`

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/token/` | Obtain JWT access + refresh |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user |
| GET/POST | `/api/accounts/` | List (with `current_balance`) / create accounts |
| GET/PUT/PATCH/DELETE | `/api/accounts/{id}/` | Account detail |
| GET/POST | `/api/categories/` | List / create categories |
| GET/PUT/PATCH/DELETE | `/api/categories/{id}/` | Category detail |
| GET/POST | `/api/budgets/` | List / create budgets |
| GET/PUT/PATCH/DELETE | `/api/budgets/{id}/` | Budget detail |
| GET/POST | `/api/transactions/` | List (filter/search) / create transactions |
| GET/PUT/PATCH/DELETE | `/api/transactions/{id}/` | Transaction detail |
| POST | `/api/transactions/import/` | Import a CSV statement (multipart) |
| GET/POST | `/api/transfers/` | List / create transfers |
| GET/DELETE | `/api/transfers/{id}/` | Transfer detail |
| GET | `/api/recurring/` | List detected recurring rules |
| POST | `/api/recurring/{id}/dismiss/` | Dismiss a false positive |
| GET | `/api/reports/monthly/?month=YYYY-MM` | Monthly income/expense + breakdown |
| GET | `/api/reports/budget-status/` | Budget spent/remaining this month |
| GET | `/api/reports/cashflow/?from=&to=&granularity=` | Net cashflow per bucket |

Transaction list filters: `account`, `category`, `kind`, `date_from`, `date_to`,
plus `search` (description/payee) and `ordering`.

### CSV import format

```csv
date,description,amount,payee,kind
2026-07-01,ATM Withdrawal,5000,,EXPENSE
2026-07-02,Netflix,1100,Netflix,EXPENSE
2026-07-05,Salary,50000,Employer,INCOME
```

`date` is `YYYY-MM-DD`; `amount` is positive; `payee` optional; `kind` defaults to
`EXPENSE`. `account_id` is sent as a form field alongside the file.

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install pip-tools
make install                       # pip-sync dev deps

cp .env.example .env               # set SECRET_KEY, DATABASE_URL, CRON_SECRET

createdb expense_tracker
make migrate
make superuser
make run                           # http://127.0.0.1:8000/api/docs/
```

Requires a local PostgreSQL. Run recurring detection manually with
`make detect-recurring`.

## Make targets

| Command | Description |
|---|---|
| `make run` | Run the dev server |
| `make migrate` | makemigrations + migrate |
| `make superuser` | Create an admin user |
| `make test` | Run the pytest suite |
| `make format` | black + isort |
| `make lint` | flake8 |
| `make compile` | Recompile pinned requirements from `*.in` |
| `make detect-recurring` | Run recurring-transaction detection |

## Testing

```bash
pytest              # full suite (PostgreSQL required)
pytest --cov=apps   # with coverage
```

CI (GitHub Actions) runs black/isort/flake8 and the test suite with coverage against
a Postgres service on every push and pull request.

## Deployment (Vercel + Neon)

1. Create a Neon Postgres database; copy its connection string.
2. Import the repo into Vercel. It builds from `requirements.txt` and serves
   `api/index.py` (WSGI).
3. Set environment variables in Vercel: `DJANGO_SETTINGS_MODULE=config.settings.prod`,
   `SECRET_KEY`, `DATABASE_URL` (Neon), `ALLOWED_HOSTS`, `CRON_SECRET`.
4. `vercel.json` registers a nightly cron that calls
   `/api/internal/detect-recurring/`; Vercel sends the `CRON_SECRET` as a bearer
   token, which the endpoint verifies.
5. Run migrations against Neon once (locally with `DATABASE_URL` pointed at Neon).
