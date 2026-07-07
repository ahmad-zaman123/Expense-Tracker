import { useEffect, useState } from "react"

import { listAccounts } from "../api/finance"
import { cashflow, monthlyReport } from "../api/reports"
import CashflowChart from "../components/CashflowChart.jsx"
import { Card, TextField } from "../components/ui.jsx"
import { currentMonth, recentMonthsRange } from "../utils/date"
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
  const [month, setMonth] = useState(currentMonth())
  const [monthly, setMonthly] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listAccounts(), cashflow(recentMonthsRange(6))])
      .then(([accountData, cashflowData]) => {
        setAccounts(accountData.results)
        setChartData(
          cashflowData.map((row) => ({
            month: row.period.slice(0, 7),
            income: Number(row.income),
            expense: Number(row.expense),
          })),
        )
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    monthlyReport(month).then(setMonthly)
  }, [month])

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.current_balance || 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-500">Your financial snapshot.</p>
        </div>
        <div className="w-40">
          <TextField
            label="Month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total balance"
          value={formatMoney(totalBalance)}
          hint={accounts.length + " account" + (accounts.length === 1 ? "" : "s")}
        />
        <StatTile label="Income" value={monthly ? formatMoney(monthly.income) : "…"} hint={month} />
        <StatTile
          label="Expense"
          value={monthly ? formatMoney(monthly.expense) : "…"}
          hint={month}
        />
        <StatTile label="Net" value={monthly ? formatMoney(monthly.net) : "…"} hint={month} />
      </div>

      <Card>
        <p className="mb-4 text-sm font-medium text-slate-700">
          Income vs expense (last 6 months)
        </p>
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="text-slate-500">No data yet — add some transactions.</p>
        ) : (
          <CashflowChart data={chartData} />
        )}
      </Card>
    </div>
  )
}

export default Dashboard
