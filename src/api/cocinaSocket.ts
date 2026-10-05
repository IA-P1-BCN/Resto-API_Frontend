// Conexión en tiempo real con la cocina: WebSocket /ws/cocina con reconexión automática (riesgo R5).
import { API_URL, USE_MOCK } from '../config'
import { mockEvents } from './mock/events'
import { tokenStorage } from './tokenStorage'
import type { CocinaEvent } from './types'

export type ConnectionStatus = 'connecting' | 'open' | 'closed'

interface Options {
  onEvent: (event: CocinaEvent) => void
  onStatus: (status: ConnectionStatus) => void
}

const RETRY_BASE_MS = 1000
const RETRY_MAX_MS = 30_000

/** ws(s)://<api>/ws/cocina?token=<jwt> — el navegador no permite cabeceras en un WebSocket. */
export function cocinaSocketUrl(): string {
  const url = new URL('/ws/cocina', API_URL)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const token = tokenStorage.get()
  if (token) url.searchParams.set('token', token)
  return url.toString()
}

function isCocinaEvent(data: unknown): data is CocinaEvent {
  const e = data as Partial<CocinaEvent> | null
  return (
    !!e &&
    (e.event === 'pedido_creado' || e.event === 'pedido_actualizado') &&
    typeof e.pedido === 'object' &&
    e.pedido !== null &&
    typeof e.pedido.id === 'number'
  )
}

/** Abre la conexión y devuelve la función para cerrarla. */
export function connectCocina({ onEvent, onStatus }: Options): () => void {
  if (USE_MOCK) {
    onStatus('connecting')
    const timer = setTimeout(() => onStatus('open'), 300)
    const unsubscribe = mockEvents.subscribe(onEvent)
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }

  let socket: WebSocket | null = null
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let intentos = 0
  let cerrado = false

  const conectar = () => {
    onStatus('connecting')
    socket = new WebSocket(cocinaSocketUrl())
    socket.onopen = () => {
      intentos = 0
      onStatus('open')
    }
    socket.onmessage = (message) => {
      try {
        const data: unknown = JSON.parse(String(message.data))
        if (isCocinaEvent(data)) onEvent(data)
      } catch {
        // Mensaje que no es JSON: se ignora
      }
    }
    socket.onclose = () => {
      socket = null
      if (cerrado) return
      onStatus('closed')
      // Reintento con espera creciente: 1 s, 2 s, 4 s… hasta 30 s
      const espera = Math.min(RETRY_BASE_MS * 2 ** intentos, RETRY_MAX_MS)
      intentos += 1
      retryTimer = setTimeout(conectar, espera)
    }
  }

  conectar()

  return () => {
    cerrado = true
    clearTimeout(retryTimer)
    socket?.close()
  }
}
