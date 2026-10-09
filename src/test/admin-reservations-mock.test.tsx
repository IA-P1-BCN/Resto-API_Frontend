import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { db } from '../api/mock/db'
import { toISODate } from '../utils/format'
import { renderApp } from './renderApp'

vi.mock('../config', () => ({ USE_MOCK: true, API_URL: 'http://api.test' }))

const TOKEN = { admin: 'mock-token-1', waiter: 'mock-token-2', customer: 'mock-token-4' }
const tomorrow = () => toISODate(new Date(Date.now() + 24 * 60 * 60 * 1000))

function loginAs(role: keyof typeof TOKEN) {
  localStorage.setItem('restoapi.token', TOKEN[role])
}

async function openEdit(user: ReturnType<typeof renderApp>['user'], hhmm: string) {
  await user.click(await screen.findByRole('button', { name: `Editar reserva de las ${hhmm}` }))
  return screen.getByRole('form', { name: `Editar reserva de las ${hhmm}` })
}

describe('Reservas: edición y borrado (personal)', () => {
  it('el admin cambia las personas y las notas de una reserva', async () => {
    loginAs('admin')
    const { user } = renderApp('/reservas')
    const form = await openEdit(user, '13:30')
    const partySize = within(form).getByLabelText('Personas')
    expect(partySize).toHaveValue(3)

    await user.clear(partySize)
    await user.type(partySize, '4')
    await user.type(within(form).getByLabelText('Notas (opcional)'), 'Trona')
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Reserva guardada')
    expect(await screen.findByText('Trona')).toBeInTheDocument()
    expect(db.reservations.find((r) => r.id === 2)).toMatchObject({ party_size: 4, notes: 'Trona' })
  })

  it('no deja poner más personas de las que caben en la mesa', async () => {
    loginAs('admin')
    const { user } = renderApp('/reservas')
    const form = await openEdit(user, '13:30')
    const partySize = within(form).getByLabelText('Personas')
    await user.clear(partySize)
    await user.type(partySize, '5')
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))

    expect(await within(form).findByRole('alert')).toHaveTextContent('La mesa 4 es para 4 personas como máximo')
    expect(db.reservations.find((r) => r.id === 2)!.party_size).toBe(3)
  })

  it('mueve una reserva a otro día y la lista pasa a ese día', async () => {
    loginAs('waiter')
    const { user } = renderApp('/reservas')
    const form = await openEdit(user, '13:30')
    fireEvent.change(within(form).getByLabelText('Fecha'), { target: { value: tomorrow() } })
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Reserva guardada')
    expect(screen.getByLabelText('Fecha')).toHaveValue(tomorrow())
    expect(await screen.findByText('Mesa tranquila si es posible')).toBeInTheDocument()
    expect(db.reservations.find((r) => r.id === 2)!.reserved_at).toBe(`${tomorrow()}T13:30:00`)
  })

  it('no deja mover una reserva a una mesa y hora ya ocupadas', async () => {
    loginAs('admin')
    const { user } = renderApp('/reservas')
    fireEvent.change(await screen.findByLabelText('Fecha'), { target: { value: tomorrow() } })
    const form = await openEdit(user, '14:00')
    fireEvent.change(within(form).getByLabelText('Hora'), { target: { value: '20:00' } })
    await within(form).findByRole('option', { name: 'Mesa 7 · Terraza · hasta 4 personas' })
    await user.selectOptions(within(form).getByLabelText('Mesa'), 'Mesa 7 · Terraza · hasta 4 personas')
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))

    expect(await within(form).findByRole('alert')).toHaveTextContent('La mesa 7 ya tiene una reserva en ese horario')
  })

  it('avisa si se guarda sin cambiar nada', async () => {
    loginAs('admin')
    const { user } = renderApp('/reservas')
    const form = await openEdit(user, '13:30')
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    expect(await within(form).findByRole('alert')).toHaveTextContent('No has cambiado nada')
  })

  it('borra una reserva tras confirmarlo', async () => {
    loginAs('admin')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderApp('/reservas')
    await user.click(await screen.findByRole('button', { name: 'Borrar reserva de las 13:30' }))

    expect(await screen.findByRole('status')).toHaveTextContent('borrada')
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Borrar reserva de las 13:30' })).not.toBeInTheDocument())
    expect(db.reservations.some((r) => r.id === 2)).toBe(false)
  })

  it('el cliente no puede editar ni borrar, solo cancelar', async () => {
    loginAs('customer')
    renderApp('/reservas')
    expect(await screen.findByText('Cumpleaños, traen tarta')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Editar reserva/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Borrar reserva/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Cancelar reserva/ }).length).toBeGreaterThan(0)
  })
})
