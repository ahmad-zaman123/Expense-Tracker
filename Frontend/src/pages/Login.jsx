import { useCallback, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import AuthShell from "../components/AuthShell.jsx"
import GoogleButton from "../components/GoogleButton.jsx"
import { Alert, Button, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { useDocumentTitle } from "../utils/useDocumentTitle"

const DEMO_EMAIL = "demo@expense-tracker.app"
const DEMO_PASSWORD = "demo1234"

/** Where to go after signing in: the local path the session expired on, or the app's home. */
function afterLogin(search, fallback) {
  const next = new URLSearchParams(search).get("next") || ""
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback
}

function Login() {
  useDocumentTitle("Sign in")
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { state, search } = useLocation()
  const [email, setEmail] = useState(state?.demo ? DEMO_EMAIL : "")
  const [password, setPassword] = useState(state?.demo ? DEMO_PASSWORD : "")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

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
      </form>
      <p className="auth-alt">
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            setEmail(DEMO_EMAIL)
            setPassword(DEMO_PASSWORD)
            setError("")
          }}
        >
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
