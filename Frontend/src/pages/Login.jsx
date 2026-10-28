import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import { deviceCredential, signedOutDeliberately, useFingerprintAvailable, wasCancelled } from "../auth/fingerprint"
import AuthShell from "../components/AuthShell.jsx"
import GoogleButton from "../components/GoogleButton.jsx"
import { Alert, Button, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { useDocumentTitle } from "../utils/useDocumentTitle"

const DEMO_EMAIL = "demo@expense-tracker.app"
const DEMO_PASSWORD = "demo1234"
const FINGERPRINT =
  "M12 11a3 3 0 0 0-3 3c0 2.5-.5 4-1.5 5.5M12 7a7 7 0 0 0-7 7c0 1.5-.2 3-.7 4M12 3a11 11 0 0 1 11 11c0 2-.3 3.5-.8 5M15 14c0 3-.7 5-2 7M9 3.5A11 11 0 0 0 1 14"

/** Where to go after signing in: the local path the session expired on, or the app's home. */
function afterLogin(search, fallback) {
  const next = new URLSearchParams(search).get("next") || ""
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback
}

function Login() {
  useDocumentTitle("Sign in")
  const { login, loginWithGoogle, loginWithFingerprint } = useAuth()
  const navigate = useNavigate()
  const { state, search } = useLocation()
  const [email, setEmail] = useState(state?.demo ? DEMO_EMAIL : "")
  const [password, setPassword] = useState(state?.demo ? DEMO_PASSWORD : "")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const fingerprintReady = useFingerprintAvailable() && Boolean(deviceCredential())
  const autoTried = useRef(false)

  const handleFingerprint = useCallback(async () => {
    setError("")
    setSubmitting(true)
    try {
      await loginWithFingerprint()
      navigate(afterLogin(search, "/app"))
    } catch (err) {
      if (!wasCancelled(err)) setError(err.status === 401 ? "Fingerprint wasn't accepted. Use your password." : formatError(err))
    } finally {
      setSubmitting(false)
    }
  }, [loginWithFingerprint, navigate, search])

  // Ask for the fingerprint as soon as the page opens, except right after the person chose to sign out.
  useEffect(() => {
    if (fingerprintReady && !autoTried.current && !signedOutDeliberately()) {
      autoTried.current = true
      handleFingerprint()
    }
  }, [fingerprintReady, handleFingerprint])

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(afterLogin(search, "/app"))
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  /** One click: sign straight in as the shared demo user. */
  async function useDemo() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError("")
    setSubmitting(true)
    try {
      await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
      navigate(afterLogin(search, "/app"))
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = useCallback(
    async (credential) => {
      setError("")
      setSubmitting(true)
      setGoogleBusy(true)
      try {
        await loginWithGoogle(credential)
        navigate(afterLogin(search, "/app"))
      } catch (err) {
        setError(formatError(err))
      } finally {
        setSubmitting(false)
        setGoogleBusy(false)
      }
    },
    [loginWithGoogle, navigate],
  )

  return (
    <AuthShell title="Sign in to your ledger" subtitle="Welcome back.">
      <form onSubmit={handleSubmit} className="auth-form" style={{ display: "grid", gap: "0.9rem" }}>
        <GoogleButton onCredential={handleGoogle} onError={setError} busy={googleBusy} />
        <Alert>{error}</Alert>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <Button type="submit" disabled={submitting} className="full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        {fingerprintReady ? (
          <div className="fp-wrap">
            <button type="button" className="fp-btn" onClick={handleFingerprint} disabled={submitting} aria-label="Sign in with fingerprint" title="Sign in with fingerprint">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d={FINGERPRINT} />
              </svg>
            </button>
            <span aria-hidden="true">Use fingerprint</span>
          </div>
        ) : null}
      </form>
      <p className="auth-alt">
        <button type="button" className="text-btn" onClick={useDemo} disabled={submitting}>
          Use the demo account
        </button>
        No account?{" "}
        <Link to="/register" >
          Register
        </Link>
      </p>
    </AuthShell>
  )
}

export default Login
