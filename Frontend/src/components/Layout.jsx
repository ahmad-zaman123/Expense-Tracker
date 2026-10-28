import { NavLink, Outlet, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import { markSignedOut } from "../auth/fingerprint"
import FingerprintMenuItem from "./FingerprintMenuItem.jsx"
import FingerprintOffer from "./FingerprintOffer.jsx"
import ProfileMenu from "./ProfileMenu.jsx"
import ThemeToggle from "./ThemeToggle.jsx"

const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/accounts", label: "Accounts" },
  { to: "/app/transactions", label: "Transactions" },
  { to: "/app/transfers", label: "Transfers" },
  { to: "/app/budgets", label: "Budgets" },
  { to: "/app/recurring", label: "Recurring" },
]

function Layout() {
  const { user, signOut, changePassword } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    markSignedOut()
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
            <ProfileMenu user={user} onSignOut={handleSignOut} changePassword={changePassword}>
              <FingerprintMenuItem user={user} />
            </ProfileMenu>
            <ThemeToggle className="on-band" />
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
          <FingerprintOffer user={user} />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
