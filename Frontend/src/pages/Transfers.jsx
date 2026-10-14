import { useEffect, useState } from "react"

import { createTransfer, deleteTransfer, listAccounts, listTransfers } from "../api/finance"
import { Alert, Button, DeleteButton, PageHead, SelectField, TextField , TableWrap } from "../components/ui.jsx"
import { todayISODate } from "../utils/date"
import { formatError } from "../utils/errors"
import { formatMoney } from "../utils/format"
import { useDocumentTitle } from "../utils/useDocumentTitle"

function Transfers() {
  useDocumentTitle("Transfers")
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

  const sameAccount = fromAccount && fromAccount === toAccount

  return (
    <div className="stack">
      <PageHead title="Transfers">
        Move money between your accounts. Transfers change balances but never count as income or expense.
      </PageHead>

      <Alert>{error}</Alert>

      <form onSubmit={handleAdd} className="entry" aria-label="Record a transfer">
        <SelectField label="From" value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} required>
          <option value="">Select account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="To" value={toAccount} onChange={(e) => setToAccount(e.target.value)} required>
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
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <div>
          <Button type="submit" disabled={submitting || sameAccount}>
            {submitting ? "Transferring…" : "Transfer"}
          </Button>
        </div>
      </form>
      {sameAccount && <p className="note">Choose two different accounts.</p>}

      {loading ? (
        <p className="note">Loading the ledger…</p>
      ) : transfers.length === 0 ? (
        <p className="empty-row">No transfers yet.</p>
      ) : (
        <TableWrap label="Transfers">
          <table className="ledger stack">
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th className="num">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr key={transfer.id}>
                  <td data-label="Date" className="day">{transfer.occurred_at.slice(0, 10)}</td>
                  <td data-label="From">{transfer.from_account.name}</td>
                  <td data-label="To">{transfer.to_account.name}</td>
                  <td data-label="Amount" className="num">{formatMoney(transfer.amount)}</td>
                  <td className="act">
                    <DeleteButton what="transfer" onConfirm={() => handleDelete(transfer.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </div>
  )
}

export default Transfers
