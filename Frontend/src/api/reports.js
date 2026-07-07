import { apiRequest } from "./client"

export function budgetStatus() {
  return apiRequest("/reports/budget-status/")
}

export function monthlyReport(month) {
  return apiRequest("/reports/monthly/" + (month ? "?month=" + month : ""))
}

export function cashflow({ from, to, granularity = "month" }) {
  const query = new URLSearchParams({ from, to, granularity })
  return apiRequest("/reports/cashflow/?" + query.toString())
}
