import { describe, expect, it, vi } from 'vitest'
import { listPlatos } from '../api/menu'
import { listMesasDisponibles, updateMesaEstado } from '../api/mesas'
import { cancelarReserva, createReserva, listReservas } from '../api/reservas'
import { mockApi } from './fakeApi'

vi.mock('../config', () => ({ USE_MOCK: false, API_URL: 'http://api.test' }))

const pagina = (items: unknown[] = []) => ({ items, total: items.length, page: 1, size: 12 })

describe('servicios contra la API', () => {
  it('GET /platos con filtros y paginación', async () => {
    const requests = mockApi(() => ({ status: 200, data: pagina() }))
    await listPlatos({ categoriaId: 2, soloDisponibles: true, precioMax: 15, page: 3 })
    expect(requests[0].url).toBe('/platos')
    expect(requests[0].params).toEqual({ categoria_id: 2, disponible: true, precio_max: 15, page: 3, size: 12 })
  })

  it('GET /platos sin filtros no envía parámetros vacíos', async () => {
    const requests = mockApi(() => ({ status: 200, data: pagina() }))
    await listPlatos({})
    expect(requests[0].params).toEqual({ categoria_id: undefined, disponible: undefined, precio_max: undefined, page: 1, size: 12 })
  })

  it('PATCH /mesas/{id} con el nuevo estado', async () => {
    const requests = mockApi(() => ({ status: 200, data: {} }))
    await updateMesaEstado(4, 'ocupada')
    expect(requests[0].method).toBe('patch')
    expect(requests[0].url).toBe('/mesas/4')
    expect(JSON.parse(requests[0].data)).toEqual({ estado: 'ocupada' })
  })

  it('GET /mesas/disponibles con fecha_hora y personas', async () => {
    const requests = mockApi(() => ({ status: 200, data: [] }))
    await listMesasDisponibles('2026-10-08T21:00:00', 4)
    expect(requests[0].url).toBe('/mesas/disponibles')
    expect(requests[0].params).toEqual({ fecha_hora: '2026-10-08T21:00:00', personas: 4 })
  })

  it('GET /reservas por fecha', async () => {
    const requests = mockApi(() => ({ status: 200, data: pagina() }))
    await listReservas({ fecha: '2026-10-08' })
    expect(requests[0].url).toBe('/reservas')
    expect(requests[0].params).toEqual({ fecha: '2026-10-08', size: 100 })
  })

  it('POST /reservas y el error 409 de solapamiento llega con su detalle', async () => {
    const requests = mockApi(() => ({ status: 409, data: { detail: 'La mesa ya está reservada', code: 'reserva_solapada' } }))
    const reserva = { mesa_id: 3, fecha_hora: '2026-10-08T21:00:00', num_personas: 2, notas: 'Aniversario' }
    await expect(createReserva(reserva)).rejects.toMatchObject({ response: { status: 409 } })
    expect(requests[0].method).toBe('post')
    expect(JSON.parse(requests[0].data)).toEqual(reserva)
  })

  it('PATCH /reservas/{id}/cancelar', async () => {
    const requests = mockApi(() => ({ status: 200, data: {} }))
    await cancelarReserva(12)
    expect(requests[0].method).toBe('patch')
    expect(requests[0].url).toBe('/reservas/12/cancelar')
  })
})