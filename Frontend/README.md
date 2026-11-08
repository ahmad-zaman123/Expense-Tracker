# Expense Tracker — Frontend

A Vite + React + Tailwind dashboard for the Expense Tracker API. See the
[root README](../README.md) for the full project and the backend.

## Stack

React 19 · Vite · React Router · Tailwind CSS v4 · Recharts

## Local development

```bash
npm install
cp .env.example .env      # VITE_API_URL: the backend's /api (e.g. http://127.0.0.1:8000/api)
npm run dev               # http://localhost:5173
npm run build             # production build to dist/
```

The app calls `/api` on its own address and the dev server proxies it to `VITE_API_URL`,
so the backend must be running there, and its `CORS_ALLOWED_ORIGINS` must include this
app's origin (`http://localhost:5173` by default in dev).

## Structure

```
src/api/         fetch client (session cookies) + endpoint wrappers
src/auth/        auth context (login/register/logout); the JWTs are httpOnly cookies
src/components/  Layout, ProtectedRoute, shared UI (ui.jsx), CashflowChart
src/pages/       Landing, Login, Register, Dashboard, Accounts, Transactions,
                 Transfers, Budgets, Recurring
src/utils/       date, money, and error-formatting helpers
```

## Deployment

Deploys as its own Vercel project (Root Directory `Frontend`). `vercel.json` passes
`/api/*` to the backend, so `VITE_API_URL` isn't needed in production. See the [root README](../README.md#deployment).
