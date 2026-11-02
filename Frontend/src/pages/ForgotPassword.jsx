import { useState } from "react"
import { Link } from "react-router-dom"

import { forgotPassword } from "../api/auth"
import AuthShell from "../components/AuthShell.jsx"
import { Alert, Button, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { useDocumentTitle } from "../utils/useDocumentTitle"

function ForgotPassword() {
  useDocumentTitle("Reset your password")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      setSent((await forgotPassword(email)).detail)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle={sent ? `${sent} It expires in 15 minutes, so check your spam folder if you don't see it.` : "Enter your email and we'll send you a link to choose a new one."}
    >
      {sent ? null : (
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
          <Button type="submit" disabled={submitting} className="full">
            {submitting ? "One moment…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="auth-alt">
        <Link to="/login">Back to sign in</Link>
      </p>
    </AuthShell>
  )
}

export default ForgotPassword
