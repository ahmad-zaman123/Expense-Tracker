import { apiRequest, clearTokens, setTokens } from "./client"

export async function registerUser({ email, fullName, password }) {
  return apiRequest("/auth/register/", {
    method: "POST",
    auth: false,
    body: { email, full_name: fullName, password },
  })
}

export async function obtainToken({ email, password }) {
  const data = await apiRequest("/auth/token/", {
    method: "POST",
    auth: false,
    body: { email, password },
  })
  setTokens({ access: data.access, refresh: data.refresh })
  return data
}

export async function fetchMe() {
  return apiRequest("/auth/me/")
}

export function logout() {
  clearTokens()
}
