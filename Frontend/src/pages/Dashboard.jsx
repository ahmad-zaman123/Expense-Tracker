import { useEffect, useRef, useState } from "react"

import { listAccounts } from "../api/finance"
import { cashflow, monthlyReport } from "../api/reports"
import CashflowChart from "../components/CashflowChart.jsx"
import { PageHead, TextField , TableWrap } from "../components/ui.jsx"
import { currentMonth, formatMonth, recentMonthsRange } from "../utils/date"
import { formatMoney } from "../utils/format"
import { useDocumentTitle } from "../utils/useDocumentTitle"

function Total({ label, value, hint }) {
  return (
    <div className="total">
      <div className="total-label">{label}</div>
      <div className="total-value">{value}</div>
      {hint ? <div className="total-hint">{hint}</div> : null}
    </div>
  )
}

function Dashboard() {
  useDocumentTitle("Dashboard")
  const [accounts, setAccounts] = useState([])
  const [month, setMonth] = useState(currentMonth())
  const [monthly, setMonthly] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoMonth, setAutoMonth] = useState(false)
  const monthTouched = useRef(false)

  useEffect(() => {
    Promise.all([listAccounts(), cashflow(recentMonthsRange(6))])
      .then(([accountData, cashflowData]) => {
        setAccounts(accountData.results)
        const rows = cashflowData.map((row) => ({
          month: row.period.slice(0, 7),
          income: Number(row.income),
          expense: Number(row.expense),
        }))
        setChartData(rows)
        // If this month is empty, open on the latest month that has entries, so the totals
        // above the chart are not a row of zeros next to a chart full of data.
        const hasData = (row) => row.income > 0 || row.expense > 0
        const now = currentMonth()
        const latest = [...rows].reverse().find(hasData)
        const thisMonthHasData = rows.some((row) => row.month === now && hasData(row))
        if (latest && !thisMonthHasData && !monthTouched.current) {
          setMonth(latest.month)
          setAutoMonth(true)
        }
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
    <div className="stack">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem" }}>
        <PageHead title="Dashboard">Where the month stands, ruled off.</PageHead>
        <div style={{ width: "10rem" }}>
          <TextField
            label="Month"
            type="month"
            value={month}
            onChange={(event) => {
              monthTouched.current = true
              setAutoMonth(false)
              setMonth(event.target.value)
            }}
          />
        </div>
      </div>

      {autoMonth ? (
        <p className="note" role="status">
          Showing {formatMonth(month)}, the latest month with entries.
        </p>
      ) : null}

      <section aria-label={"Totals for " + formatMonth(month)}>
        <div className="totals">
          <Total label="In" value={monthly ? formatMoney(monthly.income) : "…"} hint={formatMonth(month)} />
          <Total label="Out" value={monthly ? formatMoney(monthly.expense) : "…"} hint={formatMonth(month)} />
          <Total label="Net" value={monthly ? formatMoney(monthly.net) : "…"} hint={formatMonth(month)} />
          <Total
            label="Total balance"
            value={formatMoney(totalBalance)}
            hint={accounts.length + " account" + (accounts.length === 1 ? "" : "s")}
          />
        </div>
      </section>

      <section>
        <h2 className="entry-title">The last six months</h2>
        {loading ? (
          <p className="note">Loading the ledger…</p>
        ) : chartData.length === 0 ? (
          <p className="empty-row">Nothing recorded yet. Add a transaction and this page fills in.</p>
        ) : (
          <>
            <CashflowChart data={chartData} />
            <TableWrap label="Six-month totals" style={{ marginTop: "1rem" }}>
              <table className="ledger stack">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="num">In</th>
                    <th className="num">Out</th>
                    <th className="num">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => {
                    const net = row.income - row.expense
                    return (
                      <tr key={row.month}>
                        <td data-label="Month" className="day">{row.month}</td>
                        <td data-label="In" className="num in">{formatMoney(row.income)}</td>
                        <td data-label="Out" className="num out">{formatMoney(row.expense)}</td>
                        <td data-label="Net" className="num">{(net < 0 ? "−" : "") + formatMoney(Math.abs(net))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableWrap>
          </>
        )}
      </section>
    </div>
  )
}

export default Dashboard
