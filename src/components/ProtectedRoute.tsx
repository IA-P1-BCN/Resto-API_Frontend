import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Rol } from '../api/types'
import { useAuth } from '../context/useAuth'
import ForbiddenPage from '../pages/ForbiddenPage'

/** Sin sesión → login (recordando la página a la que se quería ir). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <p className="page-message">Cargando sesión…</p>
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

/** Rol sin permiso → página 403. */
export function RequireRole({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.rol)) return <ForbiddenPage />
  return <>{children}</>
}
