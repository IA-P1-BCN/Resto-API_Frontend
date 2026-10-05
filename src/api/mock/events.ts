// Canal de eventos del modo simulado: hace de WebSocket /ws/cocina dentro del navegador.
import type { CocinaEvent } from '../types'

type Listener = (event: CocinaEvent) => void

const listeners = new Set<Listener>()

export const mockEvents = {
  emit(event: CocinaEvent) {
    // Asíncrono, como un mensaje que llega por la red
    setTimeout(() => listeners.forEach((listener) => listener(structuredClone(event))), 0)
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
