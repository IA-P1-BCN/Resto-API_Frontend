
export type Rol = 'admin' | 'camarero' | 'cocina' | 'cliente'

export interface Usuario {
  id: number
  nombre: string
  email: string
  telefono?: string | null
  rol: Rol
  activo: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface ApiErrorBody {
  detail?: unknown
  code?: string
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
}


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
  precio: number | string
  alergenos: string | null
  disponible: boolean
}


export type Ubicacion = 'interior' | 'terraza' | 'barra'
export type EstadoMesa = 'libre' | 'ocupada' | 'reservada' | 'fuera_servicio'

export interface Mesa {
  id: number
  numero: number
  capacidad: number
  ubicacion: Ubicacion
  estado: EstadoMesa
}


export type EstadoReserva = 'confirmada' | 'cancelada' | 'completada' | 'no_show'

export interface Reserva {
  id: number
  usuario_id: number
  mesa_id: number
  fecha_hora: string
  duracion_min: number
  num_personas: number
  estado: EstadoReserva
  notas: string | null
  creado_en: string
  mesa?: Pick<Mesa, 'numero' | 'ubicacion'>
}

export interface ReservaCreate {
  mesa_id: number
  fecha_hora: string
  num_personas: number
  notas?: string
}


export type EstadoPedido = 'pendiente' | 'en_cocina' | 'servido' | 'pagado' | 'cancelado'

export interface LineaPedido {
  id: number
  plato_id: number
  cantidad: number
  precio_unitario: number | string
  notas: string | null
  plato?: Pick<Plato, 'nombre'>
}

export interface Pedido {
  id: number
  mesa_id: number
  camarero_id: number
  estado: EstadoPedido
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

export interface CocinaEvent {
  event: 'pedido_creado' | 'pedido_actualizado'
  pedido: Pedido
}