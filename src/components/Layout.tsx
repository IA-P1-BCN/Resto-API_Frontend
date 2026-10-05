import { NavLink, Outlet } from 'react-router-dom'
import { USE_MOCK } from '../config'
import { useAuth } from '../context/useAuth'
import { labelFor, navItemsFor, ROL_LABEL } from '../routes/navigation'

export default function Layout() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <div className="layout">
      <header className="topbar">
        <NavLink to="/" className="brand">
          🍽️ RestoAPI
        </NavLink>
        <div className="user-box">
          <span>
            {user.nombre} · <span className="badge">{ROL_LABEL[user.rol]}</span>
          </span>
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {USE_MOCK && <div className="banner banner-info">Modo simulado: datos de prueba, sin conexión a la API.</div>}

      <div className="body">
        <nav className="sidebar" aria-label="Navegación principal">
          <NavLink to="/" end>
            Inicio
          </NavLink>
          {navItemsFor(user.rol).map((item) => (
            <NavLink key={item.path} to={item.path}>
              {labelFor(item, user.rol)}
            </NavLink>
          ))}
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
