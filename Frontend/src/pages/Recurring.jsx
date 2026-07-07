import { useEffect, useState } from "react"

import { dismissRecurring, listRecurring } from "../api/recurring"
import { Alert, Card } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { formatMoney } from "../utils/format"

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recurring</h1>
        <p className="mt-1 text-slate-500">
          Subscriptions and repeating charges detected from your transactions. Detection
          runs nightly.
        </p>
      </div>

      <Alert>{error}</Alert>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : rules.length === 0 ? (
        <Card>
          <p className="text-slate-500">
            No recurring charges detected yet. Once a payee appears about monthly across a
            few transactions, it shows up here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">{rule.payee}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    ≈ {formatMoney(rule.avg_amount)} every {rule.cadence_days} days
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Next expected {rule.next_expected_at} · {rule.sample_count} charges ·{" "}
                    {Math.round(Number(rule.confidence) * 100)}% confidence
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(rule.id)}
                  className="text-sm text-slate-400 hover:text-red-600"
                >
                  Dismiss
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Recurring
