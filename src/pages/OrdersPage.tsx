import { useCallback, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { ACTIVE_STATUSES, transitionsFor } from '../api/orderRules'
import { listOrders, updateOrderStatus } from '../api/orders'
import type { Order, OrderStatus } from '../api/types'
import ErrorMessage from '../components/ErrorMessage'
import NewOrderForm from '../components/NewOrderForm'
import { useAuth } from '../context/useAuth'
import { dishLabel, tableLabel, useDishNames, useTableNumbers } from '../hooks/useLookups'
import { useQuery } from '../hooks/useQuery'
import { formatPrice, formatTime, parseServerTimestamp } from '../utils/format'
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from '../utils/labels'

type Filter = 'active' | 'all' | OrderStatus

/** Comandas por mesa: crear pedidos, cancelarlos y cobrarlos (admin y waiter). */
export default function OrdersPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<Filter>('active')
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [changingId, setChangingId] = useState<number | null>(null)

  const fetchOrders = useCallback(() => {
    const statuses = filter === 'all' ? undefined : filter === 'active' ? ACTIVE_STATUSES : [filter]
    return listOrders({ statuses })
  }, [filter])
  const orders = useQuery(fetchOrders)
  const dishNames = useDishNames()
  const tableNumbers = useTableNumbers(true)

  function handleCreated(order: Order) {
    setFormOpen(false)
    setNotice(
      `Pedido #${order.id} enviado a cocina (${tableLabel(order.table_id, tableNumbers).toLowerCase()}, ${formatPrice(order.total)}).`,
    )
    orders.reload()
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    if (status === 'cancelled' && !window.confirm(`¿Cancelar el pedido #${order.id}?`)) return
    setChangingId(order.id)
    setActionError(null)
    setNotice(null)
    try {
      await updateOrderStatus(order.id, status)
      setNotice(`Pedido #${order.id}: ${ORDER_STATUS_LABEL[status].toLowerCase()}.`)
      orders.reload()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setChangingId(null)
    }
  }

  if (!user) return null
  const list = orders.data ?? []

  return (
    <>
      <h1>Pedidos</h1>
      <p className="muted">Comandas por mesa</p>

      <div className="toolbar">
        <label>
          Mostrar
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="active">En curso</option>
            <option value="all">Todos</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        {!formOpen && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setFormOpen(true)
              setNotice(null)
            }}
          >
            + Nuevo pedido
          </button>
        )}
      </div>

      {formOpen && <NewOrderForm onCreated={handleCreated} onCancel={() => setFormOpen(false)} />}

      {notice && (
        <div className="banner banner-success" role="status">
          {notice}
        </div>
      )}
      {actionError && <ErrorMessage message={actionError} />}
      {orders.error && <ErrorMessage message={orders.error} onRetry={orders.reload} />}
      {orders.loading && !orders.data && <p className="page-message">Cargando pedidos…</p>}

      {orders.data &&
        (list.length === 0 ? (
          <div className="card">No hay pedidos.</div>
        ) : (
          <div className="table-wrap">
            <table aria-busy={orders.loading}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mesa</th>
                  <th>Hora</th>
                  <th>Platos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{tableNumbers.get(o.table_id) ?? o.table_id}</td>
                    <td>{formatTime(parseServerTimestamp(o.created_at))}</td>
                    <td>{o.items.map((i) => `${i.quantity}× ${dishLabel(i.dish_id, dishNames)}`).join(', ')}</td>
                    <td>{formatPrice(o.total)}</td>
                    <td>
                      <span className={`chip order-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span>
                    </td>
                    <td className="row-actions">
                      {transitionsFor(user.role, o.status).map((t) => (
                        <button
                          key={t.to}
                          type="button"
                          className="btn btn-secondary btn-small"
                          disabled={changingId === o.id}
                          onClick={() => changeStatus(o, t.to)}
                          aria-label={`${t.action} pedido ${o.id}`}
                        >
                          {t.action}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </>
  )
}
