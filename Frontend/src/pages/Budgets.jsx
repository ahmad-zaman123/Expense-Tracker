import { useEffect, useState } from "react"

import { createBudget, deleteBudget, listCategories } from "../api/finance"
import { budgetStatus } from "../api/reports"
import { Alert, Button, DeleteButton, PageHead, SelectField, TextField , TableWrap } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { formatMoney } from "../utils/format"

function Meter({ percent }) {
  const value = Number(percent)
  const level = value > 100 ? "over" : value >= 80 ? "near" : "ok"
  return (
    <div
      className={"meter " + level}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(Math.round(value), 100)}
      aria-label="Budget used"
    >
      <i style={{ width: Math.min(value, 100) + "%" }} />
    </div>
  )
}

function stateOf(status) {
  const value = Number(status.percent_used)
  if (value > 100) return { level: "over", text: "Over by " + formatMoney(Math.abs(Number(status.remaining))) }
  if (value >= 80) return { level: "near", text: "Nearly used" }
  return { level: "ok", text: "On track" }
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
    <div className="stack">
      <PageHead title="Budgets">Monthly spending limits per expense category.</PageHead>

      <Alert>{error}</Alert>

      <form onSubmit={handleAdd} className="entry" aria-label="Add a budget">
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
        <TextField
          label="Monthly limit"
          type="number"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add budget"}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="note">Loading the ledger…</p>
      ) : statuses.length === 0 ? (
        <p className="empty-row">No budgets yet. Pick a category and a monthly limit above.</p>
      ) : (
        <TableWrap label="Budgets">
          <table className="ledger stack">
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Limit</th>
                <th className="num">Spent</th>
                <th className="num">Left</th>
                <th>Used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {statuses.map((status) => {
                const state = stateOf(status)
                return (
                  <tr key={status.budget_id}>
                    <td data-label="Category">{status.category_name}</td>
                    <td data-label="Limit" className="num">{formatMoney(status.limit)}</td>
                    <td data-label="Spent" className="num out">{formatMoney(status.spent)}</td>
                    <td data-label="Left" className="num">{formatMoney(status.remaining)}</td>
                    <td data-label="Used" style={{ minWidth: "11rem" }}>
                      <Meter percent={status.percent_used} />
                      <span className={"state " + state.level}>
                        {status.percent_used}% · {state.text}
                      </span>
                    </td>
                    <td className="act">
                      <DeleteButton what="budget" onConfirm={() => handleDelete(status.budget_id)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
    </div>
  )
}

export default Budgets
