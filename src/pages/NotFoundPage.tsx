import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <>
      <h1>404 · Página no encontrada</h1>
      <Link to="/">Volver al inicio</Link>
    </>
  )
}
