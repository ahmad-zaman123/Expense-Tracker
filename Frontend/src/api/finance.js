import { apiRequest } from "./client"

// Accounts
export function listAccounts() {
  return apiRequest("/accounts/")
}

export function createAccount({ name, openingBalance }) {
  return apiRequest("/accounts/", {
    method: "POST",
    body: { name, opening_balance: openingBalance },
  })
}

export function deleteAccount(id) {
  return apiRequest("/accounts/" + id + "/", { method: "DELETE" })
}

// Categories
export function listCategories() {
  return apiRequest("/categories/")
}

// Transactions
export function listTransactions(params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.append(key, value)
    }
  }
  const suffix = query.toString() ? "?" + query.toString() : ""
  return apiRequest("/transactions/" + suffix)
}

export function createTransaction(payload) {
  return apiRequest("/transactions/", { method: "POST", body: payload })
}

export function deleteTransaction(id) {
  return apiRequest("/transactions/" + id + "/", { method: "DELETE" })
}

export function importTransactions({ accountId, file }) {
  const form = new FormData()
  form.append("account_id", accountId)
  form.append("file", file)
  return apiRequest("/transactions/import/", {
    method: "POST",
    body: form,
    isForm: true,
  })
}

// Transfers
export function listTransfers() {
  return apiRequest("/transfers/")
}

export function createTransfer({ fromAccountId, toAccountId, amount, occurredAt, description }) {
  return apiRequest("/transfers/", {
    method: "POST",
    body: {
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount,
      occurred_at: occurredAt,
      description: description || "",
    },
  })
}

export function deleteTransfer(id) {
  return apiRequest("/transfers/" + id + "/", { method: "DELETE" })
}

// Budgets
export function listBudgets() {
  return apiRequest("/budgets/")
}

export function createBudget({ categoryId, amount }) {
  return apiRequest("/budgets/", {
    method: "POST",
    body: { category_id: categoryId, amount },
  })
}

export function deleteBudget(id) {
  return apiRequest("/budgets/" + id + "/", { method: "DELETE" })
}
