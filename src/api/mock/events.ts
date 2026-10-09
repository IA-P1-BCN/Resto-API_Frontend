import type { KitchenEvent } from '../types'

type Listener = (event: KitchenEvent) => void

const listeners = new Set<Listener>()

export const mockEvents = {
  emit(event: KitchenEvent) {
    setTimeout(() => listeners.forEach((listener) => listener(structuredClone(event))), 0)
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
