import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer } from './mock/server'
import type { EstadoMesa, Mesa, Page } from './types'

/** GET /mesas */
export async function listMesas(): Promise<Mesa[]> {
  if (USE_MOCK) return (await mockServer.listMesas()).items
  const { data } = await api.get<Page<Mesa>>('/mesas', { params: { size: 100 } })
  return data.items
}

/** PATCH /mesas/{id} con el nuevo estado (el camarero puede cambiarlo). */
export async function updateMesaEstado(id: number, estado: EstadoMesa): Promise<Mesa> {
  if (USE_MOCK) return mockServer.updateMesaEstado(id, estado)
  const { data } = await api.patch<Mesa>(`/mesas/${id}`, { estado })
  return data
}

/** GET /mesas/disponibles?fecha_hora&personas (HU-18) */
export async function listMesasDisponibles(fechaHora: string, personas: number): Promise<Mesa[]> {
  if (USE_MOCK) return mockServer.listMesasDisponibles(fechaHora, personas)
  const { data } = await api.get<Mesa[]>('/mesas/disponibles', { params: { fecha_hora: fechaHora, personas } })
  return data
}
