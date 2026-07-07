import { Navigate } from "react-router-dom"

import { useAuth } from "../auth/AuthContext"

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="p-8 text-slate-500">Loading…</div>
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default ProtectedRoute
