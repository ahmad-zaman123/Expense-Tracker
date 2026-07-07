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
