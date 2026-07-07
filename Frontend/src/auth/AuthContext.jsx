import { createContext, useContext, useEffect, useState } from "react"

import { fetchMe, obtainToken, registerUser } from "../api/auth"
import { clearTokens, getAccessToken } from "../api/client"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCurrentUser() {
      if (!getAccessToken()) {
        setLoading(false)
        return
      }
      try {
        setUser(await fetchMe())
      } catch {
        clearTokens()
      } finally {
        setLoading(false)
      }
    }
    loadCurrentUser()
  }, [])

  async function login({ email, password }) {
    await obtainToken({ email, password })
    const me = await fetchMe()
    setUser(me)
    return me
  }

  async function register({ email, fullName, password }) {
    await registerUser({ email, fullName, password })
    return login({ email, password })
  }

  function signOut() {
    clearTokens()
    setUser(null)
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
