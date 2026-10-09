import { AxiosError } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { api, SESSION_EXPIRED_EVENT } from '../api/client'
import { getErrorMessage } from '../api/errors'
import { mockApi } from './fakeApi'

describe('cliente HTTP', () => {
  it('añade "Authorization: Bearer" cuando hay token', async () => {
    localStorage.setItem('restoapi.token', 'jwt-abc')
    const requests = mockApi(() => ({ status: 200 }))
    await api.get('/mesas')
    expect(requests[0].headers.Authorization).toBe('Bearer jwt-abc')
  })

  it('no añade cabecera sin token', async () => {
    const requests = mockApi(() => ({ status: 200 }))
    await api.get('/platos')
    expect(requests[0].headers.Authorization).toBeUndefined()
  })

  it('un 401 con sesión abierta borra el token y avisa a la app', async () => {
    localStorage.setItem('restoapi.token', 'jwt-caducado')
    mockApi(() => ({ status: 401 }))
    const onExpired = vi.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)

    await expect(api.get('/pedidos')).rejects.toBeInstanceOf(AxiosError)

    expect(localStorage.getItem('restoapi.token')).toBeNull()
    expect(onExpired).toHaveBeenCalledOnce()
    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  })

  it('getErrorMessage usa el "detail" del formato de error estándar', async () => {
    mockApi(() => ({ status: 409, data: { detail: 'Plato no disponible', code: 'plato_no_disponible' } }))
    const error = await api.post('/pedidos').catch((e: unknown) => e)
    expect(getErrorMessage(error)).toBe('Plato no disponible')
  })

  it('getErrorMessage explica cuando la API no responde', () => {
    const error = new AxiosError('Network Error', AxiosError.ERR_NETWORK)
    expect(getErrorMessage(error)).toBe('No se puede conectar con la API. Inténtalo de nuevo en unos segundos.')
  })
})
