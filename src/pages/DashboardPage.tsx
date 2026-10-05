import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { labelFor, navItemsFor, ROL_LABEL } from '../routes/navigation'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <>
      <h1>Hola, {user.nombre}</h1>
      <p className="muted">Panel de {ROL_LABEL[user.rol].toLowerCase()}</p>
      <div className="cards">
        {navItemsFor(user.rol).map((item) => (
          <Link key={item.path} to={item.path} className="card card-link">
            <strong>{labelFor(item, user.rol)}</strong>
            <span className="muted">{item.description}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
