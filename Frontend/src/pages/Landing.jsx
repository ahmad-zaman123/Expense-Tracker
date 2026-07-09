import { Link } from "react-router-dom"

function LogoMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-sm shadow-emerald-600/30">
      ₨
    </span>
  )
}

const PREVIEW_ROWS = [
  { name: "Salary", sub: "Acme Corp", amount: "+₨120,000", tone: "text-emerald-600" },
  { name: "Netflix", sub: "Subscription", amount: "−₨1,100", tone: "text-rose-600" },
  { name: "Groceries", sub: "Imtiaz", amount: "−₨6,800", tone: "text-rose-600" },
]

function DashboardPreview() {
  return (
    <div className="w-full max-w-md rotate-1 rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <span className="ml-2 text-xs font-semibold text-slate-400">Dashboard</span>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-xs font-medium text-emerald-700">Income</p>
            <p className="mt-1 text-lg font-bold text-slate-900">₨270,000</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3">
            <p className="text-xs font-medium text-rose-700">Expenses</p>
            <p className="mt-1 text-lg font-bold text-slate-900">₨142,300</p>
          </div>
        </div>
        <div className="space-y-2">
          {PREVIEW_ROWS.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{row.name}</p>
                <p className="text-xs text-slate-400">{row.sub}</p>
              </div>
              <span className={"text-sm font-semibold " + row.tone}>{row.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Landing() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight text-slate-900">Expense Tracker</span>
        </div>
        <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Sign in
        </Link>
      </header>

      <main className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-8 md:grid-cols-2">
        <div className="max-w-xl">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Personal finance
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Know where your <span className="text-emerald-600">money</span> goes.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Track income and expenses across accounts, set budgets, move money between
            accounts, and auto-detect recurring subscriptions — all in one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-700"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              to="/login"
              state={{ demo: true }}
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
            >
              Try the live demo
            </Link>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <DashboardPreview />
        </div>
      </main>
    </div>
  )
}

export default Landing
