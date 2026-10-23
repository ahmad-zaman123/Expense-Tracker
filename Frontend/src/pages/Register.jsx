import { useCallback, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import AuthShell from "../components/AuthShell.jsx"
import GoogleButton from "../components/GoogleButton.jsx"
import { Alert, Button, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { useDocumentTitle } from "../utils/useDocumentTitle"

function Register() {
  useDocumentTitle("Create account")
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await register({ email, fullName, password })
      navigate("/app")
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
      try {
        await loginWithGoogle(credential)
        navigate("/app")
      } catch (err) {
        setError(formatError(err))
      } finally {
        setSubmitting(false)
      }
    },
    [loginWithGoogle, navigate],
  )

  return (
    <AuthShell title="Open a new ledger" subtitle="Start tracking your finances.">
      <form onSubmit={handleSubmit} className="auth-form" style={{ display: "grid", gap: "0.9rem" }}>
        <GoogleButton onCredential={handleGoogle} onError={setError} text="signup_with" />
        <Alert>{error}</Alert>
        <TextField
          label="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" disabled={submitting} className="full">
          {submitting ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="auth-alt">
        Already have an account?{" "}
        <Link to="/login" >
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export default Register
