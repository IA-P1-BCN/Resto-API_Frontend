import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api/client'
import { cocinaSocketUrl, connectCocina } from '../api/cocinaSocket'
import type { Pedido } from '../api/types'
import { POLL_MS, useCocinaFeed } from '../hooks/useCocinaFeed'
import { mockApi } from './fakeApi'

vi.mock('../config', () => ({ USE_MOCK: false, API_URL: 'http://api.test' }))

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  url: string
  onopen: (() => void) | null = null
  onmessage: ((message: { data: unknown }) => void) | null = null
  onclose: (() => void) | null = null
  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }
  close() {
    this.onclose?.()
  }
  simulateOpen() {
    this.onopen?.()
  }
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) })
  }
  simulateDrop() {
    this.onclose?.()
  }
}

const ultimo = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1]

const PEDIDO: Pedido = {
  id: 9,
  mesa_id: 3,
  camarero_id: 2,
  estado: 'pendiente',
  total: '12.00',
  creado_en: '2026-10-05T13:00:00',
  actualizado_en: null,
  lineas: [],
}

beforeEach(() => {
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('cliente WebSocket de cocina', () => {
  it('conecta a ws://<api>/ws/cocina con el token en la URL', () => {
    localStorage.setItem('restoapi.token', 'jwt-1')
    expect(cocinaSocketUrl()).toBe('ws://api.test/ws/cocina?token=jwt-1')
  })

  it('pasa los eventos válidos e ignora el resto', () => {
    const onEvent = vi.fn()
    const onStatus = vi.fn()
    const desconectar = connectCocina({ onEvent, onStatus })
    ultimo().simulateOpen()
    expect(onStatus).toHaveBeenLastCalledWith('open')

    ultimo().simulateMessage({ event: 'pedido_creado', pedido: PEDIDO })
    ultimo().simulateMessage('esto no es JSON')
    ultimo().simulateMessage({ event: 'otra_cosa', pedido: PEDIDO })
    ultimo().simulateMessage({ event: 'pedido_creado' })

    expect(onEvent).toHaveBeenCalledOnce()
    expect(onEvent).toHaveBeenCalledWith({ event: 'pedido_creado', pedido: PEDIDO })
    desconectar()
  })

  it('se reconecta con espera creciente si se cae la conexión', () => {
    vi.useFakeTimers()
    const onStatus = vi.fn()
    const desconectar = connectCocina({ onEvent: vi.fn(), onStatus })
    expect(FakeWebSocket.instances).toHaveLength(1)

    ultimo().simulateDrop()
    expect(onStatus).toHaveBeenLastCalledWith('closed')
    vi.advanceTimersByTime(999)
    expect(FakeWebSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(2)

    ultimo().simulateDrop()
    vi.advanceTimersByTime(1999)
    expect(FakeWebSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(3)

    ultimo().simulateOpen()
    ultimo().simulateDrop()
    vi.advanceTimersByTime(1000)
    expect(FakeWebSocket.instances).toHaveLength(4)
    desconectar()
  })

  it('al desconectar a propósito no vuelve a conectar', () => {
    vi.useFakeTimers()
    const desconectar = connectCocina({ onEvent: vi.fn(), onStatus: vi.fn() })
    desconectar()
    vi.advanceTimersByTime(60_000)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })
})

describe('useCocinaFeed', () => {
  it('sin WebSocket consulta cada 10 s y deja de hacerlo al conectar', async () => {
    vi.useFakeTimers()
    const requests = mockApi(() => ({ status: 200, data: { items: [PEDIDO], total: 1, page: 1, size: 100 } }))
    const pedidosPedidos = () => requests.filter((r) => r.url === '/pedidos').length

    const { result } = renderHook(() => useCocinaFeed())
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(pedidosPedidos()).toBe(1)
    expect(result.current.pedidos).toEqual([PEDIDO])
    expect(api.getUri(requests[0])).toContain('estado=pendiente&estado=en_cocina')

    await act(() => vi.advanceTimersByTimeAsync(POLL_MS))
    expect(pedidosPedidos()).toBe(2)

    await act(async () => {
      ultimo().simulateOpen()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.status).toBe('open')
    expect(pedidosPedidos()).toBe(3)
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS * 3))
    expect(pedidosPedidos()).toBe(3)

    await act(async () => {
      ultimo().simulateMessage({ event: 'pedido_creado', pedido: { ...PEDIDO, id: 10 } })
    })
    expect(result.current.pedidos?.map((p) => p.id)).toEqual([9, 10])
    expect(result.current.nuevos.has(10)).toBe(true)

    await act(async () => {
      ultimo().simulateMessage({ event: 'pedido_actualizado', pedido: { ...PEDIDO, estado: 'servido' } })
    })
    expect(result.current.pedidos?.map((p) => p.id)).toEqual([10])
  })
})