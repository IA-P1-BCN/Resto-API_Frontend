import { USE_MOCK } from '../config'
import { api } from './client'
import { mockServer, type ReservationFilters } from './mock/server'
import type { Page, Reservation, ReservationCreate, ReservationUpdate } from './types'

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

/** PATCH /reservations/{id} → revalida aforo (422) y solapamiento (409) si cambian mesa, hora o personas. */
export async function updateReservation(id: number, changes: ReservationUpdate): Promise<Reservation> {
  if (USE_MOCK) return mockServer.updateReservation(id, changes)
  const { data } = await api.patch<Reservation>(`/reservations/${id}`, changes)
  return data
}

/** DELETE /reservations/{id}: la borra del todo (para conservar el historial, mejor cancelarla). */
export async function deleteReservation(id: number): Promise<void> {
  if (USE_MOCK) return mockServer.deleteReservation(id)
  await api.delete(`/reservations/${id}`)
}
