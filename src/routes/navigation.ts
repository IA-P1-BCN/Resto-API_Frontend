import type { Rol } from '../api/types'

export interface NavItem {
  path: string
  label: string
  roles: Rol[]
  labelByRol?: Partial<Record<Rol, string>>
  description: string
  hu?: string
}

const TODOS: Rol[] = ['admin', 'camarero', 'cocina', 'cliente']

export const NAV_ITEMS: NavItem[] = [
  { path: '/carta', label: 'Carta', roles: TODOS, description: 'Categorías, platos, precios y alérgenos', hu: 'HU-13' },
  { path: '/mesas', label: 'Mesas', roles: ['admin', 'camarero'], description: 'Estado de la sala en tiempo real', hu: 'HU-13' },
  {
    path: '/reservas',
    label: 'Reservas',
    labelByRol: { cliente: 'Mis reservas' },
    roles: ['admin', 'camarero', 'cliente'],
    description: 'Reservas por fecha y hora',
    hu: 'HU-13',
  },
  { path: '/pedidos', label: 'Pedidos', roles: ['admin', 'camarero'], description: 'Comandas por mesa', hu: 'HU-13' },
  { path: '/cocina', label: 'Cocina', roles: ['admin', 'cocina'], description: 'Pedidos en tiempo real para cocina', hu: 'HU-13' },
  { path: '/facturas', label: 'Facturas', roles: ['admin', 'camarero'], description: 'Facturas y exportación CSV' },
  { path: '/estadisticas', label: 'Estadísticas', roles: ['admin'], description: 'Ventas y platos más vendidos' },
  { path: '/usuarios', label: 'Usuarios', roles: ['admin'], description: 'Personal y clientes' },
]

export const ROL_LABEL: Record<Rol, string> = {
  admin: 'Administración',
  camarero: 'Sala',
  cocina: 'Cocina',
  cliente: 'Cliente',
}

export function navItemsFor(rol: Rol): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(rol))
}

export function labelFor(item: NavItem, rol: Rol): string {
  return item.labelByRol?.[rol] ?? item.label
}