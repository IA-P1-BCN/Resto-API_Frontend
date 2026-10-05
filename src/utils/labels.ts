import type { EstadoMesa, EstadoPedido, EstadoReserva, Ubicacion } from '../api/types'

export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  en_cocina: 'En cocina',
  servido: 'Servido',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
}

export const ESTADOS_PEDIDO = Object.keys(ESTADO_PEDIDO_LABEL) as EstadoPedido[]

export const UBICACION_LABEL: Record<Ubicacion, string> = {
  interior: 'Interior',
  terraza: 'Terraza',
  barra: 'Barra',
}

export const ESTADO_MESA_LABEL: Record<EstadoMesa, string> = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  fuera_servicio: 'Fuera de servicio',
}

export const ESTADO_RESERVA_LABEL: Record<EstadoReserva, string> = {
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_show: 'No presentado',
}

export const UBICACIONES = Object.keys(UBICACION_LABEL) as Ubicacion[]
export const ESTADOS_MESA = Object.keys(ESTADO_MESA_LABEL) as EstadoMesa[]
