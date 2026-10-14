import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import AuthShell from "../components/AuthShell.jsx"
import { Alert, Button, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { useDocumentTitle } from "../utils/useDocumentTitle"

const DEMO_EMAIL = "demo@expense-tracker.app"
const DEMO_PASSWORD = "demo1234"

function Login() {
  useDocumentTitle("Sign in")
  const { login } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState(state?.demo ? DEMO_EMAIL : "")
  const [password, setPassword] = useState(state?.demo ? DEMO_PASSWORD : "")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate("/app")
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Sign in to your ledger" subtitle="Welcome back.">
      <form onSubmit={handleSubmit} className="auth-form" style={{ display: "grid", gap: "0.9rem" }}>
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
