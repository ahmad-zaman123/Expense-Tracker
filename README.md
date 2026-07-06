# Expense Tracker API

A backend-heavy personal finance API: accounts, categories, transactions, budgets,
and reporting — built with Django REST Framework and PostgreSQL, deployable to Vercel.

Single currency (PKR). JWT authentication. Background recurring-transaction detection
runs as a Vercel Cron job (no always-on worker required).

## Tech stack

- Python 3.11 · Django 4.2 · Django REST Framework
- PostgreSQL (local for dev, Neon serverless for production)
- JWT auth via `djangorestframework-simplejwt`
- API docs via `drf-spectacular` (Swagger UI at `/api/docs/`)
- Deploy target: Vercel serverless (`@vercel/python`)

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install pip-tools
make compile            # build requirements/*.txt from *.in
make install            # pip-sync dev deps

cp .env.example .env    # then edit DATABASE_URL, SECRET_KEY

createdb expense_tracker
make migrate
make superuser
make run                # http://127.0.0.1:8000/admin/
```

## Make targets

| Command | Description |
|---|---|
| `make run` | Run the dev server |
| `make migrate` | makemigrations + migrate |
| `make superuser` | Create an admin user |
| `make test` | Run the pytest suite |
| `make format` | black + isort |
| `make lint` | flake8 |
| `make detect-recurring` | Run recurring-transaction detection |

## Project structure

```
config/          settings (base/dev/prod/test), urls, wsgi/asgi
apps/core        BaseModel (UUID pk + timestamps), pagination
apps/users       email-based custom User + JWT auth
apps/finance     Account, Category, Transaction, Budget, RecurringRule
apps/reports     aggregation report endpoints
api/index.py     Vercel WSGI entrypoint
```

## Status

Phase 0 (scaffold) complete. See build plan for remaining phases.
