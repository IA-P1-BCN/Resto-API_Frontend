// Contrato con la API (HU-03 / HU-04 / HU-05): mismos nombres que devuelve el backend.
// Se puede regenerar a partir del OpenAPI con `npm run gen:api`.

export type Role = 'admin' | 'waiter' | 'kitchen' | 'customer'

/** Usuario tal como lo devuelve GET /auth/me (UserOut). */
export interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  role: Role
  is_active: boolean
  created_at?: string
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
