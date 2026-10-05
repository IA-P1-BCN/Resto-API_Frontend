// "Servidor" simulado: aplica las mismas reglas que la API (filtros, paginación,
// permisos por rol, solapamientos y capacidad) sobre los datos de db.ts.
import { mockUserFromToken } from '../mockAuth'
import { tokenStorage } from '../tokenStorage'
import type { Categoria, EstadoMesa, Mesa, Page, Plato, Reserva, ReservaCreate } from '../types'
import { db } from './db'

const DURACION_MIN = 90

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const start = (page - 1) * size
  return { items: items.slice(start, start + size), total: items.length, page, size }
}

function usuarioActual() {
  const user = mockUserFromToken(tokenStorage.get())
  if (!user) throw new Error('Sesión no válida')
  return user
}

function minutos(fechaHora: string): number {
  return new Date(fechaHora).getTime() / 60_000
}

function seSolapan(a: string, duracionA: number, b: string, duracionB: number): boolean {
  const inicioA = minutos(a)
  const inicioB = minutos(b)
  return inicioA < inicioB + duracionB && inicioB < inicioA + duracionA
}

function mesaLibreEn(mesaId: number, fechaHora: string, ignorarReservaId?: number): boolean {
  return !db.reservas.some(
    (r) =>
      r.mesa_id === mesaId &&
      r.id !== ignorarReservaId &&
      r.estado === 'confirmada' &&
      seSolapan(r.fecha_hora, r.duracion_min, fechaHora, DURACION_MIN),
  )
}

function conMesa(reserva: Reserva): Reserva {
  const mesa = db.mesas.find((m) => m.id === reserva.mesa_id)
  return { ...reserva, mesa: mesa && { numero: mesa.numero, ubicacion: mesa.ubicacion } }
}

export interface PlatosFiltro {
  categoriaId?: number
  soloDisponibles?: boolean
  precioMax?: number
  page?: number
  size?: number
}

export interface ReservasFiltro {
  /** YYYY-MM-DD */
  fecha?: string
}

export const mockServer = {
  async listCategorias(): Promise<Page<Categoria>> {
    await delay()
    const items = [...db.categorias].sort((a, b) => a.orden - b.orden)
    return paginate(items, 1, 100)
  },

  async listPlatos({ categoriaId, soloDisponibles, precioMax, page = 1, size = 12 }: PlatosFiltro): Promise<Page<Plato>> {
    await delay()
    const items = db.platos.filter(
      (p) =>
        (categoriaId === undefined || p.categoria_id === categoriaId) &&
        (!soloDisponibles || p.disponible) &&
        (precioMax === undefined || Number(p.precio) <= precioMax),
    )
    return paginate(items, page, size)
  },

  async listMesas(): Promise<Page<Mesa>> {
    await delay()
    return paginate([...db.mesas].sort((a, b) => a.numero - b.numero), 1, 100)
  },

  async updateMesaEstado(id: number, estado: EstadoMesa): Promise<Mesa> {
    await delay()
    const mesa = db.mesas.find((m) => m.id === id)
    if (!mesa) throw new Error('Mesa no encontrada')
    mesa.estado = estado
    return { ...mesa }
  },

  async listMesasDisponibles(fechaHora: string, personas: number): Promise<Mesa[]> {
    await delay()
    return db.mesas
      .filter((m) => m.estado !== 'fuera_servicio' && m.capacidad >= personas && mesaLibreEn(m.id, fechaHora))
      .sort((a, b) => a.capacidad - b.capacidad || a.numero - b.numero)
  },

  async listReservas({ fecha }: ReservasFiltro): Promise<Page<Reserva>> {
    await delay()
    const user = usuarioActual()
    const items = db.reservas
      // El cliente solo ve las suyas (matriz de permisos)
      .filter((r) => user.rol !== 'cliente' || r.usuario_id === user.id)
      .filter((r) => !fecha || r.fecha_hora.startsWith(fecha))
      .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
      .map(conMesa)
    return paginate(items, 1, 100)
  },

  async createReserva(data: ReservaCreate): Promise<Reserva> {
    await delay()
    const user = usuarioActual()
    const mesa = db.mesas.find((m) => m.id === data.mesa_id)
    if (!mesa) throw new Error('Mesa no encontrada')
    // Mismas reglas que la API (HU-10): 422 por capacidad, 409 por solapamiento
    if (data.num_personas > mesa.capacidad) {
      throw new Error(`La mesa ${mesa.numero} es para ${mesa.capacidad} personas como máximo`)
    }
    if (!mesaLibreEn(mesa.id, data.fecha_hora)) {
      throw new Error(`La mesa ${mesa.numero} ya tiene una reserva en ese horario`)
    }
    const reserva: Reserva = {
      id: db.nextReservaId++,
      usuario_id: user.id,
      mesa_id: mesa.id,
      fecha_hora: data.fecha_hora,
      duracion_min: DURACION_MIN,
      num_personas: data.num_personas,
      estado: 'confirmada',
      notas: data.notas?.trim() || null,
      creado_en: new Date().toISOString(),
    }
    db.reservas.push(reserva)
    return conMesa(reserva)
  },

  async cancelarReserva(id: number): Promise<Reserva> {
    await delay()
    const user = usuarioActual()
    const reserva = db.reservas.find((r) => r.id === id)
    if (!reserva || (user.rol === 'cliente' && reserva.usuario_id !== user.id)) {
      throw new Error('Reserva no encontrada')
    }
    if (reserva.estado !== 'confirmada') throw new Error('Solo se pueden cancelar reservas confirmadas')
    reserva.estado = 'cancelada'
    return conMesa(reserva)
  },
}
