import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectKitchen, kitchenSocketUrl } from '../api/kitchenSocket'
import type { Order } from '../api/types'
import { POLL_MS, useKitchenFeed } from '../hooks/useKitchenFeed'
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

const latest = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1]

const ORDER: Order = {
  id: 9,
  table_id: 3,
  waiter_id: 2,
  status: 'pending',
  total: '12.00',
  created_at: '2026-10-05T11:00:00',
  updated_at: null,
  items: [],
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
  it('conecta a ws://<api>/ws/kitchen con el token en la URL', () => {
    localStorage.setItem('restoapi.token', 'jwt-1')
    expect(kitchenSocketUrl()).toBe('ws://api.test/ws/kitchen?token=jwt-1')
  })

  it('pasa los eventos válidos e ignora el resto', () => {
    const onEvent = vi.fn()
    const onStatus = vi.fn()
    const disconnect = connectKitchen({ onEvent, onStatus })
    latest().simulateOpen()
    expect(onStatus).toHaveBeenLastCalledWith('open')

    const created = { event: 'order_created', order: { id: 9, table_id: 3, status: 'pending', total: '12.00' } }
    const changed = { event: 'order_status_changed', order: { id: 9, table_id: 3, status: 'in_kitchen' } }
    latest().simulateMessage(created)
    latest().simulateMessage(changed)
    latest().simulateMessage('esto no es JSON')
    latest().simulateMessage({ event: 'otra_cosa', order: ORDER })
    latest().simulateMessage({ event: 'order_created' })
    latest().simulateMessage({ event: 'order_created', order: { id: 9 } })

    expect(onEvent).toHaveBeenCalledTimes(2)
    expect(onEvent).toHaveBeenNthCalledWith(1, created)
    expect(onEvent).toHaveBeenNthCalledWith(2, changed)
    disconnect()
  })

  it('se reconecta con espera creciente si se cae la conexión', () => {
    vi.useFakeTimers()
    const onStatus = vi.fn()
    const disconnect = connectKitchen({ onEvent: vi.fn(), onStatus })
    expect(FakeWebSocket.instances).toHaveLength(1)

    latest().simulateDrop()
    expect(onStatus).toHaveBeenLastCalledWith('closed')
    vi.advanceTimersByTime(999)
    expect(FakeWebSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(2)

    latest().simulateDrop()
    vi.advanceTimersByTime(1999)
    expect(FakeWebSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(3)

    latest().simulateOpen()
    latest().simulateDrop()
    vi.advanceTimersByTime(1000)
    expect(FakeWebSocket.instances).toHaveLength(4)
    disconnect()
  })

  it('al desconectar a propósito no vuelve a conectar', () => {
    vi.useFakeTimers()
    const disconnect = connectKitchen({ onEvent: vi.fn(), onStatus: vi.fn() })
    disconnect()
    vi.advanceTimersByTime(60_000)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })
})

describe('useKitchenFeed', () => {
  it('sin WebSocket consulta cada 10 s, deja de hacerlo al conectar y recarga con cada evento', async () => {
    vi.useFakeTimers()
    let serverOrders: Order[] = [ORDER]
    const requests = mockApi((config) => ({
      status: 200,
      data: serverOrders.filter((o) => o.status === config.params?.status),
    }))
    const orderRequests = () => requests.filter((r) => r.url === '/orders/').length

    const { result } = renderHook(() => useKitchenFeed())
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(orderRequests()).toBe(2)
    expect(requests.map((r) => r.params.status)).toEqual(['pending', 'in_kitchen'])
    expect(result.current.orders).toEqual([ORDER])

    await act(() => vi.advanceTimersByTimeAsync(POLL_MS))
    expect(orderRequests()).toBe(4)

    await act(async () => {
      latest().simulateOpen()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.status).toBe('open')
    expect(orderRequests()).toBe(6)
    await act(() => vi.advanceTimersByTimeAsync(POLL_MS * 3))
    expect(orderRequests()).toBe(6)

    const order10: Order = { ...ORDER, id: 10, created_at: '2026-10-05T11:05:00' }
    serverOrders = [ORDER, order10]
    await act(async () => {
      latest().simulateMessage({ event: 'order_created', order: { id: 10, table_id: 3, status: 'pending' } })
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(orderRequests()).toBe(8)
    expect(result.current.orders).toEqual([ORDER, order10])
    expect(result.current.newIds.has(10)).toBe(true)

    serverOrders = [order10]
    await act(async () => {
      latest().simulateMessage({ event: 'order_status_changed', order: { id: 9, status: 'served' } })
    })
    expect(result.current.orders?.map((o) => o.id)).toEqual([10])
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(orderRequests()).toBe(10)
    expect(result.current.orders).toEqual([order10])
  })
})
