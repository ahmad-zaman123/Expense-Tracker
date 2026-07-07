function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white">
          ₨
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expense Tracker</h1>
        <p className="mt-3 text-slate-500">
          A personal finance dashboard — accounts, budgets, reports, and recurring
          subscription detection.
        </p>
        <p className="mt-8 text-sm text-slate-400">Frontend scaffold · Vite + React + Tailwind</p>
      </div>
    </div>
  )
}

export default Landing
