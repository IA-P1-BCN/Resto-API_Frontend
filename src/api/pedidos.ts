import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer, type PedidosFiltro } from './mock/server'
import type { EstadoPedido, Page, Pedido, PedidoCreate } from './types'

export type { PedidosFiltro }

/** GET /pedidos?estado=…&estado=…&mesa_id */
export async function listPedidos(filtro: PedidosFiltro = {}): Promise<Pedido[]> {
  if (USE_MOCK) return (await mockServer.listPedidos(filtro)).items
  const { data } = await api.get<Page<Pedido>>('/pedidos', {
    params: { estado: filtro.estados, mesa_id: filtro.mesaId, size: 100 },
  })
  return data.items
}

/** POST /pedidos — 409 si algún plato no está disponible. */
export async function createPedido(pedido: PedidoCreate): Promise<Pedido> {
  if (USE_MOCK) return mockServer.createPedido(pedido)
  const { data } = await api.post<Pedido>('/pedidos', pedido)
  return data
}

/** PATCH /pedidos/{id}/estado */
export async function updatePedidoEstado(id: number, estado: EstadoPedido): Promise<Pedido> {
  if (USE_MOCK) return mockServer.updatePedidoEstado(id, estado)
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/estado`, { estado })
  return data
}
