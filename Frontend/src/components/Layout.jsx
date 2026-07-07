import { NavLink, Outlet, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"

const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/accounts", label: "Accounts" },
  { to: "/app/transactions", label: "Transactions" },
  { to: "/app/transfers", label: "Transfers" },
  { to: "/app/budgets", label: "Budgets" },
  { to: "/app/recurring", label: "Recurring" },
]

function navClass({ isActive }) {
  return (
    "rounded-md px-3 py-2 text-sm font-medium " +
    (isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:text-slate-900")
  )
}

function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              ₨
            </div>
            <span className="font-semibold text-slate-900">Expense Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-3 pb-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
