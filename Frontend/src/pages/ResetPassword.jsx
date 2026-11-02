import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { logout, resetPassword } from "../api/auth"
import AuthShell from "../components/AuthShell.jsx"
import { Alert, Button, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"
import { useDocumentTitle } from "../utils/useDocumentTitle"

const INVALID_LINK = "This reset link is invalid or has expired."

function ResetPassword() {
  useDocumentTitle("Choose a new password")
  const [params] = useSearchParams()
  const uid = params.get("uid") || ""
  const token = params.get("token") || ""
  const validLink = Boolean(uid && token)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState(validLink ? "" : INVALID_LINK)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (password !== confirm) {
      setError("The passwords don't match.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      await resetPassword({ uid, token, new_password: password })
      // Any session in this browser has just ended too.
      logout()
      setDone(true)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title={done ? "Password changed" : "Choose a new password"}
      subtitle={done ? "You can now sign in with it. Any other devices have been signed out." : "Pick something at least 8 characters long."}
    >
      {done ? null : (
        <form onSubmit={handleSubmit} className="auth-form" style={{ display: "grid", gap: "0.9rem" }}>
          <Alert>{error}</Alert>
          <TextField
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Button type="submit" disabled={submitting || !validLink} className="full">
            {submitting ? "One moment…" : "Change password"}
          </Button>
        </form>
      )}
      <p className="auth-alt">
        {done ? <Link to="/login">Go to sign in</Link> : <Link to="/forgot-password">Send a new reset link</Link>}
      </p>
    </AuthShell>
  )
}

export default ResetPassword
