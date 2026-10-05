import { USE_MOCK } from '../config'
import { api } from './client'
import { mockAuth } from './mockAuth'
import { tokenStorage } from './tokenStorage'
import type { LoginResponse, Usuario } from './types'

/**
 * POST /auth/login → token JWT.
 * Se envía como formulario OAuth2 (username = email), el formato estándar de FastAPI,
 * que además permite usar el botón "Authorize" de Swagger.
 */
export async function login(email: string, password: string): Promise<string> {
  if (USE_MOCK) return mockAuth.login(email, password)
  const body = new URLSearchParams({ username: email.trim(), password })
  const { data } = await api.post<LoginResponse>('/auth/login', body)
  return data.access_token
}

/** GET /auth/me → usuario de la sesión actual. */
export async function fetchMe(): Promise<Usuario> {
  if (USE_MOCK) return mockAuth.me(tokenStorage.get())
  const { data } = await api.get<Usuario>('/auth/me')
  return data
}

/** GET /health → despierta la API en Render al cargar la web (sin esperar respuesta). */
export function pingHealth(): void {
  if (USE_MOCK) return
  api.get('/health').catch(() => {
    // Si falla, la primera petición real mostrará el error
  })
}
