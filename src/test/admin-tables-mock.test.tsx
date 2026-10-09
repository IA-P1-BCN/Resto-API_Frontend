// Gestión de mesas por el admin en modo simulado.
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { db } from '../api/mock/db'
import { renderApp } from './renderApp'

vi.mock('../config', () => ({ USE_MOCK: true, API_URL: 'http://api.test' }))

const TOKEN = { admin: 'mock-token-1', waiter: 'mock-token-2' }

function loginAs(role: keyof typeof TOKEN) {
  localStorage.setItem('restoapi.token', TOKEN[role])
}

describe('Mesas: gestión (admin)', () => {
  it('el admin crea una mesa nueva con el siguiente número libre', async () => {
    loginAs('admin')
    const { user } = renderApp('/mesas')
    await user.click(await screen.findByRole('button', { name: '+ Nueva mesa' }))
    const form = screen.getByRole('form', { name: 'Nueva mesa' })
    expect(within(form).getByLabelText('Número')).toHaveValue(11)

    const capacity = within(form).getByLabelText('Capacidad (personas)')
    await user.clear(capacity)
    await user.type(capacity, '6')
    await user.selectOptions(within(form).getByLabelText('Zona'), 'Terraza')
    await user.click(within(form).getByRole('button', { name: 'Crear mesa' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Mesa 11 creada.')
    const terrace = screen.getByRole('heading', { name: 'Terraza' }).closest('section')!
    expect(await within(terrace).findByText('Mesa 11')).toBeInTheDocument()
    expect(db.tables.find((t) => t.number === 11)).toMatchObject({ capacity: 6, location: 'terrace', status: 'available' })
  })

  it('no deja crear una mesa con un número que ya existe', async () => {
    loginAs('admin')
    const { user } = renderApp('/mesas')
    await user.click(await screen.findByRole('button', { name: '+ Nueva mesa' }))
    const form = screen.getByRole('form', { name: 'Nueva mesa' })
    const number = within(form).getByLabelText('Número')
    await user.clear(number)
    await user.type(number, '3')
    await user.click(within(form).getByRole('button', { name: 'Crear mesa' }))

    expect(await within(form).findByRole('alert')).toHaveTextContent('Ya existe la mesa 3')
  })

  it('el admin edita la capacidad y la zona de una mesa', async () => {
    loginAs('admin')
    const { user } = renderApp('/mesas')
    await user.click(await screen.findByRole('button', { name: 'Editar mesa 4' }))
    const form = screen.getByRole('form', { name: 'Editar mesa 4' })
    const capacity = within(form).getByLabelText('Capacidad (personas)')
    expect(capacity).toHaveValue(4)

    await user.clear(capacity)
    await user.type(capacity, '5')
    await user.selectOptions(within(form).getByLabelText('Zona'), 'Barra')
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Mesa 4 guardada.')
    const bar = screen.getByRole('heading', { name: 'Barra' }).closest('section')!
    await waitFor(() => expect(within(bar).getByText('Mesa 4')).toBeInTheDocument())
    expect(db.tables.find((t) => t.id === 4)).toMatchObject({ capacity: 5, location: 'bar' })
  })

  it('el admin borra una mesa sin pedidos ni reservas', async () => {
    loginAs('admin')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    db.tables.push({ id: 11, number: 11, capacity: 2, location: 'bar', status: 'available' })
    const { user } = renderApp('/mesas')
    await user.click(await screen.findByRole('button', { name: 'Borrar mesa 11' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Mesa 11 borrada.')
    await waitFor(() => expect(screen.queryByText('Mesa 11')).not.toBeInTheDocument())
  })

  it('no deja borrar una mesa con pedidos o reservas y lo explica', async () => {
    loginAs('admin')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user } = renderApp('/mesas')
    await user.click(await screen.findByRole('button', { name: 'Borrar mesa 2' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('márcala como fuera de servicio')
    expect(db.tables.some((t) => t.id === 2)).toBe(true)
  })

  it('el camarero cambia estados pero no gestiona mesas', async () => {
    loginAs('waiter')
    renderApp('/mesas')
    expect(await screen.findByLabelText('Estado de la mesa 1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ Nueva mesa' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar mesa 1' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Borrar mesa 1' })).not.toBeInTheDocument()
  })
})
