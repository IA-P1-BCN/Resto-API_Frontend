import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { db } from '../api/mock/db'
import { answerConfirm } from './confirmDialog'
import { renderApp } from './renderApp'

vi.mock('../config', () => ({ USE_MOCK: true, API_URL: 'http://api.test' }))

const TOKEN = { admin: 'mock-token-1', waiter: 'mock-token-2' }

function loginAs(role: keyof typeof TOKEN) {
  localStorage.setItem('restoapi.token', TOKEN[role])
}

describe('Carta: gestión de platos (admin)', () => {
  it('el admin crea un plato nuevo', async () => {
    loginAs('admin')
    const { user } = renderApp('/carta')
    await screen.findByText('Croquetas de jamón')

    await user.click(screen.getByRole('button', { name: '+ Nuevo plato' }))
    const form = screen.getByRole('form', { name: 'Nuevo plato' })
    await user.type(within(form).getByLabelText('Nombre'), 'Tortilla de patatas')
    await user.selectOptions(within(form).getByLabelText('Categoría'), 'Entrantes')
    await user.type(within(form).getByLabelText('Precio (€)'), '7.5')
    await user.type(within(form).getByLabelText('Alérgenos (opcional, separados por comas)'), 'huevo')
    await user.click(within(form).getByRole('button', { name: 'Crear plato' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Plato "Tortilla de patatas" creado.')
    expect(screen.queryByRole('form', { name: 'Nuevo plato' })).not.toBeInTheDocument()
    expect(db.dishes.find((d) => d.name === 'Tortilla de patatas')).toMatchObject({
      category_id: 1,
      price: '7.50',
      allergens: 'huevo',
      is_available: true,
    })
  })

  it('el admin edita el precio y la disponibilidad de un plato', async () => {
    loginAs('admin')
    const { user } = renderApp('/carta')
    await user.click(await screen.findByRole('button', { name: 'Editar Croquetas de jamón' }))
    const form = screen.getByRole('form', { name: 'Editar Croquetas de jamón' })
    expect(within(form).getByLabelText('Nombre')).toHaveValue('Croquetas de jamón')

    const price = within(form).getByLabelText('Precio (€)')
    await user.clear(price)
    await user.type(price, '9')
    await user.click(within(form).getByLabelText('Disponible'))
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Plato "Croquetas de jamón" guardado.')
    const croquetas = (await screen.findByText('Croquetas de jamón')).closest('li')!
    await waitFor(() => expect(within(croquetas).getByText('No disponible')).toBeInTheDocument())
    expect(db.dishes.find((d) => d.id === 1)).toMatchObject({ price: '9.00', is_available: false })
  })

  it('el admin borra un plato tras confirmarlo', async () => {
    loginAs('admin')
    const { user } = renderApp('/carta')
    await user.click(await screen.findByRole('button', { name: 'Borrar Pimientos de Padrón' }))
    expect(await screen.findByRole('alertdialog', { name: '¿Borrar "Pimientos de Padrón" de la carta?' })).toBeInTheDocument()
    await answerConfirm(user, 'Borrar')

    expect(await screen.findByRole('status')).toHaveTextContent('Plato "Pimientos de Padrón" borrado.')
    await waitFor(() => expect(screen.queryByText('Pimientos de Padrón')).not.toBeInTheDocument())
  })

  it('si el plato está en un pedido no se borra y se explica por qué', async () => {
    loginAs('admin')
    const { user } = renderApp('/carta')
    await user.click(await screen.findByRole('button', { name: 'Borrar Croquetas de jamón' }))
    await answerConfirm(user, 'Borrar')

    expect(await screen.findByRole('alert')).toHaveTextContent('márcalo como no disponible')
    expect(db.dishes.some((d) => d.id === 1)).toBe(true)
  })

  it('el camarero ve la carta pero no puede gestionarla', async () => {
    loginAs('waiter')
    renderApp('/carta')
    await screen.findByText('Croquetas de jamón')
    expect(screen.queryByRole('button', { name: '+ Nuevo plato' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gestionar categorías' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar Croquetas de jamón' })).not.toBeInTheDocument()
  })
})

describe('Carta: gestión de categorías (admin)', () => {
  it('crea y renombra una categoría', async () => {
    loginAs('admin')
    const { user } = renderApp('/carta')
    await user.click(await screen.findByRole('button', { name: 'Gestionar categorías' }))
    const section = await screen.findByRole('region', { name: 'Categorías' })

    await user.type(within(section).getByLabelText('Nombre de la categoría'), 'Vinos')
    expect(within(section).getByLabelText('Orden en la carta')).toHaveValue(5)
    await user.click(within(section).getByRole('button', { name: 'Añadir categoría' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Categoría "Vinos" creada.')
    expect(await within(section).findByText('Vinos')).toBeInTheDocument()

    await user.click(within(section).getByRole('button', { name: 'Editar categoría Vinos' }))
    const name = within(section).getByLabelText('Nombre de la categoría')
    await user.clear(name)
    await user.type(name, 'Vinos y cavas')
    await user.click(within(section).getByRole('button', { name: 'Guardar categoría' }))
    expect(await within(section).findByText('Vinos y cavas')).toBeInTheDocument()
  })

  it('no deja crear una categoría repetida', async () => {
    loginAs('admin')
    const { user } = renderApp('/carta')
    await user.click(await screen.findByRole('button', { name: 'Gestionar categorías' }))
    const section = await screen.findByRole('region', { name: 'Categorías' })
    await user.type(within(section).getByLabelText('Nombre de la categoría'), 'Postres')
    await user.click(within(section).getByRole('button', { name: 'Añadir categoría' }))
    expect(await within(section).findByRole('alert')).toHaveTextContent('Ya existe una categoría con ese nombre')
  })

  it('no deja borrar una categoría con platos, pero sí una vacía', async () => {
    loginAs('admin')
    db.categories.push({ id: 5, name: 'Temporada', sort_order: 5 })
    const { user } = renderApp('/carta')
    await user.click(await screen.findByRole('button', { name: 'Gestionar categorías' }))
    const section = await screen.findByRole('region', { name: 'Categorías' })

    await user.click(within(section).getByRole('button', { name: 'Borrar categoría Postres' }))
    await answerConfirm(user, 'Borrar')
    expect(await within(section).findByRole('alert')).toHaveTextContent('La categoría tiene platos')

    await user.click(within(section).getByRole('button', { name: 'Borrar categoría Temporada' }))
    await answerConfirm(user, 'Borrar')
    expect(await screen.findByRole('status')).toHaveTextContent('Categoría "Temporada" borrada.')
    await waitFor(() => expect(within(section).queryByText('Temporada')).not.toBeInTheDocument())
  })
})
