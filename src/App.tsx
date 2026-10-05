import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { pingHealth } from './api/auth'
import Layout from './components/Layout'
import { RequireAuth, RequireRole } from './components/ProtectedRoute'
import WakeUpBanner from './components/WakeUpBanner'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import PlaceholderPage from './pages/PlaceholderPage'
import { NAV_ITEMS } from './routes/navigation'

export default function App() {
  // Despierta la API en Render en cuanto se abre la web (riesgo R1)
  useEffect(() => {
    pingHealth()
  }, [])

  return (
    <>
      <WakeUpBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          {NAV_ITEMS.map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                <RequireRole roles={item.roles}>
                  <PlaceholderPage item={item} />
                </RequireRole>
              }
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
