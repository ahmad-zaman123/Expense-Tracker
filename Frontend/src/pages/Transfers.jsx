import { useEffect, useState } from "react"

import { createTransfer, deleteTransfer, listAccounts, listTransfers } from "../api/finance"
import { Alert, Button, Card, SelectField, TextField } from "../components/ui.jsx"
import { todayISODate } from "../utils/date"
import { formatError } from "../utils/errors"
import { formatMoney } from "../utils/format"

function Transfers() {
  const [transfers, setTransfers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [fromAccount, setFromAccount] = useState("")
  const [toAccount, setToAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(todayISODate())
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [transferData, accountData] = await Promise.all([listTransfers(), listAccounts()])
      setTransfers(transferData.results)
      setAccounts(accountData.results)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(event) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await createTransfer({
        fromAccountId: fromAccount,
        toAccountId: toAccount,
        amount,
        occurredAt: date + "T12:00:00",
      })
      setFromAccount("")
      setToAccount("")
      setAmount("")
      setDate(todayISODate())
      await load()
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    setError("")
    try {
      await deleteTransfer(id)
      await load()
    } catch (err) {
      setError(formatError(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transfers</h1>
        <p className="mt-1 text-slate-500">
          Move money between your accounts. Transfers update balances but never count as
          income or expense.
        </p>
      </div>

      <Alert>{error}</Alert>

      <Card>
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            label="From"
            value={fromAccount}
            onChange={(event) => setFromAccount(event.target.value)}
            required
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="To"
            value={toAccount}
            onChange={(event) => setToAccount(event.target.value)}
            required
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Transferring…" : "Transfer"}
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : transfers.length === 0 ? (
        <Card>
          <p className="text-slate-500">No transfers yet.</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">From</th>
                  <th className="py-2 pr-4 font-medium">To</th>
                  <th className="py-2 pr-4 text-right font-medium">Amount</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-600">
                      {transfer.occurred_at.slice(0, 10)}
                    </td>
                    <td className="py-2 pr-4 text-slate-900">{transfer.from_account.name}</td>
                    <td className="py-2 pr-4 text-slate-900">{transfer.to_account.name}</td>
                    <td className="py-2 pr-4 text-right font-medium text-slate-900">
                      {formatMoney(transfer.amount)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => handleDelete(transfer.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default Transfers
