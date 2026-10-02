// Página provisional para validar el deploy en Vercel y la conexión con la API (CORS).
// Se sustituye por el login y el panel en la HU-12.
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

type Estado = 'comprobando' | 'ok' | 'error'

const mensajes: Record<Estado, string> = {
  comprobando: '⏳ Comprobando la API… (en el plan gratuito de Render puede tardar ~50 s en despertar)',
  ok: '✅ API conectada',
  error: '❌ API no disponible',
}

export default function App() {
  const [estado, setEstado] = useState<Estado>('comprobando')

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)
    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((res) => setEstado(res.ok ? 'ok' : 'error'))
      .catch(() => setEstado('error'))
      .finally(() => clearTimeout(timeout))
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>🍽️ RestoAPI</h1>
      <p>En construcción.</p>
      <p>{mensajes[estado]}</p>
      <p>
        <small>API: {API_URL || '(VITE_API_URL sin configurar)'}</small>
      </p>
    </main>
  )
}
