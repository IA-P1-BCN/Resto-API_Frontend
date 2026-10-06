import type { EstadoPedido, Rol } from './types'

interface Transicion {
  a: EstadoPedido
  roles: Rol[]
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

export function transicionesPara(rol: Rol, estado: EstadoPedido): Transicion[] {
  return TRANSICIONES[estado].filter((t) => t.roles.includes(rol))
}

export function puedeCambiar(rol: Rol, de: EstadoPedido, a: EstadoPedido): boolean {
  return transicionesPara(rol, de).some((t) => t.a === a)
}

export const ESTADOS_COCINA: EstadoPedido[] = ['pendiente', 'en_cocina']

export const ESTADOS_ACTIVOS: EstadoPedido[] = ['pendiente', 'en_cocina', 'servido']