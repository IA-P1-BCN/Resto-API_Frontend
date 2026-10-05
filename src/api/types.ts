// Contrato provisional con la API (HU-03 / HU-04).
// Cuando exista el backend se sustituirá por los tipos generados con `npm run gen:api`.

export type Rol = 'admin' | 'camarero' | 'cocina' | 'cliente'

export interface Usuario {
  id: number
  nombre: string
  email: string
  telefono?: string | null
  rol: Rol
  activo: boolean
}

/** Respuesta de POST /auth/login (formato OAuth2 de FastAPI). */
export interface LoginResponse {
  access_token: string
  token_type: string
}

/** Formato de error estándar de la API: {"detail": str, "code": str}. */
export interface ApiErrorBody {
  detail?: unknown
  code?: string
}
