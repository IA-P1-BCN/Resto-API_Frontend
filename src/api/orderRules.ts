// Estados de un pedido (HU-07 / HU-08). La API valida el orden de los estados
// (409 si no es válido); aquí además se decide qué botón ve cada rol.
import type { OrderStatus, Role } from './types'

/** Cambios de estado que acepta la API (igual que VALID_TRANSITIONS del backend). */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['in_kitchen', 'cancelled'],
  in_kitchen: ['served', 'cancelled'],
  served: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
}

export interface Transition {
  to: OrderStatus
  roles: Role[]
  action: string
}

/** Botones de cada estado: cocina prepara y sirve; sala cancela y cobra. */
export const TRANSITIONS: Record<OrderStatus, Transition[]> = {
  pending: [
    { to: 'in_kitchen', roles: ['admin', 'kitchen'], action: 'Empezar' },
    { to: 'cancelled', roles: ['admin', 'waiter'], action: 'Cancelar' },
  ],
  in_kitchen: [{ to: 'served', roles: ['admin', 'kitchen'], action: 'Marcar servido' }],
  served: [{ to: 'paid', roles: ['admin', 'waiter'], action: 'Marcar pagado' }],
  paid: [],
  cancelled: [],
}

export function transitionsFor(role: Role, status: OrderStatus): Transition[] {
  return TRANSITIONS[status].filter((t) => t.roles.includes(role))
}

/** Pedidos que cocina tiene que preparar. */
export const KITCHEN_STATUSES: OrderStatus[] = ['pending', 'in_kitchen']

/** Pedidos en curso en sala. */
export const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'in_kitchen', 'served']
