import { Route, Routes } from "react-router-dom"

import Layout from "./components/Layout.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import Accounts from "./pages/Accounts.jsx"
import Budgets from "./pages/Budgets.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Landing from "./pages/Landing.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import Transactions from "./pages/Transactions.jsx"
import Transfers from "./pages/Transfers.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
      </Route>
    </Routes>
  )
}

export default App
