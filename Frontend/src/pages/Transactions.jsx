import { useEffect, useState } from "react"

import {
  createTransaction,
  deleteTransaction,
  importTransactions,
  listAccounts,
  listCategories,
  listTransactions,
} from "../api/finance"
import { Alert, Button, DeleteButton, Fold, PageHead, SelectField, TextField } from "../components/ui.jsx"
import { todayISODate } from "../utils/date"
import { formatError } from "../utils/errors"
import { formatMoney } from "../utils/format"

function monthBounds(month) {
  if (!month) {
    return {}
  }
  const [year, monthIndex] = month.split("-").map(Number)
  const lastDay = new Date(year, monthIndex, 0).getDate()
  return {
    date_from: month + "-01T00:00:00",
    date_to: month + "-" + String(lastDay).padStart(2, "0") + "T23:59:59",
  }
}

const EMPTY_FORM = {
  kind: "EXPENSE",
  amount: "",
  occurred_at: "",
  account_id: "",
  category_id: "",
  payee: "",
  description: "",
}

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [filterMonth, setFilterMonth] = useState("")
  const [filterCategory, setFilterCategory] = useState("")

  const [form, setForm] = useState({ ...EMPTY_FORM, occurred_at: todayISODate() })
  const [submitting, setSubmitting] = useState(false)

  const [importAccount, setImportAccount] = useState("")
  const [importFile, setImportFile] = useState(null)
  const [importSummary, setImportSummary] = useState(null)
  const [importing, setImporting] = useState(false)

  async function loadTransactions() {
    setLoading(true)
    try {
      const params = { ...monthBounds(filterMonth), category: filterCategory }
      const data = await listTransactions(params)
      setTransactions(data.results)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([listAccounts(), listCategories()])
      .then(([accountData, categoryData]) => {
        setAccounts(accountData.results)
        setCategories(categoryData.results)
      })
      .catch((err) => setError(formatError(err)))
  }, [])

  useEffect(() => {
    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterCategory])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleAdd(event) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await createTransaction({
        kind: form.kind,
        amount: form.amount,
        occurred_at: form.occurred_at + "T12:00:00",
        account_id: form.account_id,
        category_id: form.category_id || null,
        payee: form.payee,
        description: form.description,
      })
      setForm({ ...EMPTY_FORM, occurred_at: todayISODate() })
      await loadTransactions()
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    setError("")
    try {
      await deleteTransaction(id)
      await loadTransactions()
    } catch (err) {
      setError(formatError(err))
    }
  }

  async function handleImport(event) {
    event.preventDefault()
    setError("")
    setImportSummary(null)
    setImporting(true)
    try {
      const summary = await importTransactions({
        accountId: importAccount,
        file: importFile,
      })
      setImportSummary(summary)
      setImportFile(null)
      event.target.reset()
      await loadTransactions()
    } catch (err) {
      setError(formatError(err))
    } finally {
      setImporting(false)
    }
  }

  const formCategories = categories.filter((category) => category.kind === form.kind)

  const sums = transactions.reduce(
    (acc, t) => {
      if (t.kind === "INCOME") acc.in += Number(t.amount)
      else acc.out += Number(t.amount)
      return acc
    },
    { in: 0, out: 0 },
  )

  return (
    <div className="stack">
      <PageHead title="Transactions">Record income and expenses, or import a bank statement.</PageHead>

      <Alert>{error}</Alert>

      <Fold title="New entry">
        <form onSubmit={handleAdd} className="entry" aria-label="Add a transaction">
          <SelectField label="Kind" value={form.kind} onChange={(e) => updateForm("kind", e.target.value)}>
            <option value="EXPENSE">Expense (out)</option>
            <option value="INCOME">Income (in)</option>
          </SelectField>
          <TextField
            label="Amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => updateForm("amount", e.target.value)}
            required
          />
          <TextField
            label="Date"
            type="date"
            value={form.occurred_at}
            onChange={(e) => updateForm("occurred_at", e.target.value)}
            required
          />
          <SelectField
            label="Account"
            value={form.account_id}
            onChange={(e) => updateForm("account_id", e.target.value)}
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
            label="Category"
            value={form.category_id}
            onChange={(e) => updateForm("category_id", e.target.value)}
          >
            <option value="">Uncategorized</option>
            {formCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Payee"
            value={form.payee}
            onChange={(e) => updateForm("payee", e.target.value)}
            placeholder="e.g. Netflix"
          />
          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add transaction"}
            </Button>
          </div>
        </form>
      </Fold>

      <Fold title="Import a CSV statement">
        <form onSubmit={handleImport} className="entry" aria-label="Import a CSV statement">
          <SelectField
            label="Into account"
            value={importAccount}
            onChange={(e) => setImportAccount(e.target.value)}
            required
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </SelectField>
          <div className="field">
            <label className="field-label" htmlFor="csv-file">
              CSV file
            </label>
            <input
              id="csv-file"
              className="input"
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files[0] || null)}
              required
            />
          </div>
          <div>
            <Button type="submit" disabled={importing || !importFile}>
              {importing ? "Importing…" : "Import"}
            </Button>
          </div>
        </form>
        <p className="note">
          Needs a header row with <code>date</code> (YYYY-MM-DD) and <code>amount</code>; optional{" "}
          <code>description</code>, <code>payee</code>, and <code>kind</code> (INCOME or EXPENSE, default
          EXPENSE). Importing the same file twice adds nothing.
        </p>
        {importSummary ? (
          <p role="status" style={{ marginTop: "0.5rem" }}>
            Imported <strong>{importSummary.created}</strong>, skipped {importSummary.skipped}
            {importSummary.errors?.length ? ", " + importSummary.errors.length + " row error(s)" : ""}.
          </p>
        ) : null}
      </Fold>

      <section>
        <h2 className="entry-title">The ledger</h2>
        <div className="entry" style={{ borderTop: "none", paddingTop: 0 }}>
          <TextField label="Month" type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
          <SelectField label="Category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
        </div>

        {loading ? (
          <p className="note">Loading the ledger…</p>
        ) : transactions.length === 0 ? (
          <p className="empty-row">No transactions match these filters. Open New entry above to add one.</p>
        ) : (
          <div className="table-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Particulars</th>
                  <th>Category</th>
                  <th className="num">Out</th>
                  <th className="num">In</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const isIncome = transaction.kind === "INCOME"
                  return (
                    <tr key={transaction.id}>
                      <td className="day">{transaction.occurred_at.slice(0, 10)}</td>
                      <td>{transaction.payee || transaction.description || "—"}</td>
                      <td className="muted">{transaction.category?.name || "—"}</td>
                      <td className="num out">{isIncome ? "" : formatMoney(transaction.amount)}</td>
                      <td className="num in">{isIncome ? formatMoney(transaction.amount) : ""}</td>
                      <td className="act">
                        <DeleteButton what="entry" onConfirm={() => handleDelete(transaction.id)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Total of the lines shown</td>
                  <td className="num">{formatMoney(sums.out)}</td>
                  <td className="num">{formatMoney(sums.in)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Transactions
