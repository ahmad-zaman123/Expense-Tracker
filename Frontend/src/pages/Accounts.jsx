import { useEffect, useState } from "react"

import { createAccount, deleteAccount, listAccounts } from "../api/finance"
import { Alert, Button, DeleteButton, PageHead, TextField , TableWrap } from "../components/ui.jsx"
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

  const total = accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0)

  return (
    <div className="stack">
      <PageHead title="Accounts">Your cash, bank and wallet balances. Balances are worked out from the entries.</PageHead>

      <Alert>{error}</Alert>

      <form onSubmit={handleAdd} className="entry" aria-label="Add an account">
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. HBL Savings"
          required
        />
        <TextField
          label="Opening balance"
          type="number"
          step="0.01"
          value={openingBalance}
          onChange={(event) => setOpeningBalance(event.target.value)}
          placeholder="0.00"
        />
        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add account"}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="note">Loading the ledger…</p>
      ) : accounts.length === 0 ? (
        <p className="empty-row">No accounts yet. Add your first one above and give it an opening balance.</p>
      ) : (
        <TableWrap label="Accounts">
          <table className="ledger stack">
            <thead>
              <tr>
                <th>Account</th>
                <th className="num">Opening</th>
                <th className="num">Balance</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td data-label="Account">{account.name}</td>
                  <td data-label="Opening" className="num">{formatMoney(account.opening_balance)}</td>
                  <td data-label="Balance" className="num" style={{ fontWeight: 700 }}>
                    {formatMoney(account.current_balance)}
                  </td>
                  <td className="act">
                    <DeleteButton what="account" onConfirm={() => handleDelete(account.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td data-label="Opening" />
                <td data-label="Balance" className="num">{formatMoney(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </TableWrap>
      )}
    </div>
  )
}

export default Accounts
