import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import AuthShell from "../components/AuthShell.jsx"
import { Alert, Button, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"

function Register() {
  const { register } = useAuth()
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

  return (
    <AuthShell title="Create account" subtitle="Start tracking your finances">
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-emerald-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export default Register
