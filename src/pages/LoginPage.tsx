import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router-dom'
import { getErrorMessage, isUnauthorized } from '../api/errors'
import { MOCK_PASSWORD, MOCK_USERS } from '../api/mockAuth'
import { USE_MOCK } from '../config'
import { useAuth } from '../context/useAuth'
import { ROLE_LABEL } from '../routes/navigation'

export default function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') return <Navigate to={from} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(isUnauthorized(err) ? 'Email o contraseña incorrectos' : getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>🍽️ RestoAPI</h1>
        <p className="muted">Inicia sesión para continuar</p>

        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>

        {USE_MOCK && (
          <div className="mock-users">
            <p className="muted">
              Modo simulado · contraseña <code>{MOCK_PASSWORD}</code>
            </p>
            {MOCK_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEmail(u.email)
                  setPassword(MOCK_PASSWORD)
                }}
              >
                {ROLE_LABEL[u.role]}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}
