import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { db } from '../api/mock/db'
import { renderApp } from './renderApp'

vi.mock('../config', () => ({ USE_MOCK: true, API_URL: 'http://api.test' }))

async function openDeleteDish() {
  localStorage.setItem('restoapi.token', 'mock-token-1')
  const { user } = renderApp('/carta')
  const trigger = await screen.findByRole('button', { name: 'Borrar Pimientos de Padrón' })
  await user.click(trigger)
  const dialog = await screen.findByRole('alertdialog', { name: '¿Borrar "Pimientos de Padrón" de la carta?' })
  return { user, trigger, dialog }
}

describe('Confirmaciones dentro de la app', () => {
  it('el aviso sale en la app con su explicación y no usa el del navegador', async () => {
    const nativeConfirm = vi.spyOn(window, 'confirm')
    const { dialog } = await openDeleteDish()

    expect(dialog).toHaveAccessibleDescription(
      'Si el plato está en algún pedido, márcalo como no disponible en lugar de borrarlo.',
    )
    expect(within(dialog).getByRole('button', { name: 'Borrar' })).toBeInTheDocument()
    expect(nativeConfirm).not.toHaveBeenCalled()
  })

  it('el foco empieza en "Volver" y no sale del aviso con Tab', async () => {
    const { user, dialog } = await openDeleteDish()
    const back = within(dialog).getByRole('button', { name: 'Volver' })
    const confirm = within(dialog).getByRole('button', { name: 'Borrar' })

    expect(back).toHaveFocus()
    await user.tab()
    expect(confirm).toHaveFocus()
    await user.tab()
    expect(back).toHaveFocus()
    await user.tab({ shift: true })
    expect(confirm).toHaveFocus()
  })

  it('"Volver" cierra el aviso sin borrar y devuelve el foco al botón', async () => {
    const { user, trigger, dialog } = await openDeleteDish()
    await user.click(within(dialog).getByRole('button', { name: 'Volver' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
    expect(db.dishes.some((d) => d.name === 'Pimientos de Padrón')).toBe(true)
  })

  it('cancelar un pedido también pide confirmación en la app', async () => {
    localStorage.setItem('restoapi.token', 'mock-token-2')
    const { user } = renderApp('/pedidos')
    await user.click(await screen.findByRole('button', { name: 'Cancelar pedido 2' }))
    const dialog = await screen.findByRole('alertdialog', { name: '¿Cancelar el pedido #2?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar pedido' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido #2: cancelado.')
    expect(db.orders.find((o) => o.id === 2)!.status).toBe('cancelled')
  })

  it('Escape cierra el aviso sin borrar', async () => {
    const { user } = await openDeleteDish()
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(db.dishes.some((d) => d.name === 'Pimientos de Padrón')).toBe(true)
  })
})
