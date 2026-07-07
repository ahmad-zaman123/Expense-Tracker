import { apiRequest } from "./client"

export function budgetStatus() {
  return apiRequest("/reports/budget-status/")
}
