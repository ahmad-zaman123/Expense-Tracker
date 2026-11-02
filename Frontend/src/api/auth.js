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

/** Exchange a Google ID token (from the Google button) for our JWT pair; creates the account on first use. */
export async function obtainTokenWithGoogle(credential) {
  const data = await apiRequest("/auth/google/", {
    method: "POST",
    auth: false,
    body: { credential },
  })
  setTokens({ access: data.access, refresh: data.refresh })
  return data
}

export async function fetchMe() {
  return apiRequest("/auth/me/")
}

/** Changing the password ends every session, so keep the new pair the server returns for this one. */
export async function changePassword(payload) {
  const data = await apiRequest("/auth/password/", { method: "POST", body: payload })
  setTokens({ access: data.access, refresh: data.refresh })
  return data
}

export async function forgotPassword(email) {
  return apiRequest("/auth/password/forgot/", { method: "POST", auth: false, body: { email } })
}

export async function resetPassword(payload) {
  return apiRequest("/auth/password/reset/", { method: "POST", auth: false, body: payload })
}

export function logout() {
  clearTokens()
}
