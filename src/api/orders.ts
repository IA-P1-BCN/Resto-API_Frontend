import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer, type OrderFilters } from './mock/server'
import type { Order, OrderCreate, OrderStatus } from './types'

export type { OrderFilters }

/**
 * GET /orders/ (sin paginar). La API filtra por un solo estado, así que con
 * varios se hace una petición por estado y se juntan los resultados.
 */
export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  if (USE_MOCK) return mockServer.listOrders(filters)
  const fetchByStatus = async (status?: OrderStatus) => {
    const { data } = await api.get<Order[]>('/orders/', { params: { status, table_id: filters.table_id } })
    return data
  }
  const lists = filters.statuses ? await Promise.all(filters.statuses.map(fetchByStatus)) : [await fetchByStatus()]
  return lists.flat().sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)
}

/** POST /orders/ → 409 si algún plato no está disponible. */
export async function createOrder(order: OrderCreate): Promise<Order> {
  if (USE_MOCK) return mockServer.createOrder(order)
  const { data } = await api.post<Order>('/orders/', order)
  return data
}

/** PATCH /orders/{id}/status → 409 si la transición no es válida. */
export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  if (USE_MOCK) return mockServer.updateOrderStatus(id, status)
  const { data } = await api.patch<Order>(`/orders/${id}/status`, { status })
  return data
}
