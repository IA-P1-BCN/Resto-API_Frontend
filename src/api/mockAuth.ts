// Usuarios de prueba para el modo simulado (VITE_USE_MOCK=true).
// Permite trabajar en el frontend antes de que exista el login real (HU-04).
import type { Usuario } from './types'

export const MOCK_PASSWORD = 'demo1234'

export const MOCK_USERS: Usuario[] = [
  { id: 1, nombre: 'Admin Demo', email: 'admin@restoapi.dev', rol: 'admin', activo: true },
  { id: 2, nombre: 'Camarero Demo', email: 'camarero@restoapi.dev', rol: 'camarero', activo: true },
  { id: 3, nombre: 'Cocina Demo', email: 'cocina@restoapi.dev', rol: 'cocina', activo: true },
  { id: 4, nombre: 'Cliente Demo', email: 'cliente@restoapi.dev', rol: 'cliente', activo: true },
]

const TOKEN_PREFIX = 'mock-token-'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockAuth = {
  async login(email: string, password: string): Promise<string> {
    await delay(400)
    const user = MOCK_USERS.find((u) => u.email === email.trim().toLowerCase())
    if (!user || password !== MOCK_PASSWORD) throw new Error('Email o contraseña incorrectos')
    return `${TOKEN_PREFIX}${user.id}`
  },
  async me(token: string | null): Promise<Usuario> {
    await delay(200)
    const id = Number(token?.replace(TOKEN_PREFIX, ''))
    const user = MOCK_USERS.find((u) => u.id === id)
    if (!user) throw new Error('Sesión no válida')
    return user
  },
}
