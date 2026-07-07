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

// Thin fetch wrapper: injects the JWT, serializes JSON, and raises an error
// carrying the response status and parsed body for callers to handle.
export async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = true, isForm = false } = options

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
