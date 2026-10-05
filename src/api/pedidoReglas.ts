// Ciclo de vida de un pedido: pendiente → en cocina → servido → pagado (o cancelado si aún no se ha empezado).
// Qué rol puede hacer cada cambio, según la matriz de permisos del plan (5.4).
import type { EstadoPedido, Rol } from './types'

interface Transicion {
  a: EstadoPedido
  roles: Rol[]
  /** Texto del botón. */
  accion: string
}

export const TRANSICIONES: Record<EstadoPedido, Transicion[]> = {
  pendiente: [
    { a: 'en_cocina', roles: ['admin', 'cocina'], accion: 'Empezar' },
    { a: 'cancelado', roles: ['admin', 'camarero'], accion: 'Cancelar' },
  ],
  en_cocina: [{ a: 'servido', roles: ['admin', 'cocina'], accion: 'Marcar servido' }],
  servido: [{ a: 'pagado', roles: ['admin', 'camarero'], accion: 'Marcar pagado' }],
  pagado: [],
  cancelado: [],
}

/** Cambios de estado que puede hacer un rol sobre un pedido en este estado. */
export function transicionesPara(rol: Rol, estado: EstadoPedido): Transicion[] {
  return TRANSICIONES[estado].filter((t) => t.roles.includes(rol))
}

export function puedeCambiar(rol: Rol, de: EstadoPedido, a: EstadoPedido): boolean {
  return transicionesPara(rol, de).some((t) => t.a === a)
}

/** Estados que cocina tiene que ver. */
export const ESTADOS_COCINA: EstadoPedido[] = ['pendiente', 'en_cocina']

/** Pedidos "abiertos" en sala. */
export const ESTADOS_ACTIVOS: EstadoPedido[] = ['pendiente', 'en_cocina', 'servido']
