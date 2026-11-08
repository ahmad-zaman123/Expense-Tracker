import { apiRequest, markSignedIn, signOutOnServer } from "./client"

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
  markSignedIn()
  return data
}

/** Exchange a Google ID token (from the Google button) for our JWT pair; creates the account on first use. */
export async function obtainTokenWithGoogle(credential) {
  const data = await apiRequest("/auth/google/", {
    method: "POST",
    auth: false,
    body: { credential },
  })
  markSignedIn()
  return data
}

/** Start a private demo: the server creates a fresh account with sample data and signs us in. */
export async function startDemo() {
  const data = await apiRequest("/auth/demo/", { method: "POST", auth: false })
  markSignedIn()
  return data
}

export async function fetchMe() {
  return apiRequest("/auth/me/")
}

/** Changing the password ends every session; the server sets fresh cookies for this one. */
export async function changePassword(payload) {
  return apiRequest("/auth/password/", { method: "POST", body: payload })
}

export async function forgotPassword(email) {
  return apiRequest("/auth/password/forgot/", { method: "POST", auth: false, body: { email } })
}

export async function resetPassword(payload) {
  return apiRequest("/auth/password/reset/", { method: "POST", auth: false, body: payload })
}

export function logout() {
  return signOutOnServer()
}
