# Expense Tracker — Frontend

A Vite + React + Tailwind dashboard for the Expense Tracker API. See the
[root README](../README.md) for the full project and the backend.

## Stack

React 19 · Vite · React Router · Tailwind CSS v4 · Recharts

## Local development

```bash
npm install
cp .env.example .env      # set VITE_API_URL (e.g. http://127.0.0.1:8000/api)
npm run dev               # http://localhost:5173
npm run build             # production build to dist/
```

The backend must be running and reachable at `VITE_API_URL`, and its
`CORS_ALLOWED_ORIGINS` must include this app's origin (`http://localhost:5173` by
default in dev).

## Structure

```
src/api/         fetch client (JWT header) + endpoint wrappers
src/auth/        JWT auth context (login/register/logout, persisted token)
src/components/  Layout, ProtectedRoute, shared UI (ui.jsx), CashflowChart
src/pages/       Landing, Login, Register, Dashboard, Accounts, Transactions,
                 Transfers, Budgets, Recurring
src/utils/       date, money, and error-formatting helpers
```

## Deployment

Deploys as its own Vercel project (Root Directory `Frontend`) with `VITE_API_URL`
pointing at the backend. See the [root README](../README.md#deployment).
