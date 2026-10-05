// Vistas de carta, mesas y reservas (A-07) en modo simulado.
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockServer } from '../api/mock/server'
import { toISODate } from '../utils/format'
import { renderApp } from './renderApp'

vi.mock('../config', () => ({ USE_MOCK: true, API_URL: 'http://api.test' }))

const TOKEN = { admin: 'mock-token-1', camarero: 'mock-token-2', cliente: 'mock-token-4' }
const manana = () => toISODate(new Date(Date.now() + 24 * 60 * 60 * 1000))

function loginComo(rol: keyof typeof TOKEN) {
  localStorage.setItem('restoapi.token', TOKEN[rol])
}

describe('Carta', () => {
  it('muestra la carta paginada', async () => {
    loginComo('cliente')
    const { user } = renderApp('/carta')
    expect(await screen.findByText('Croquetas de jamón')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2 · 16 platos')).toBeInTheDocument()
    expect(screen.queryByText('Café')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente →' }))
    expect(await screen.findByText('Café')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 2 · 16 platos')).toBeInTheDocument()
  })

  it('filtra por categoría', async () => {
    loginComo('camarero')
    const { user } = renderApp('/carta')
    await screen.findByRole('option', { name: 'Postres' })
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Postres')
    expect(await screen.findByText('Página 1 de 1 · 3 platos')).toBeInTheDocument()
    expect(screen.getByText('Tarta de queso')).toBeInTheDocument()
    expect(screen.queryByText('Croquetas de jamón')).not.toBeInTheDocument()
  })

  it('filtra solo los disponibles y por precio máximo', async () => {
    loginComo('camarero')
    const { user } = renderApp('/carta')
    expect(await screen.findByText('Gazpacho')).toBeInTheDocument()
    expect(screen.getAllByText('No disponible')).toHaveLength(2)

    await user.click(screen.getByLabelText('Solo disponibles'))
    expect(await screen.findByText('Página 1 de 2 · 14 platos')).toBeInTheDocument()
    expect(screen.queryByText('Gazpacho')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Precio máximo (€)'), '6')
    expect(await screen.findByText('Página 1 de 1 · 6 platos')).toBeInTheDocument()
  })

  it('muestra los alérgenos de cada plato', async () => {
    loginComo('cliente')
    renderApp('/carta')
    const croquetas = (await screen.findByText('Croquetas de jamón')).closest('li')!
    expect(within(croquetas).getByText('gluten')).toBeInTheDocument()
    expect(within(croquetas).getByText('lácteos')).toBeInTheDocument()
  })
})

describe('Mesas', () => {
  it('muestra la sala por zonas con el resumen de estados', async () => {
    loginComo('camarero')
    renderApp('/mesas')
    expect(await screen.findByRole('heading', { name: 'Terraza' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Interior' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Barra' })).toBeInTheDocument()
    expect(screen.getByText('Libre: 5')).toBeInTheDocument()
    expect(screen.getByText('Ocupada: 3')).toBeInTheDocument()
  })

  it('el camarero cambia el estado de una mesa', async () => {
    loginComo('camarero')
    const { user } = renderApp('/mesas')
    const select = await screen.findByLabelText('Estado de la mesa 1')
    await user.selectOptions(select, 'ocupada')

    expect(await screen.findByText('Ocupada: 4')).toBeInTheDocument()
    expect(screen.getByText('Libre: 4')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('Estado de la mesa 1')).toHaveValue('ocupada'))
  })

  it('el cliente no puede ver las mesas', async () => {
    loginComo('cliente')
    renderApp('/mesas')
    expect(await screen.findByRole('heading', { name: '403 · Sin acceso' })).toBeInTheDocument()
  })
})

describe('Reservas', () => {
  it('el personal ve las reservas del día', async () => {
    loginComo('camarero')
    renderApp('/reservas')
    expect(await screen.findByText('Cumpleaños, traen tarta')).toBeInTheDocument()
    // 4 reservas hoy + cabecera
    expect(screen.getAllByRole('row')).toHaveLength(5)
    expect(screen.queryByText('Mesa tranquila si es posible')).not.toBeInTheDocument() // es de mañana
  })

  it('crea una reserva eligiendo entre las mesas disponibles', async () => {
    loginComo('camarero')
    const { user } = renderApp('/reservas')
    await screen.findByText('Cumpleaños, traen tarta')

    await user.click(screen.getByRole('button', { name: '+ Nueva reserva' }))
    const form = screen.getByRole('form', { name: 'Nueva reserva' })
    fireEvent.change(within(form).getByLabelText('Fecha'), { target: { value: manana() } })
    fireEvent.change(within(form).getByLabelText('Hora'), { target: { value: '13:00' } })
    fireEvent.change(within(form).getByLabelText('Personas'), { target: { value: '4' } })
    await user.click(within(form).getByRole('button', { name: 'Ver mesas disponibles' }))

    // Solo mesas de 4 o más, sin la que está fuera de servicio; la más ajustada primero
    const mesa = await within(form).findByLabelText('Mesa')
    const opciones = within(mesa).getAllByRole('option').map((o) => o.textContent)
    expect(opciones[0]).toBe('Mesa 3 · Interior · hasta 4 personas')
    expect(opciones.some((o) => o?.startsWith('Mesa 8'))).toBe(false)
    expect(opciones.some((o) => o?.startsWith('Mesa 1 '))).toBe(false)

    await user.type(within(form).getByLabelText('Notas (opcional)'), 'Comida de empresa')
    await user.click(within(form).getByRole('button', { name: 'Confirmar reserva' }))

    expect(await screen.findByRole('status')).toHaveTextContent('a las 13:00, mesa 3')
    expect(await screen.findByText('Comida de empresa')).toBeInTheDocument()
  })

  it('no deja reservar hoy a una hora que ya ha pasado', async () => {
    // Las fechas anteriores a hoy ya las bloquea el navegador con min=hoy en el campo de fecha
    loginComo('camarero')
    const { user } = renderApp('/reservas')
    await user.click(await screen.findByRole('button', { name: '+ Nueva reserva' }))
    const form = screen.getByRole('form', { name: 'Nueva reserva' })
    expect(within(form).getByLabelText('Fecha')).toHaveAttribute('min', toISODate(new Date()))
    fireEvent.change(within(form).getByLabelText('Hora'), { target: { value: '00:00' } })
    await user.click(within(form).getByRole('button', { name: 'Ver mesas disponibles' }))
    expect(await within(form).findByRole('alert')).toHaveTextContent('No se puede reservar en una fecha u hora pasada')
  })

  it('cancela una reserva confirmada', async () => {
    loginComo('camarero')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderApp('/reservas')
    await user.click(await screen.findByRole('button', { name: 'Cancelar reserva de las 13:30' }))

    expect(await screen.findByRole('status')).toHaveTextContent('cancelada')
    await waitFor(() => expect(screen.getAllByText('Cancelada')).toHaveLength(2))
    expect(screen.queryByRole('button', { name: 'Cancelar reserva de las 13:30' })).not.toBeInTheDocument()
  })

  it('el cliente solo ve sus reservas', async () => {
    loginComo('cliente')
    renderApp('/reservas')
    expect(await screen.findByRole('heading', { name: 'Mis reservas' })).toBeInTheDocument()
    expect(await screen.findByText('Cumpleaños, traen tarta')).toBeInTheDocument()
    expect(screen.queryByText('Mesa tranquila si es posible')).not.toBeInTheDocument()
    // 2 reservas suyas (hoy y mañana) + cabecera, y sin filtro de fecha
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.queryByLabelText('Fecha')).not.toBeInTheDocument()
  })
})

describe('reglas de reserva del servidor simulado (como la API, HU-10)', () => {
  it('rechaza una reserva que se solapa en la misma mesa', async () => {
    loginComo('camarero')
    // La mesa 7 tiene reserva mañana a las 20:30 (90 min)
    await expect(
      mockServer.createReserva({ mesa_id: 7, fecha_hora: `${manana()}T20:00:00`, num_personas: 2 }),
    ).rejects.toThrow('La mesa 7 ya tiene una reserva en ese horario')
  })

  it('rechaza más personas que la capacidad de la mesa', async () => {
    loginComo('camarero')
    await expect(
      mockServer.createReserva({ mesa_id: 1, fecha_hora: `${manana()}T21:00:00`, num_personas: 4 }),
    ).rejects.toThrow('La mesa 1 es para 2 personas como máximo')
  })

  it('acepta una reserva justo cuando termina la anterior', async () => {
    loginComo('camarero')
    const reserva = await mockServer.createReserva({ mesa_id: 7, fecha_hora: `${manana()}T22:00:00`, num_personas: 2 })
    expect(reserva.estado).toBe('confirmada')
  })
})
