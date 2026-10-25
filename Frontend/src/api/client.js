const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"

const ACCESS_KEY = "access_token"
const REFRESH_KEY = "refresh_token"

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// One refresh at a time: when several requests hit an expired token together
// they all wait for the same new access token instead of each asking for one.
let refreshing = null

async function refreshAccess() {
  if (!refreshing) {
    refreshing = (async () => {
      const refresh = localStorage.getItem(REFRESH_KEY)
      if (!refresh) return false
      try {
        const response = await fetch(API_URL + "/auth/token/refresh/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        })
        if (!response.ok) return false
        const data = await response.json()
        setTokens({ access: data.access })
        return true
      } catch {
        return false
      }
    })().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

/** The session is over: forget the tokens and go to sign in, remembering where we were. */
function sessionExpired() {
  clearTokens()
  if (window.location.pathname === "/login") return
  const here = window.location.pathname + window.location.search
  window.location.assign("/login?next=" + encodeURIComponent(here))
}

// Thin fetch wrapper: injects the JWT, serializes JSON, and raises an error
// carrying the response status and parsed body for callers to handle.
// Access tokens last an hour: on the first 401 of an authenticated call it gets a
// fresh one with the refresh token and retries once; if that fails, the session is over.
export async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = true, isForm = false, retry = true } = options

  const headers = {}
  if (!isForm) {
    headers["Content-Type"] = "application/json"
  }
  const token = getAccessToken()
  if (auth && token) {
    headers["Authorization"] = "Bearer " + token
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
