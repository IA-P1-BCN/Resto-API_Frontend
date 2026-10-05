// Pedidos y cocina en tiempo real (A-08) en modo simulado.
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { db } from '../api/mock/db'
import { mockServer } from '../api/mock/server'
import { renderApp } from './renderApp'

vi.mock('../config', () => ({ USE_MOCK: true, API_URL: 'http://api.test' }))

const TOKEN = { admin: 'mock-token-1', camarero: 'mock-token-2', cocina: 'mock-token-3' }
function loginComo(rol: keyof typeof TOKEN) {
  localStorage.setItem('restoapi.token', TOKEN[rol])
}

describe('Pedidos (sala)', () => {
  it('el camarero crea un pedido con varias líneas y notas', async () => {
    loginComo('camarero')
    const { user } = renderApp('/pedidos')
    await screen.findByText('2× Paella de marisco, 1× Ensalada de burrata, 2× Agua mineral')

    await user.click(screen.getByRole('button', { name: '+ Nuevo pedido' }))
    const form = screen.getByRole('form', { name: 'Nuevo pedido' })
    await within(form).findByRole('option', { name: 'Mesa 1 · Interior' })
    await user.selectOptions(within(form).getByLabelText('Mesa'), 'Mesa 1 · Interior')
    await user.click(await within(form).findByRole('button', { name: 'Añadir Croquetas de jamón' }))
    await user.click(within(form).getByRole('button', { name: 'Añadir Croquetas de jamón' }))
    await user.click(within(form).getByRole('button', { name: 'Añadir Café' }))
    await user.type(within(form).getByLabelText('Notas de Croquetas de jamón'), 'Sin sal')

    expect(within(form).getByLabelText('Cantidad de Croquetas de jamón')).toHaveTextContent('2')
    // 2 × 8,50 + 1 × 1,80
    expect(within(form).getByTestId('total-pedido')).toHaveTextContent('18,80')

    await user.click(within(form).getByRole('button', { name: 'Enviar a cocina' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido #4 enviado a cocina (mesa 1')
    expect(await screen.findByText('2× Croquetas de jamón, 1× Café')).toBeInTheDocument()
    const pedido = db.pedidos.find((p) => p.id === 4)!
    expect(pedido.total).toBe('18.80')
    expect(pedido.lineas[0]).toMatchObject({ plato_id: 1, cantidad: 2, precio_unitario: '8.50', notas: 'Sin sal' })
  })

  it('no deja enviar un pedido sin platos y permite quitar líneas', async () => {
    loginComo('camarero')
    const { user } = renderApp('/pedidos')
    await user.click(await screen.findByRole('button', { name: '+ Nuevo pedido' }))
    const form = screen.getByRole('form', { name: 'Nuevo pedido' })
    await user.selectOptions(await within(form).findByLabelText('Mesa'), await within(form).findByRole('option', { name: 'Mesa 4 · Interior' }))
    expect(within(form).getByRole('button', { name: 'Enviar a cocina' })).toBeDisabled()

    await user.click(await within(form).findByRole('button', { name: 'Añadir Café' }))
    expect(within(form).getByRole('button', { name: 'Enviar a cocina' })).toBeEnabled()
    await user.click(within(form).getByRole('button', { name: 'Quitar uno de Café' }))
    expect(within(form).getByText('Añade platos desde la carta.')).toBeInTheDocument()
    expect(within(form).getByRole('button', { name: 'Enviar a cocina' })).toBeDisabled()
  })

  it('la carta del pedido no ofrece platos agotados', async () => {
    loginComo('camarero')
    const { user } = renderApp('/pedidos')
    await user.click(await screen.findByRole('button', { name: '+ Nuevo pedido' }))
    const form = screen.getByRole('form', { name: 'Nuevo pedido' })
    await within(form).findByRole('button', { name: 'Añadir Croquetas de jamón' })
    expect(within(form).queryByRole('button', { name: 'Añadir Gazpacho' })).not.toBeInTheDocument()
  })

  it('el camarero solo ve sus acciones: cancelar pendientes y cobrar servidos', async () => {
    loginComo('camarero')
    const { user } = renderApp('/pedidos')
    expect(await screen.findByRole('button', { name: 'Cancelar pedido 2' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Empezar pedido 2' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Marcar servido pedido 1' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Marcar pagado pedido 3' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Pedido #3: pagado.')
    await waitFor(() => expect(screen.queryByText('1× Croquetas de jamón, 2× Café')).not.toBeInTheDocument())
  })
})

describe('Cocina en tiempo real', () => {
  it('muestra los pedidos por preparar en dos columnas y está "En directo"', async () => {
    loginComo('cocina')
    renderApp('/cocina')
    expect(await screen.findByText('🟢 En directo')).toBeInTheDocument()
    const pendientes = screen.getByRole('region', { name: 'Pendientes' })
    const enPreparacion = screen.getByRole('region', { name: 'En preparación' })
    expect(within(pendientes).getByRole('article', { name: 'Pedido 2' })).toHaveTextContent('Sin frutos secos')
    expect(within(enPreparacion).getByRole('article', { name: 'Pedido 1' })).toHaveTextContent('Al punto')
    // El pedido 3 ya está servido: no es trabajo de cocina
    expect(screen.queryByRole('article', { name: 'Pedido 3' })).not.toBeInTheDocument()
  })

  it('cocina empieza un pedido y lo marca como servido', async () => {
    loginComo('cocina')
    const { user } = renderApp('/cocina')
    await user.click(await screen.findByRole('button', { name: 'Empezar pedido 2' }))
    const enPreparacion = screen.getByRole('region', { name: 'En preparación' })
    expect(await within(enPreparacion).findByRole('article', { name: 'Pedido 2' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Marcar servido pedido 1' }))
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Pedido 1' })).not.toBeInTheDocument())
    expect(db.pedidos.find((p) => p.id === 1)!.estado).toBe('servido')
  })

  it('un pedido nuevo de sala aparece al momento, marcado como "Nuevo"', async () => {
    loginComo('cocina')
    const { user } = renderApp('/cocina')
    await screen.findByText('🟢 En directo')
    await user.click(screen.getByRole('button', { name: 'Simular pedido de sala' }))

    const pendientes = screen.getByRole('region', { name: 'Pendientes' })
    const nuevo = await within(pendientes).findByRole('article', { name: 'Pedido 4' })
    expect(within(nuevo).getByText('Nuevo')).toBeInTheDocument()

    // Al empezarlo deja de estar marcado como nuevo
    await user.click(within(nuevo).getByRole('button', { name: 'Empezar pedido 4' }))
    const enPreparacion = screen.getByRole('region', { name: 'En preparación' })
    const empezado = await within(enPreparacion).findByRole('article', { name: 'Pedido 4' })
    expect(within(empezado).queryByText('Nuevo')).not.toBeInTheDocument()
  })

  it('el camarero no puede entrar en cocina', async () => {
    loginComo('camarero')
    renderApp('/cocina')
    expect(await screen.findByRole('heading', { name: '403 · Sin acceso' })).toBeInTheDocument()
  })
})

describe('reglas de pedidos del servidor simulado (como la API, HU-07 / HU-08)', () => {
  it('rechaza un pedido con un plato no disponible', async () => {
    loginComo('camarero')
    await expect(
      mockServer.createPedido({ mesa_id: 1, lineas: [{ plato_id: 1, cantidad: 1 }, { plato_id: 5, cantidad: 1 }] }),
    ).rejects.toThrow('"Gazpacho" no está disponible')
  })

  it('calcula el total y congela el precio de cada línea', async () => {
    loginComo('camarero')
    const pedido = await mockServer.createPedido({ mesa_id: 1, lineas: [{ plato_id: 7, cantidad: 2 }, { plato_id: 15, cantidad: 3 }] })
    expect(pedido.total).toBe('54.50') // 2 × 22,00 + 3 × 3,50
    db.platos.find((p) => p.id === 7)!.precio = '30.00'
    expect(db.pedidos.find((p) => p.id === pedido.id)!.lineas[0].precio_unitario).toBe('22.00')
  })

  it('no permite saltarse estados ni cambios fuera del rol', async () => {
    loginComo('cocina')
    await expect(mockServer.updatePedidoEstado(2, 'servido')).rejects.toThrow('No se puede pasar')
    await expect(mockServer.updatePedidoEstado(3, 'pagado')).rejects.toThrow('No se puede pasar')
    await expect(mockServer.createPedido({ mesa_id: 1, lineas: [{ plato_id: 1, cantidad: 1 }] })).rejects.toThrow(
      'No tienes permiso',
    )
  })
})
