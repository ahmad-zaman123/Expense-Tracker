import { createContext, useContext, useEffect, useState } from "react"

import { changePassword as changePasswordRequest, fetchMe, obtainToken, obtainTokenWithGoogle, registerUser } from "../api/auth"
import { clearTokens, getAccessToken } from "../api/client"
import { clearSignedOut, fingerprintLogin } from "./fingerprint"

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
    clearSignedOut()
    setUser(me)
    return me
  }

  async function register({ email, fullName, password }) {
    await registerUser({ email, fullName, password })
    return login({ email, password })
  }

  async function loginWithGoogle(credential) {
    await obtainTokenWithGoogle(credential)
    const me = await fetchMe()
    clearSignedOut()
    setUser(me)
    return me
  }

  async function loginWithFingerprint() {
    await fingerprintLogin()
    const me = await fetchMe()
    clearSignedOut()
    setUser(me)
    return me
  }

  async function changePassword(payload) {
    await changePasswordRequest(payload)
    setUser(await fetchMe())
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
    loginWithGoogle,
    loginWithFingerprint,
    register,
    changePassword,
    signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
