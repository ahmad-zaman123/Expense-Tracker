import { Link } from "react-router-dom"
import ThemeToggle from "./ThemeToggle.jsx"

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <header className="band">
        <div className="band-inner">
          <Link to="/" className="brand" aria-label="Expense Tracker home">
            <span className="brand-mark" aria-hidden="true">
              ₨
            </span>
            Expense Tracker
          </Link>
          <div className="band-right">
            <ThemeToggle className="on-band" />
          </div>
        </div>
      </header>
      <div className="auth">
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle ? <p className="sub">{subtitle}</p> : null}
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthShell
