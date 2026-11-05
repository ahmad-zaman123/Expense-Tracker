import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import ThemeToggle from "../components/ThemeToggle.jsx"
import { formatError } from "../utils/errors"

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
        <table className="ledger stack">
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
                <td className="num out" data-label="Out">{row.out || ""}</td>
                <td className="num in" data-label="In">{row.in || ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Ruled off</td>
              <td className="num" data-label="Out">{totalOut}</td>
              <td className="num" data-label="In">{totalIn}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <figcaption className="specimen-cap">An example page, in rupees.</figcaption>
    </figure>
  )
}

function Landing() {
  const { isAuthenticated, loginAsDemo } = useAuth()
  const navigate = useNavigate()
  const [demoBusy, setDemoBusy] = useState(false)
  const [demoError, setDemoError] = useState("")

  async function startDemo() {
    setDemoError("")
    setDemoBusy(true)
    try {
      await loginAsDemo()
      navigate("/app")
    } catch (err) {
      setDemoError(formatError(err))
      setDemoBusy(false)
    }
  }

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
          <h1 className="landing-title">A ledger for every rupee</h1>
          <p className="landing-lede">
            Track income and expenses across accounts, set budgets, move money between accounts, and
            catch recurring subscriptions, all in one ledger.
          </p>
          <div className="landing-cta">
            <Link to="/register" className="btn" style={{ textDecoration: "none" }}>
              Get started — it&apos;s free
            </Link>
            <button type="button" className="btn outline" onClick={startDemo} disabled={demoBusy}>
              {demoBusy ? "Setting up your demo…" : "Try the live demo"}
            </button>
          </div>
          {demoError && (
            <p className="error-banner" role="alert" style={{ marginTop: "0.8rem" }}>
              {demoError}
            </p>
          )}
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
