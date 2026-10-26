import { Link, Navigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import ThemeToggle from "../components/ThemeToggle.jsx"

// A synthetic example page, labelled as such below.
const SPECIMEN = [
  { date: "01 Sep", name: "Salary", sub: "Acme Corp", in: "120,000.00" },
  { date: "03 Sep", name: "Netflix", sub: "Subscription", out: "1,100.00" },
  { date: "05 Sep", name: "Groceries", sub: "Imtiaz", out: "6,800.00" },
  { date: "09 Sep", name: "K-Electric", sub: "Utilities", out: "9,450.00" },
]

function Specimen() {
  const totalIn = "120,000.00"
  const totalOut = "17,350.00"
  return (
    <figure className="specimen" style={{ margin: 0 }}>
      <div className="table-wrap">
        <table className="ledger">
          <caption>September</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th className="num">Out</th>
              <th className="num">In</th>
            </tr>
          </thead>
          <tbody>
            {SPECIMEN.map((row) => (
              <tr key={row.name}>
                <td className="day">{row.date}</td>
                <td>
                  {row.name}
                  <span className="sub">{row.sub}</span>
                </td>
                <td className="num out">{row.out || ""}</td>
                <td className="num in">{row.in || ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Ruled off</td>
              <td className="num">{totalOut}</td>
              <td className="num">{totalIn}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <figcaption className="specimen-cap">An example page, in rupees.</figcaption>
    </figure>
  )
}

function Landing() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="landing">
      <div className="band">
        <header className="landing-nav" style={{ padding: "0.85rem clamp(1rem, 4vw, 2rem)" }}>
          <span className="brand">
            <span className="brand-mark" aria-hidden="true">
              ₨
            </span>
            Expense Tracker
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Link to="/login" className="band-btn" style={{ textDecoration: "none" }}>
              Sign in
            </Link>
            <ThemeToggle className="on-band" />
          </div>
        </header>
      </div>

      <main className="landing-main">
        <div>
          <h1 className="landing-title">Know where your money goes.</h1>
          <p className="landing-lede">
            Track income and expenses across accounts, set budgets, move money between accounts, and
            catch recurring subscriptions, all in one ledger.
          </p>
          <div className="landing-cta">
            <Link to="/register" className="btn" style={{ textDecoration: "none" }}>
              Get started — it&apos;s free
            </Link>
            <Link to="/login" state={{ demo: true }} className="btn outline" style={{ textDecoration: "none" }}>
              Try the live demo
            </Link>
          </div>
          <ul className="landing-points">
            <li>Balances are worked out from your entries, so they cannot drift.</li>
            <li>Months follow Pakistan time, so a late-night entry lands in the right month.</li>
            <li>Importing the same bank statement twice never adds a duplicate.</li>
          </ul>
        </div>

        <Specimen />
      </main>
    </div>
  )
}

export default Landing
