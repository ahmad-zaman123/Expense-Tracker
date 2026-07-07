import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"
import AuthShell from "../components/AuthShell.jsx"
import { Alert, Button, TextField } from "../components/ui.jsx"
import { formatError } from "../utils/errors"

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
    <AuthShell title="Sign in" subtitle="Welcome back">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
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
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        No account?{" "}
        <Link to="/register" className="font-medium text-emerald-600 hover:underline">
          Register
        </Link>
      </p>
    </AuthShell>
  )
}

export default Login
