import { API_URL, USE_MOCK } from '../config'
import { mockEvents } from './mock/events'
import { tokenStorage } from './tokenStorage'
import type { KitchenEvent } from './types'

export type ConnectionStatus = 'connecting' | 'open' | 'closed'

interface Options {
  onEvent: (event: KitchenEvent) => void
  onStatus: (status: ConnectionStatus) => void
}

const RETRY_BASE_MS = 1000
const RETRY_MAX_MS = 30_000

export function kitchenSocketUrl(): string {
  const url = new URL('/ws/kitchen', API_URL)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const token = tokenStorage.get()
  if (token) url.searchParams.set('token', token)
  return url.toString()
}

function isKitchenEvent(data: unknown): data is KitchenEvent {
  const e = data as Partial<KitchenEvent> | null
  return (
    !!e &&
    (e.event === 'order_created' || e.event === 'order_status_changed') &&
    typeof e.order === 'object' &&
    e.order !== null &&
    typeof e.order.id === 'number' &&
    typeof e.order.status === 'string'
  )
}

export function connectKitchen({ onEvent, onStatus }: Options): () => void {
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
  let attempts = 0
  let stopped = false

  const connect = () => {
    onStatus('connecting')
    socket = new WebSocket(kitchenSocketUrl())
    socket.onopen = () => {
      attempts = 0
      onStatus('open')
    }
    socket.onmessage = (message) => {
      try {
        const data: unknown = JSON.parse(String(message.data))
        if (isKitchenEvent(data)) onEvent(data)
      } catch {
        // Mensaje que no es JSON: se ignora
      }
    }
    socket.onclose = () => {
      socket = null
      if (stopped) return
      onStatus('closed')
      const wait = Math.min(RETRY_BASE_MS * 2 ** attempts, RETRY_MAX_MS)
      attempts += 1
      retryTimer = setTimeout(connect, wait)
    }
  }

  connect()

  return () => {
    stopped = true
    clearTimeout(retryTimer)
    socket?.close()
  }
}
