import { apiRequest } from "./client"

export function listRecurring() {
  return apiRequest("/recurring/")
}

export function dismissRecurring(id) {
  return apiRequest("/recurring/" + id + "/dismiss/", { method: "POST" })
}
