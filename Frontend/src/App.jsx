import { Route, Routes } from "react-router-dom"

import Layout from "./components/Layout.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import Accounts from "./pages/Accounts.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Landing from "./pages/Landing.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"

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
      </Route>
    </Routes>
  )
}

export default App
