import { Route, Routes } from "react-router-dom"

import Layout from "./components/Layout.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import Accounts from "./pages/Accounts.jsx"
import Budgets from "./pages/Budgets.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import Landing from "./pages/Landing.jsx"
import Login from "./pages/Login.jsx"
import Recurring from "./pages/Recurring.jsx"
import Register from "./pages/Register.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"
import Transactions from "./pages/Transactions.jsx"
import Transfers from "./pages/Transfers.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="transfers" element={<Transfers />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="recurring" element={<Recurring />} />
      </Route>
    </Routes>
  )
}

export default App
