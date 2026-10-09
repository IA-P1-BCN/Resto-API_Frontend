import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer, type ReservationFilters } from './mock/server'
import type { Page, Reservation, ReservationCreate } from './types'

export type { ReservationFilters }

/** GET /reservations (el cliente solo recibe las suyas). `date` filtra por día (AAAA-MM-DD). */
export async function listReservations(filters: ReservationFilters = {}): Promise<Reservation[]> {
  if (USE_MOCK) return (await mockServer.listReservations(filters)).items
  const { data } = await api.get<Page<Reservation>>('/reservations', { params: { date: filters.date, size: 100 } })
  return data.items
}

/** POST /reservations → 409 si se solapa con otra, 422 si supera la capacidad de la mesa. */
export async function createReservation(reservation: ReservationCreate): Promise<Reservation> {
  if (USE_MOCK) return mockServer.createReservation(reservation)
  const { data } = await api.post<Reservation>('/reservations', reservation)
  return data
}

/** PATCH /reservations/{id}/cancel */
export async function cancelReservation(id: number): Promise<Reservation> {
  if (USE_MOCK) return mockServer.cancelReservation(id)
  const { data } = await api.patch<Reservation>(`/reservations/${id}/cancel`)
  return data
}
