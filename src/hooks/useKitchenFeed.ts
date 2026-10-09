import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { connectKitchen, type ConnectionStatus } from '../api/kitchenSocket'
import { KITCHEN_STATUSES } from '../api/orderRules'
import { listOrders } from '../api/orders'
import type { Order, OrderStatus } from '../api/types'

export const POLL_MS = 10_000

function applyOrder(list: Order[] | null, order: Order): Order[] {
  const rest = (list ?? []).filter((o) => o.id !== order.id)
  return KITCHEN_STATUSES.includes(order.status) ? [...rest, order] : rest
}

function applyStatus(list: Order[] | null, id: number, status: OrderStatus): Order[] | null {
  const order = list?.find((o) => o.id === id)
  return order ? applyOrder(list, { ...order, status }) : list
}

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
