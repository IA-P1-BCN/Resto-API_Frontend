import type { CocinaEvent } from '../types'

type Listener = (event: CocinaEvent) => void

const listeners = new Set<Listener>()

export const mockEvents = {
  emit(event: CocinaEvent) {
    setTimeout(() => listeners.forEach((listener) => listener(structuredClone(event))), 0)
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}