// The app calls /api on its own address: Vercel (and the Vite dev server) pass those calls to the backend, so the
// sign-in cookies belong to this site. The tokens themselves are httpOnly cookies that scripts here can't read;
// this file only remembers whether someone is signed in.
const API_URL = "/api"
const SIGNED_IN = "signed_in"

// Tokens from before the switch to cookies.
localStorage.removeItem("access_token")
localStorage.removeItem("refresh_token")

export function isSignedIn() {
  return localStorage.getItem(SIGNED_IN) === "1"
}

/** A sign-in reply has just set the cookies. */
export function markSignedIn() {
  localStorage.setItem(SIGNED_IN, "1")
}

export function clearTokens() {
  localStorage.removeItem(SIGNED_IN)
}

/** Ask the server to clear the cookies, and wait for it, so a closed tab can't leave a live session behind. */
export async function signOutOnServer() {
  clearTokens()
  try {
    await fetch(API_URL + "/auth/logout/", { method: "POST" })
  } catch {
    // Offline: the cookies expire on their own.
  }
}

// One refresh at a time: when several requests hit an expired token together
// they all wait for the same new access token instead of each asking for one.
let refreshing = null

async function refreshAccess() {
  if (!refreshing) {
    refreshing = (async () => {
      if (!isSignedIn()) return false
      try {
        // The refresh token rides along as a cookie; the new access token comes back as one.
        const response = await fetch(API_URL + "/auth/token/refresh/", { method: "POST" })
        return response.ok
      } catch {
        return false
      }
    })().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

/** The session is over: forget it and go to sign in, remembering where we were. */
function sessionExpired() {
  clearTokens()
  if (window.location.pathname === "/login") return
  const here = window.location.pathname + window.location.search
  window.location.assign("/login?next=" + encodeURIComponent(here))
}

// Thin fetch wrapper: the session cookie rides along, it serializes JSON, and raises an error
// carrying the response status and parsed body for callers to handle.
// Access tokens last an hour: on the first 401 of an authenticated call it gets a
// fresh one from the refresh cookie and retries once; if that fails, the session is over.
export async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = true, isForm = false, retry = true } = options

  const headers = {}
  if (!isForm) {
    headers["Content-Type"] = "application/json"
  }
  const response = await fetch(API_URL + path, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && auth) {
    if (retry && (await refreshAccess())) {
      return apiRequest(path, { ...options, retry: false })
    }
    sessionExpired()
    const expired = new Error("Your session has expired. Please sign in again.")
    expired.status = 401
    expired.data = { detail: expired.message }
    throw expired
  }

  const contentType = response.headers.get("content-type") || ""
  const data = contentType.includes("application/json") ? await response.json() : null

  if (!response.ok) {
    const error = new Error("Request failed with status " + response.status)
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}
