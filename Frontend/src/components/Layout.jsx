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

function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate("/login")
  }

  return (
    <div>
      <header className="band">
        <div className="band-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true">
              ₨
            </span>
            Expense Tracker
          </span>
          <div className="band-right">
            <span className="who">{user?.email}</span>
            <button onClick={handleSignOut} className="band-btn">
              Sign out
            </button>
          </div>
        </div>
        <nav className="tabs" aria-label="Sections">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => "tab" + (isActive ? " is-active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="page-wrap">
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
