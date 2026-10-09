import { useCallback, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { cancelReservation, listReservations } from '../api/reservations'
import type { DiningTable, Reservation } from '../api/types'
import ErrorMessage from '../components/ErrorMessage'
import NewReservationForm from '../components/NewReservationForm'
import { useAuth } from '../context/useAuth'
import { tableLabel, useTableNumbers } from '../hooks/useLookups'
import { useQuery } from '../hooks/useQuery'
import { formatDate, formatTime, parseLocalTimestamp, todayISO } from '../utils/format'
import { RESERVATION_STATUS_LABEL } from '../utils/labels'

function when(reservation: Reservation): string {
  const date = parseLocalTimestamp(reservation.reserved_at)
  return `${formatDate(date)} a las ${formatTime(date)}`
}

/**
 * Sala: reservas del día, alta y cancelación.
 * Cliente: sus reservas y cancelación (buscar mesas libres es solo para admin y waiter).
 */
export default function ReservationsPage() {
  const { user } = useAuth()
  const isCustomer = user?.role === 'customer'

  const [date, setDate] = useState(todayISO)
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const fetchReservations = useCallback(() => listReservations(isCustomer ? {} : { date }), [isCustomer, date])
  const reservations = useQuery(fetchReservations)
  const tableNumbers = useTableNumbers(!isCustomer)

  function handleCreated(reservation: Reservation, table: DiningTable) {
    setFormOpen(false)
    setActionError(null)
    setNotice(`Reserva confirmada: ${when(reservation)}, mesa ${table.number}.`)
    setDate(reservation.reserved_at.slice(0, 10))
    reservations.reload()
  }

  async function handleCancel(reservation: Reservation) {
    if (!window.confirm(`¿Cancelar la reserva del ${when(reservation)}?`)) return
    setCancellingId(reservation.id)
    setActionError(null)
    setNotice(null)
    try {
      await cancelReservation(reservation.id)
      setNotice(`Reserva del ${when(reservation)} cancelada.`)
      reservations.reload()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setCancellingId(null)
    }
  }

  const list = reservations.data ?? []

  return (
    <>
      <h1>{isCustomer ? 'Mis reservas' : 'Reservas'}</h1>
      <p className="muted">{isCustomer ? 'Tus reservas en el restaurante' : 'Reservas por fecha y hora'}</p>

      {!isCustomer && (
        <div className="toolbar">
          <label>
            Fecha
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
              + Nueva reserva
            </button>
          )}
        </div>
      )}

      {formOpen && (
        <NewReservationForm initialDate={date} onCreated={handleCreated} onCancel={() => setFormOpen(false)} />
      )}

      {notice && (
        <div className="banner banner-success" role="status">
          {notice}
        </div>
      )}
      {actionError && <ErrorMessage message={actionError} />}
      {reservations.error && <ErrorMessage message={reservations.error} onRetry={reservations.reload} />}
      {reservations.loading && !reservations.data && <p className="page-message">Cargando reservas…</p>}

      {reservations.data &&
        (list.length === 0 ? (
          <div className="card">{isCustomer ? 'Todavía no tienes reservas.' : 'No hay reservas para este día.'}</div>
        ) : (
          <div className="table-wrap">
            <table aria-busy={reservations.loading}>
              <thead>
                <tr>
                  {isCustomer && <th>Fecha</th>}
                  <th>Hora</th>
                  <th>Mesa</th>
                  <th>Personas</th>
                  <th>Estado</th>
                  <th>Notas</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const start = parseLocalTimestamp(r.reserved_at)
                  return (
                    <tr key={r.id} className={r.status === 'cancelled' ? 'row-cancelled' : undefined}>
                      {isCustomer && <td>{formatDate(start)}</td>}
                      <td>{formatTime(start)}</td>
                      <td>{tableLabel(r.table_id, tableNumbers)}</td>
                      <td>{r.party_size}</td>
                      <td>
                        <span className={`chip reservation-${r.status}`}>{RESERVATION_STATUS_LABEL[r.status]}</span>
                      </td>
                      <td>{r.notes ?? '—'}</td>
                      <td>
                        {r.status === 'confirmed' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            disabled={cancellingId === r.id}
                            onClick={() => handleCancel(r)}
                            aria-label={`Cancelar reserva de las ${formatTime(start)}`}
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
    </>
  )
}
