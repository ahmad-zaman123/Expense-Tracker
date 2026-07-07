import { useEffect, useState } from "react"

import {
  createTransaction,
  deleteTransaction,
  importTransactions,
  listAccounts,
  listCategories,
  listTransactions,
} from "../api/finance"
import { Alert, Button, Card, SelectField, TextField } from "../components/ui.jsx"
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="mt-1 text-slate-500">Record income and expenses, or import a statement.</p>
      </div>

      <Alert>{error}</Alert>

      <Card>
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label="Kind"
            value={form.kind}
            onChange={(event) => updateForm("kind", event.target.value)}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </SelectField>
          <TextField
            label="Amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(event) => updateForm("amount", event.target.value)}
            required
          />
          <TextField
            label="Date"
            type="date"
            value={form.occurred_at}
            onChange={(event) => updateForm("occurred_at", event.target.value)}
            required
          />
          <SelectField
            label="Account"
            value={form.account_id}
            onChange={(event) => updateForm("account_id", event.target.value)}
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
            onChange={(event) => updateForm("category_id", event.target.value)}
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
            onChange={(event) => updateForm("payee", event.target.value)}
            placeholder="e.g. Netflix"
          />
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add transaction"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium text-slate-700">Import CSV statement</p>
        <form onSubmit={handleImport} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <SelectField
              label="Account"
              value={importAccount}
              onChange={(event) => setImportAccount(event.target.value)}
              required
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </SelectField>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => setImportFile(event.target.files[0] || null)}
            required
            className="text-sm text-slate-600"
          />
          <Button type="submit" disabled={importing || !importFile}>
            {importing ? "Importing…" : "Import"}
          </Button>
        </form>
        {importSummary ? (
          <p className="mt-3 text-sm text-slate-600">
            Imported <span className="font-semibold text-emerald-700">{importSummary.created}</span>,
            skipped {importSummary.skipped}
            {importSummary.errors?.length ? ", " + importSummary.errors.length + " row error(s)" : ""}.
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-40">
            <TextField
              label="Month"
              type="month"
              value={filterMonth}
              onChange={(event) => setFilterMonth(event.target.value)}
            />
          </div>
          <div className="w-48">
            <SelectField
              label="Category"
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-slate-500">No transactions match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Payee / Description</th>
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 text-right font-medium">Amount</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-600">
                      {transaction.occurred_at.slice(0, 10)}
                    </td>
                    <td className="py-2 pr-4 text-slate-900">
                      {transaction.payee || transaction.description || "—"}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {transaction.category?.name || "—"}
                    </td>
                    <td
                      className={
                        "py-2 pr-4 text-right font-medium " +
                        (transaction.kind === "INCOME" ? "text-emerald-600" : "text-slate-900")
                      }
                    >
                      {transaction.kind === "INCOME" ? "+" : "−"}
                      {formatMoney(transaction.amount)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => handleDelete(transaction.id)}
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
        )}
      </Card>
    </div>
  )
}

export default Transactions
