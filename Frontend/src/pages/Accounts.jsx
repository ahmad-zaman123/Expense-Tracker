import { useEffect, useState } from "react"

import { createAccount, deleteAccount, listAccounts } from "../api/finance"
import { Alert, Button, Card, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { formatMoney } from "../utils/format"

function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [openingBalance, setOpeningBalance] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await listAccounts()
      setAccounts(data.results)
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
      await createAccount({ name, openingBalance: openingBalance || "0" })
      setName("")
      setOpeningBalance("")
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
      await deleteAccount(id)
      await load()
    } catch (err) {
      setError(formatError(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
        <p className="mt-1 text-slate-500">Your cash, bank, and wallet balances.</p>
      </div>

      <Alert>{error}</Alert>

      <Card>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. HBL Savings"
              required
            />
          </div>
          <div className="w-40">
            <TextField
              label="Opening balance"
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(event) => setOpeningBalance(event.target.value)}
              placeholder="0.00"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add account"}
          </Button>
        </form>
      </Card>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : accounts.length === 0 ? (
        <Card>
          <p className="text-slate-500">No accounts yet. Add your first one above.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">{account.name}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {formatMoney(account.current_balance)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Opening {formatMoney(account.opening_balance)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-sm text-slate-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Accounts
