// Contrato con la API (HU-03 a HU-10): mismos nombres que devuelve el backend.
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

/** Página de los listados paginados (`?page&size`, size ≤ 100). */
export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
}

// --- Carta (HU-06) ---

export interface Category {
  id: number
  name: string
  sort_order: number
}

/** Los importes llegan como string (Decimal de la API), p. ej. "8.50". */
export interface Dish {
  id: number
  category_id: number
  name: string
  description: string | null
  price: string
  /** Lista separada por comas, p. ej. "gluten,lácteos". */
  allergens: string | null
  is_available: boolean
}

// --- Mesas (HU-09 / HU-18) ---

export type TableLocation = 'indoor' | 'terrace' | 'bar'
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'out_of_service'

export interface DiningTable {
  id: number
  number: number
  capacity: number
  location: TableLocation
  status: TableStatus
}

// --- Reservas (HU-10) ---

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show'

/** `reserved_at` va sin zona horaria: es la hora local del restaurante. */
export interface Reservation {
  id: number
  user_id: number
  table_id: number
  reserved_at: string
  duration_min: number
  ends_at: string
  party_size: number
  status: ReservationStatus
  notes: string | null
  created_at: string | null
}

export interface ReservationCreate {
  table_id: number
  reserved_at: string
  party_size: number
  duration_min?: number
  notes?: string
}

/** Edición parcial (PATCH): solo se envían los campos que cambian. Para cancelar hay otro endpoint. */
export interface ReservationUpdate {
  table_id?: number
  reserved_at?: string
  party_size?: number
  notes?: string | null
  status?: Exclude<ReservationStatus, 'cancelled'>
}

// --- Pedidos (HU-07 / HU-08) ---

export type OrderStatus = 'pending' | 'in_kitchen' | 'served' | 'paid' | 'cancelled'

export interface OrderItem {
  id: number
  dish_id: number
  quantity: number
  unit_price: string
  notes: string | null
}

/** `created_at` y `updated_at` los pone la base de datos, en UTC y sin zona. */
export interface Order {
  id: number
  table_id: number
  waiter_id: number | null
  status: OrderStatus
  total: string
  created_at: string
  updated_at: string | null
  items: OrderItem[]
}

export interface OrderCreate {
  table_id: number
  items: { dish_id: number; quantity: number; notes?: string }[]
}

/**
 * Mensaje del WebSocket de cocina (`/ws/kitchen`, HU-08). El pedido llega
 * incompleto (sin `created_at` ni notas; `order_status_changed` tampoco trae las
 * líneas), así que solo se usan `id` y `status` y el resto se pide por HTTP.
 */
export interface KitchenEvent {
  event: 'order_created' | 'order_status_changed'
  order: Pick<Order, 'id' | 'status'> & Partial<Order>
}
