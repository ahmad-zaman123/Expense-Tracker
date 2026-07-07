import { apiRequest } from "./client"

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
