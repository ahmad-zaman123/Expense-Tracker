# Deployment — Vercel + Neon

This repo deploys as **two Vercel projects from the same GitHub repo** (one per
folder) plus a **Neon** Postgres database. All free-tier.

```
Neon Postgres  ←  Backend (Vercel, Root Directory: Backend)  ←  Frontend (Vercel, Root Directory: Frontend)
```

## 1. Database — Neon

1. Create a project at https://neon.tech (free tier).
2. Copy the **connection string** (looks like
   `postgres://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`).
3. Keep it handy — it's the backend's `DATABASE_URL`.

## 2. Backend — Vercel project

1. **New Project** → import this GitHub repo.
2. **Root Directory:** `Backend`.
3. **Environment Variables:**

   | Key | Value |
   |---|---|
   | `DJANGO_SETTINGS_MODULE` | `config.settings.prod` |
   | `SECRET_KEY` | a long random string |
   | `DATABASE_URL` | the Neon connection string |
   | `ALLOWED_HOSTS` | `.vercel.app` (or your backend domain) |
   | `CRON_SECRET` | a long random string |
   | `CORS_ALLOWED_ORIGINS` | the frontend URL, e.g. `https://expense-tracker-frontend.vercel.app` |

4. Deploy. The build installs `requirements.txt` and serves `api/index.py` (WSGI).
   Note the backend URL (e.g. `https://expense-tracker-backend.vercel.app`).

### Run migrations against Neon (once)

From your machine, point `DATABASE_URL` at Neon and migrate:

```bash
cd Backend
source .venv/bin/activate
DATABASE_URL="<neon-url>" DJANGO_SETTINGS_MODULE=config.settings.prod \
  python manage.py migrate
# optional: create an admin user the same way
DATABASE_URL="<neon-url>" DJANGO_SETTINGS_MODULE=config.settings.prod \
  python manage.py createsuperuser
```

## 3. Frontend — Vercel project

1. **New Project** → import the **same** repo again.
2. **Root Directory:** `Frontend`. Vercel auto-detects Vite (build `npm run build`,
   output `dist`).
3. **Environment Variable:**

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | the backend URL + `/api`, e.g. `https://expense-tracker-backend.vercel.app/api` |

4. Deploy, then note the frontend URL.

## 4. Wire the two together

- Set the backend's `CORS_ALLOWED_ORIGINS` to the **frontend URL** (step 2) and
  redeploy the backend if you set it after the fact.
- Confirm `VITE_API_URL` (step 3) points at the backend `/api`.

## 5. Recurring detection cron

`Backend/vercel.json` already registers a nightly cron hitting
`/api/internal/detect-recurring/`. Vercel automatically sends the `CRON_SECRET` as an
`Authorization: Bearer` header, which the endpoint verifies. No extra setup — just make
sure `CRON_SECRET` is set on the backend project.

## Checklist

- [ ] Neon DB created, connection string copied
- [ ] Backend Vercel project (Root: `Backend`) with all env vars
- [ ] `migrate` run against Neon
- [ ] Frontend Vercel project (Root: `Frontend`) with `VITE_API_URL`
- [ ] Backend `CORS_ALLOWED_ORIGINS` set to the frontend URL
- [ ] Register from the deployed frontend and confirm the round-trip works
