const KEY = 'restoapi.token'

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(KEY, token)
    } catch {
      // Sin almacenamiento, la sesión dura lo que la pestaña
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // Nada que limpiar
    }
  },
}
