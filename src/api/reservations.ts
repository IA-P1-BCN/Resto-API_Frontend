import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer, type ReservationFilters } from './mock/server'
import type { Page, Reservation, ReservationCreate, ReservationUpdate } from './types'

export type { ReservationFilters }

export async function listReservations(filters: ReservationFilters = {}): Promise<Reservation[]> {
  if (USE_MOCK) return (await mockServer.listReservations(filters)).items
  const { data } = await api.get<Page<Reservation>>('/reservations', { params: { date: filters.date, size: 100 } })
  return data.items
}

export async function createReservation(reservation: ReservationCreate): Promise<Reservation> {
  if (USE_MOCK) return mockServer.createReservation(reservation)
  const { data } = await api.post<Reservation>('/reservations', reservation)
  return data
}

export async function cancelReservation(id: number): Promise<Reservation> {
  if (USE_MOCK) return mockServer.cancelReservation(id)
  const { data } = await api.patch<Reservation>(`/reservations/${id}/cancel`)
  return data
}

export async function updateReservation(id: number, changes: ReservationUpdate): Promise<Reservation> {
  if (USE_MOCK) return mockServer.updateReservation(id, changes)
  const { data } = await api.patch<Reservation>(`/reservations/${id}`, changes)
  return data
}

export async function deleteReservation(id: number): Promise<void> {
  if (USE_MOCK) return mockServer.deleteReservation(id)
  await api.delete(`/reservations/${id}`)
}
