import { useEffect, useState } from "react"

import { createBudget, deleteBudget, listCategories } from "../api/finance"
import { budgetStatus } from "../api/reports"
import { Alert, Button, Card, SelectField, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { formatMoney } from "../utils/format"

function ProgressBar({ percent }) {
  const value = Number(percent)
  const clamped = Math.min(value, 100)
  const isOver = value > 100
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
      <div
        className={"h-2 rounded-full " + (isOver ? "bg-red-500" : "bg-emerald-500")}
        style={{ width: clamped + "%" }}
      />
    </div>
  )
}

function Budgets() {
  const [statuses, setStatuses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [statusData, categoryData] = await Promise.all([budgetStatus(), listCategories()])
      setStatuses(statusData)
      setCategories(categoryData.results.filter((category) => category.kind === "EXPENSE"))
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
      await createBudget({ categoryId, amount })
      setCategoryId("")
      setAmount("")
      await load()
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(budgetId) {
    setError("")
    try {
      await deleteBudget(budgetId)
      await load()
    } catch (err) {
      setError(formatError(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
        <p className="mt-1 text-slate-500">Monthly spending limits per expense category.</p>
      </div>

      <Alert>{error}</Alert>

      <Card>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <SelectField
              label="Category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="w-40">
            <TextField
              label="Monthly limit"
              type="number"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add budget"}
          </Button>
        </form>
      </Card>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : statuses.length === 0 ? (
        <Card>
          <p className="text-slate-500">No budgets yet. Add one above.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {statuses.map((status) => (
            <Card key={status.budget_id}>
              <div className="flex items-start justify-between">
                <p className="font-medium text-slate-900">{status.category_name}</p>
                <button
                  onClick={() => handleDelete(status.budget_id)}
                  className="text-sm text-slate-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {formatMoney(status.spent)} of {formatMoney(status.limit)} · {status.percent_used}%
                used
              </p>
              <ProgressBar percent={status.percent_used} />
              <p className="mt-1 text-xs text-slate-400">
                {formatMoney(status.remaining)} remaining
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Budgets
