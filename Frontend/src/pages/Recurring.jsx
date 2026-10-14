import { useEffect, useState } from "react"

import { dismissRecurring, listRecurring } from "../api/recurring"
import { Alert, DeleteButton, PageHead } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { formatMoney } from "../utils/format"

// Where the next expected charge stands, in calm words. A charge that is long overdue has most
// likely stopped (a cancelled subscription), so say that rather than "expected 75 days ago".
function dueState(iso, cadenceDays) {
  const days = Math.round((new Date(iso + "T00:00:00") - new Date().setHours(0, 0, 0, 0)) / 86400000)
  if (Number.isNaN(days)) return { level: "ok", text: "" }
  const plural = (n) => n + " day" + (n === 1 ? "" : "s")
  if (days > 7) return { level: "ok", text: "In " + plural(days) }
  if (days > 0) return { level: "near", text: "Due in " + plural(days) }
  if (days === 0) return { level: "near", text: "Due today" }
  const late = -days
  if (late > Math.max(Number(cadenceDays) || 0, 14)) {
    return { level: "ok", text: "No recent charge. It may have stopped." }
  }
  return { level: "near", text: "Due " + plural(late) + " ago" }
}

function Recurring() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    try {
      const data = await listRecurring()
      setRules(data.results)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDismiss(id) {
    setError("")
    try {
      await dismissRecurring(id)
      await load()
    } catch (err) {
      setError(formatError(err))
    }
  }

  return (
    <div className="stack">
      <PageHead title="Recurring">
        Subscriptions and repeating charges detected from your transactions. Detection runs nightly.
      </PageHead>

      <Alert>{error}</Alert>

      {loading ? (
        <p className="note">Loading the ledger…</p>
      ) : rules.length === 0 ? (
        <p className="empty-row">
          No recurring charges detected yet. Once a payee appears about monthly across a few
          transactions, it shows up here.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Payee</th>
                <th className="num">About</th>
                <th>Every</th>
                <th>Next due</th>
                <th className="num">Confidence</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    {rule.payee}
                    <span className="sub">{rule.sample_count} charges seen</span>
                  </td>
                  <td className={"num " + (rule.kind === "INCOME" ? "in" : "out")}>{formatMoney(rule.avg_amount)}</td>
                  <td>{rule.cadence_days} days</td>
                  <td>
                    <span className="day">{rule.next_expected_at}</span>
                    <span className={"sub state " + dueState(rule.next_expected_at, rule.cadence_days).level}>
                      {dueState(rule.next_expected_at, rule.cadence_days).text}
                    </span>
                  </td>
                  <td className="num">{Math.round(Number(rule.confidence) * 100)}%</td>
                  <td className="act">
                    <DeleteButton label="Dismiss" what="charge" onConfirm={() => handleDismiss(rule.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Recurring
