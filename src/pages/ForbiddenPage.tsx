import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <>
      <h1>403 · Sin acceso</h1>
      <p className="muted">Tu rol no tiene permiso para ver esta sección.</p>
      <Link to="/">Volver al inicio</Link>
    </>
  )
}
