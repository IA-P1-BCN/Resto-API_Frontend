import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { labelFor, navItemsFor, ROLE_LABEL } from '../routes/navigation'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <>
      <h1>Hola, {user.name}</h1>
      <p className="muted">Panel de {ROLE_LABEL[user.role].toLowerCase()}</p>
      <div className="cards">
        {navItemsFor(user.role).map((item) => (
          <Link key={item.path} to={item.path} className="card card-link">
            <strong>{labelFor(item, user.role)}</strong>
            <span className="muted">{item.description}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
