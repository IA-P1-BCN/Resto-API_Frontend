// Textos en castellano para los valores que devuelve la API.
import type { OrderStatus, ReservationStatus, TableLocation, TableStatus } from '../api/types'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  in_kitchen: 'En cocina',
  served: 'Servido',
  paid: 'Pagado',
  cancelled: 'Cancelado',
}

export const TABLE_LOCATION_LABEL: Record<TableLocation, string> = {
  indoor: 'Interior',
  terrace: 'Terraza',
  bar: 'Barra',
}

export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  available: 'Libre',
  occupied: 'Ocupada',
  reserved: 'Reservada',
  out_of_service: 'Fuera de servicio',
}

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No presentado',
}

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]
export const TABLE_LOCATIONS = Object.keys(TABLE_LOCATION_LABEL) as TableLocation[]
export const TABLE_STATUSES = Object.keys(TABLE_STATUS_LABEL) as TableStatus[]
