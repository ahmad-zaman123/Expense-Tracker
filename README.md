<h1 align="center">💸 Expense Tracker</h1>

<p align="center">
  <b>Personal finance with numbers you can trust.</b><br/>
  Accounts, budgets, reports and subscription detection in one dashboard.
</p>

<p align="center">
  <a href="https://github.com/ahmad-zaman123/Expense-Tracker/actions/workflows/ci.yml"><img src="https://github.com/ahmad-zaman123/Expense-Tracker/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://expense-tracker-three-vert-61.vercel.app"><img src="https://img.shields.io/badge/live-demo-000?logo=vercel&logoColor=white&style=flat-square" alt="Live demo" /></a>
  <img src="https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white&style=flat-square" alt="Django 5.2" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=flat-square" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind 4" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white&style=flat-square" alt="PostgreSQL" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT license" /></a>
</p>

<p align="center">
  <a href="https://expense-tracker-three-vert-61.vercel.app"><b>Live demo → expense-tracker-three-vert-61.vercel.app</b></a><br/>
  <sub>Click <b>Try the live demo</b> to get your own private demo account with six months of transactions, budgets and subscriptions. No sign-up needed.</sub>
</p>

https://github.com/user-attachments/assets/15a5dae8-96b8-4c48-b070-9e2e6ff06a6a

<p align="center">
  <a href="#-quick-start">Quick start</a> ·
  <a href="#-how-it-works">How it works</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-csv-import-format">CSV import</a> ·
  <a href="#-api">API</a> ·
  <a href="#-deployment--ci">Deployment</a>
</p>

---

## 🧭 What is Expense Tracker?

A full-stack personal finance app. Log income and expenses across accounts, move money between them, set monthly budgets per category, read monthly reports, import a bank statement as CSV, and let it spot your recurring subscriptions. One currency (PKR), JWT auth, and a **Django REST** backend with a **React + Tailwind** dashboard in the same repo.

| 💰 Track | 🎯 Plan | 🔁 Detect |
|---|---|---|
| Accounts with live balances, transactions with categories and payees, transfers that don't pollute reports | Monthly per-category budgets with spent / remaining progress | Subscriptions found from your history: payee, cadence, next due date, confidence |

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/dashboard-dark.png" />
    <img src="docs/screenshots/dashboard.png" alt="The dashboard: this month's money in and out, the total balance and a six-month chart" width="860" />
  </picture>
</p>

## 🚀 Quick start

**Prerequisites:** Python 3.11, Node 18+, and a local PostgreSQL.

Run the backend and frontend in two terminals, backend first.

**1. Backend** → `http://127.0.0.1:8000`

```bash
cd Backend
python -m venv .venv && source .venv/bin/activate
pip install pip-tools && make install

cp .env.example .env            # then set SECRET_KEY, DATABASE_URL, CRON_SECRET
createdb expense_tracker
make migrate
make superuser
make run                        # Swagger at /api/docs/
```

**2. Frontend** → `http://localhost:5173`

```bash
cd Frontend
npm install
cp .env.example .env            # the dev server proxies /api to VITE_API_URL's backend (http://127.0.0.1:8000)
npm run dev
```

**3. Tests**

```bash
cd Backend && make test
```

<details>
<summary><b>🔧 Environment variables</b> (<code>Backend/.env</code>)</summary>
<br/>

| Key | Required | Notes |
|---|---|---|
| `SECRET_KEY` | **yes** | Django secret key, which signs login tokens. Production refuses to start without a random value of 40+ characters. Make one with `python -c "import secrets; print(secrets.token_urlsafe(50))"`. |
| `DATABASE_URL` | **yes** | Local: `postgres://postgres:postgres@localhost:5432/expense_tracker`. Production: your Neon URL. |
| `CRON_SECRET` | **yes** | Shared secret Vercel Cron sends to the recurring-detection endpoint. Use 16+ random characters. Without one, production keeps the endpoint closed. |
| `DEBUG` | no | `True` for local dev. |
| `ALLOWED_HOSTS` | no | Defaults to `*` in `.env.example`. |
| `CORS_ALLOWED_ORIGINS` | no | Comma-separated frontend origins. Defaults to the local Vite dev server. |
| `CSRF_TRUSTED_ORIGINS` | prod | Comma-separated, used by `config.settings.prod`. |
| `GOOGLE_CLIENT_ID` | no | Turns on "Continue with Google" on the sign-in page. See **Google sign-in** below. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | no | Turn on **Forgot password?**. See **Password reset** below. |

Frontend: `VITE_API_URL` is the backend's `/api`, which the Vite dev server proxies to. It isn't used in production: there `Frontend/vercel.json` rewrites `/api/*` to the backend, so the login cookies belong to the site itself. `VITE_GOOGLE_CLIENT_ID` is the same Google client id, only needed for the Google button.

</details>

<details>
<summary><b>🔑 Google sign-in</b> (optional, free)</summary>
<br/>

Adds a **Continue with Google** button to the sign-in page. First-time Google users get an account created from their Google email and name; existing accounts with the same email just sign in. Password sign-in keeps working as before, and a Google-created account can add a password later from the account menu.

1. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) create an **OAuth client ID** of type **Web application**. If asked, set up the consent screen first (External, app name, your email; no extra scopes).
2. Under **Authorized JavaScript origins** add your frontend origins, for example `http://localhost:5173` and `https://<your-frontend>.vercel.app`. No redirect URI is needed.
3. Put the client ID in `GOOGLE_CLIENT_ID` (backend) **and** `VITE_GOOGLE_CLIENT_ID` (frontend) and redeploy both. There is no client secret in this flow: the backend verifies the Google ID token with Google's public keys and then issues the usual JWT pair from `POST /api/auth/google/`.

Leave both variables empty and the button is hidden.

</details>

<details>
<summary><b>✉️ Password reset</b> (optional, free)</summary>
<br/>

Adds **Forgot password?** to the sign-in page. It emails a link that works once and expires in 15 minutes. Using it, or changing a password from the account menu, ends the account's other sessions. The reply never reveals whether an address has an account, and requests are limited per address, per IP and per day.

1. For Gmail, turn on 2-Step Verification and create an [app password](https://myaccount.google.com/apppasswords).
2. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_FROM` on the backend, and keep the frontend's address first in `CORS_ALLOWED_ORIGINS`, because reset links open that address.
3. Run the `users.0003_ratewindow` migration on the production database.

Leave `SMTP_HOST` empty and the endpoint replies that reset isn't available.

</details>

<details>
<summary><b>🔑 Live demo</b> (live site)</summary>
<br/>

Click **Try the live demo** on the home or sign-in page. `POST /api/auth/demo/` creates a fresh account just for you, with two accounts, six months of transactions, budgets, monthly transfers and detected subscriptions, and signs you in. Nobody else sees what you add or delete.

- Demo accounts can't set a password, add fingerprint sign-in or get reset emails.
- Each one is deleted after two days. Old ones are cleaned up whenever a new demo starts, so no cron job is needed.
- **Limits:** 10 demos per IP address per hour and 500 a day in total, so the database can't be filled up.

For local development, `python manage.py seed_demo` still creates a shared `demo@expense-tracker.app` / `demo1234` login.

</details>

## 🧩 How it works

```
 bank CSV ─────────┐
 manual entry ─────┴──▶  Django REST API  ──▶  PostgreSQL (Neon)
                           (JWT auth)             ▲
                               │                  │
 React dashboard ◀── JSON ─────┘          nightly Vercel Cron
 (Tailwind + Recharts)                    └─▶ detect-recurring
```

### Why it's built this way

Most CRUD demos are forgettable. The backend is organised around four problems that are easy to get wrong, each implemented deliberately and covered by tests. Paths are under `Backend/`.

| Problem | Approach | Where |
|---|---|---|
| **Account balances** | One annotated query: `opening_balance + Σ(income) − Σ(expense)` with filtered `Sum` aggregates. No per-account queries, no Python loops. Transfer legs are included. | `apps/finance/services/balances.py` |
| **Month boundaries** | "July spending" depends on the user's timezone, not the server's. Each month's `[start, end)` is computed at **Asia/Karachi** midnight and queried in UTC, so `2026-08-01 00:30 PKT` counts in August. Proven by a boundary test. | `apps/reports/services.py` |
| **Duplicate imports** | Each CSV row is hashed (`sha256(account │ date │ amount │ description)`) and written with `bulk_create(ignore_conflicts=True)` against a partial unique constraint. **Re-uploading a file creates zero duplicates.** Malformed rows are reported, not fatal. | `apps/finance/services/imports.py` |
| **Subscription detection** | Groups non-transfer transactions by `(payee, account, kind)`. With at least three occurrences 25 to 35 days apart, it records a `RecurringRule` with average amount, cadence, next date and a confidence from gap regularity. Idempotent via `update_or_create`. | `apps/finance/services/recurring.py` |

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🏦 Accounts
Balances are computed from transactions, never stored, so they can't drift.

### 🧾 Transactions
Income and expenses with categories and payees. Filter by month and category, or bulk-import a bank statement.

### 🔀 Transfers
Move money between accounts. Balances change, reports don't.

### 📲 Installable app
Add it to a home screen or desktop and it opens in its own window: the install icon in Chrome or Edge, "Add to Home screen" on Android, or Share then "Add to Home Screen" on iPhone. The service worker keeps only the app shell for offline use. API calls are never cached, so no financial data is stored on the device.

</td>
<td width="50%" valign="top">

### 🎯 Budgets
Monthly per-category limits with progress bars.

### 📊 Reports
Monthly income / expense / net and a 6-month cashflow chart.

### 🔁 Recurring detection
Surfaces subscriptions with payee, cadence, next due date and a confidence score. Runs nightly, and can be dismissed per rule.

### 🔑 Fingerprint sign-in
In the **installed app** only, you can unlock with your fingerprint or face instead of typing a password. It uses passkeys (WebAuthn), so the biometric never leaves the phone and the server stores just a public key. The signature is checked with `ecdsa` (pure Python), so it runs on Vercel without compiled wheels. Demo accounts are excluded.

</td>
</tr>
</table>

<table>
<tr>
<td width="50%" valign="top">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/budgets-dark.png" />
    <img src="docs/screenshots/budgets.png" alt="Budgets with progress bars: on track, nearly used and over the limit" />
  </picture>
  <p align="center"><sub>Budgets: on track, nearly used or over</sub></p>
</td>
<td width="50%" valign="top">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/recurring-dark.png" />
    <img src="docs/screenshots/recurring.png" alt="Detected subscriptions with payee, cadence, next due date and confidence" />
  </picture>
  <p align="center"><sub>Recurring: found from your history</sub></p>
</td>
</tr>
</table>

## 📥 CSV import format

Send a `multipart/form-data` `POST` to `/api/transactions/import/` with the target `account` (its id) and the CSV as `file`. The first row must be a header.

| Column | Required | Format |
|---|---|---|
| `date` | **yes** | `YYYY-MM-DD` |
| `amount` | **yes** | Positive number, e.g. `1250.50` |
| `description` | no | Free text |
| `payee` | no | Free text, used by recurring detection |
| `kind` | no | `INCOME` or `EXPENSE`. Defaults to `EXPENSE`. |

```csv
date,amount,description,payee,kind
2026-07-01,1499.00,Netflix subscription,Netflix,EXPENSE
2026-07-01,85000.00,July salary,Acme Ltd,INCOME
```

Rows that repeat an earlier import are skipped, and rows with a bad date, amount or kind are reported back without failing the file.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/csv-import-dark.png" />
    <img src="docs/screenshots/csv-import.png" alt="Importing the same bank statement a second time: imported 0, skipped 3" width="860" />
  </picture>
</p>

## 🔌 API

Interactive docs at **`/api/docs/`** (Swagger), JSON schema at `/api/schema/`. Everything needs a JWT except registration, login and starting a demo. The site keeps it in httpOnly cookies (`access_token`, `refresh_token`) that page scripts can't read; an `Authorization: Bearer` header works too. The internal endpoint uses a shared secret instead.

| Area | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/register/`, `/auth/demo/`, `/auth/token/`, `/auth/token/refresh/`, `/auth/logout/`, `/auth/google/`, `/auth/password/`, `GET /auth/me/` |
| **Fingerprint** | `POST /api/auth/passkey/register/options/` and `/verify/` (signed in), `POST /api/auth/passkey/login/options/` and `/verify/`, `GET /api/auth/passkeys/`, `DELETE /api/auth/passkeys/<id>/` |
| **Finance** | `/api/accounts/`, `/categories/`, `/budgets/`, `/transactions/`, `/transfers/` (list, create, detail) |
| **Import** | `POST /api/transactions/import/` |
| **Recurring** | `GET /api/recurring/`, `POST /api/recurring/<id>/dismiss/` |
| **Reports** | `GET /api/reports/monthly/`, `/reports/budget-status/`, `/reports/cashflow/` |
| **Internal** | `/api/internal/detect-recurring/` (secret-gated, called by Vercel Cron) |

## 🛠️ Tech stack

| Layer | Tech |
|---|---|
| **Backend** | Python 3.11, Django 5.2, Django REST Framework, PostgreSQL, `simplejwt`, `drf-spectacular` |
| **Frontend** | React 19, Vite, React Router, Tailwind CSS v4, Recharts |
| **Tooling** | pytest, black, isort, flake8, oxlint |
| **Deployment** | Vercel (serverless Python + static React), Neon Postgres, Vercel Cron |

## 🗂️ Project structure

```
Expense-Tracker/
├── Backend/
│   ├── apps/
│   │   ├── finance/        accounts, transactions, budgets, transfers, recurring
│   │   │   └── services/   balances · imports · recurring · transfers
│   │   ├── reports/        monthly report, budget status, cashflow
│   │   ├── users/          registration and JWT auth
│   │   └── core/           shared models and pagination
│   ├── config/settings/    base · dev · prod · test
│   └── Makefile
└── Frontend/
    └── src/                pages · components · api · auth
```

## ☁️ Deployment & CI

- **Vercel, two projects.** The backend (`Backend/api/index.py`, Python runtime) and the frontend (static build) deploy separately. Neon provides Postgres.
- **Nightly detection.** `Backend/vercel.json` schedules `/api/internal/detect-recurring/` at `0 20 * * *` (UTC), authenticated with `CRON_SECRET`. No always-on worker is needed.
- **Database migrations.** Vercel doesn't run them. After deploying a change that adds a migration (the fingerprint tables are `users.0002_passkeys`), run `python manage.py migrate` once against the production database, for example `DATABASE_URL=<neon url> python manage.py migrate`.
- **Fingerprint sign-in needs no new settings.** It only works from origins listed in `CORS_ALLOWED_ORIGINS`, so keep your frontend URL in that list.
- **CI.** `.github/workflows/ci.yml` runs black, isort, flake8 and `pytest --cov` against a Postgres 15 service on every push and pull request.

## 📄 License

[MIT](LICENSE) © 2026 Ahmad Zaman
