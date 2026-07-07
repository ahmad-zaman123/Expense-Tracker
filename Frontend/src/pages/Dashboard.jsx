import { useEffect, useState } from "react"

import { listAccounts } from "../api/finance"
import { Card } from "../components/ui.jsx"
import { formatMoney } from "../utils/format"

function StatTile({ label, value, hint }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </Card>
  )
}

function Dashboard() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAccounts()
      .then((data) => setAccounts(data.results))
      .finally(() => setLoading(false))
  }, [])

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.current_balance || 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">Your financial snapshot.</p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile
            label="Total balance"
            value={formatMoney(totalBalance)}
            hint={"Across " + accounts.length + " account" + (accounts.length === 1 ? "" : "s")}
          />
          <StatTile label="Accounts" value={accounts.length} />
        </div>
      )}
    </div>
  )
}

export default Dashboard
