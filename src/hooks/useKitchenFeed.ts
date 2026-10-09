import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { connectKitchen, type ConnectionStatus } from '../api/kitchenSocket'
import { KITCHEN_STATUSES } from '../api/orderRules'
import { listOrders } from '../api/orders'
import type { Order, OrderStatus } from '../api/types'

/** Sin WebSocket, se consulta GET /orders/ cada 10 s (plan B de la HU-08). */
export const POLL_MS = 10_000

function applyOrder(list: Order[] | null, order: Order): Order[] {
  const rest = (list ?? []).filter((o) => o.id !== order.id)
  return KITCHEN_STATUSES.includes(order.status) ? [...rest, order] : rest
}

/** Cambia el estado de un pedido ya cargado (o lo quita si deja de ser de cocina). */
function applyStatus(list: Order[] | null, id: number, status: OrderStatus): Order[] | null {
  const order = list?.find((o) => o.id === id)
  return order ? applyOrder(list, { ...order, status }) : list
}

/**
 * Pedidos por preparar en cocina: carga inicial por HTTP y, después, los eventos
 * del WebSocket. Cada evento se aplica al momento si se puede y, como el pedido
 * del evento llega incompleto, la lista se vuelve a pedir por HTTP.
 * Si la conexión no está abierta, se pide cada POLL_MS.
 */
export function useKitchenFeed() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [newIds, setNewIds] = useState<ReadonlySet<number>>(new Set())
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(
    () =>
      connectKitchen({
        onStatus: setStatus,
        onEvent: ({ event, order }) => {
          if (event === 'order_created') setNewIds((ids) => new Set(ids).add(order.id))
          else setOrders((list) => applyStatus(list, order.id, order.status))
          refresh()
        },
      }),
    [refresh],
  )

  useEffect(() => {
    let cancelled = false
    const load = () =>
      listOrders({ statuses: KITCHEN_STATUSES }).then(
        (list) => {
          if (cancelled) return
          setOrders(list)
          setError(null)
        },
        (err: unknown) => {
          if (!cancelled) setError(getErrorMessage(err))
        },
      )
    void load()
    const interval = status === 'open' ? undefined : setInterval(() => void load(), POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [status, reloadKey])

  /** Aplica la respuesta de un cambio de estado hecho desde esta pantalla. */
  const applyLocal = useCallback((order: Order) => {
    setOrders((list) => applyOrder(list, order))
    setNewIds((ids) => {
      const copy = new Set(ids)
      copy.delete(order.id)
      return copy
    })
  }, [])

  return { orders, status, error, newIds, refresh, applyLocal }
}
