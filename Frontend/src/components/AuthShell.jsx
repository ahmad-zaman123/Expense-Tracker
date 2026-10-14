function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth">
      <div className="auth-card">
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
