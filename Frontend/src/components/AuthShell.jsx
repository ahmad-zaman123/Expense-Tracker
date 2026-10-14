import { Link } from "react-router-dom"

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth">
      <div className="auth-card">
        <Link to="/" className="back-link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </Link>
        <span className="brand" style={{ color: "var(--ink)" }}>
          <span className="brand-mark" aria-hidden="true">
            ₨
          </span>
          Expense Tracker
        </span>
        <h1>{title}</h1>
        {subtitle ? <p className="sub">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  )
}

export default AuthShell
