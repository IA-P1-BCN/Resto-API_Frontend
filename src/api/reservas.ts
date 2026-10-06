import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer, type ReservasFiltro } from './mock/server'
import type { Page, Reserva, ReservaCreate } from './types'

export async function listReservas(filtro: ReservasFiltro = {}): Promise<Reserva[]> {
  if (USE_MOCK) return (await mockServer.listReservas(filtro)).items
  const { data } = await api.get<Page<Reserva>>('/reservas', { params: { fecha: filtro.fecha, size: 100 } })
  return data.items
}

export async function createReserva(reserva: ReservaCreate): Promise<Reserva> {
  if (USE_MOCK) return mockServer.createReserva(reserva)
  const { data } = await api.post<Reserva>('/reservas', reserva)
  return data
}

export async function cancelarReserva(id: number): Promise<Reserva> {
  if (USE_MOCK) return mockServer.cancelarReserva(id)
  const { data } = await api.patch<Reserva>(`/reservas/${id}/cancelar`)
  return data
}