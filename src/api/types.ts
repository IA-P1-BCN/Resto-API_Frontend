// Contrato provisional con la API, según el modelo de datos del plan (sección 3).
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

/** Formato de paginación común a todos los listados (plan, sección 5.2). */
export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
}

// --- Menú (HU-06) ---

export interface Categoria {
  id: number
  nombre: string
  orden: number
}

export interface Plato {
  id: number
  categoria_id: number
  nombre: string
  descripcion: string | null
  /** NUMERIC(8,2): Pydantic lo puede serializar como texto ("12.50"). */
  precio: number | string
  /** Lista separada por comas: "gluten,lácteos". */
  alergenos: string | null
  disponible: boolean
}

// --- Mesas (HU-09) ---

export type Ubicacion = 'interior' | 'terraza' | 'barra'
export type EstadoMesa = 'libre' | 'ocupada' | 'reservada' | 'fuera_servicio'

export interface Mesa {
  id: number
  numero: number
  capacidad: number
  ubicacion: Ubicacion
  estado: EstadoMesa
}

// --- Reservas (HU-10) ---

export type EstadoReserva = 'confirmada' | 'cancelada' | 'completada' | 'no_show'

export interface Reserva {
  id: number
  usuario_id: number
  mesa_id: number
  /** TIMESTAMP sin zona horaria: "2026-10-07T21:00:00". */
  fecha_hora: string
  duracion_min: number
  num_personas: number
  estado: EstadoReserva
  notas: string | null
  creado_en: string
  /** Si la API anida la mesa, se usa su número; si no, se muestra mesa_id. */
  mesa?: Pick<Mesa, 'numero' | 'ubicacion'>
}

export interface ReservaCreate {
  mesa_id: number
  fecha_hora: string
  num_personas: number
  notas?: string
}

// --- Pedidos (HU-07 / HU-08) ---

export type EstadoPedido = 'pendiente' | 'en_cocina' | 'servido' | 'pagado' | 'cancelado'

/** Fila de detalle_pedido. */
export interface LineaPedido {
  id: number
  plato_id: number
  cantidad: number
  /** Precio congelado al crear la línea. */
  precio_unitario: number | string
  notas: string | null
  /** Si la API anida el plato, se usa su nombre. */
  plato?: Pick<Plato, 'nombre'>
}

export interface Pedido {
  id: number
  mesa_id: number
  camarero_id: number
  estado: EstadoPedido
  /** Σ(cantidad × precio_unitario), lo calcula la API. */
  total: number | string
  creado_en: string
  actualizado_en: string | null
  lineas: LineaPedido[]
  mesa?: Pick<Mesa, 'numero'>
}

export interface PedidoCreate {
  mesa_id: number
  lineas: { plato_id: number; cantidad: number; notas?: string }[]
}

/** Mensaje del WebSocket /ws/cocina (plan, sección 5.2). */
export interface CocinaEvent {
  event: 'pedido_creado' | 'pedido_actualizado'
  pedido: Pedido
}
