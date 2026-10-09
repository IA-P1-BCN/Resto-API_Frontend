import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { updateReservation } from '../api/reservations'
import { listTables } from '../api/tables'
import type { Reservation, ReservationUpdate } from '../api/types'
import { useQuery } from '../hooks/useQuery'
import { formatTime, joinDateTime, parseLocalTimestamp } from '../utils/format'
import { RESERVATION_STATUS_LABEL, TABLE_LOCATION_LABEL } from '../utils/labels'

type EditableStatus = NonNullable<ReservationUpdate['status']>
const EDITABLE_STATUSES: EditableStatus[] = ['confirmed', 'completed', 'no_show']

interface Props {
  reservation: Reservation
  onSaved: (reservation: Reservation) => void
  onCancel: () => void
}

/** Edición de una reserva por el personal: fecha, hora, personas, mesa, notas y estado. */
export default function EditReservationForm({ reservation, onSaved, onCancel }: Props) {
  const tables = useQuery(listTables)
  const [date, setDate] = useState(reservation.reserved_at.slice(0, 10))
  const [time, setTime] = useState(reservation.reserved_at.slice(11, 16))
  // Texto tal cual del campo, para poder borrarlo y escribir otro número
  const [partySize, setPartySize] = useState(String(reservation.party_size))
  const [tableId, setTableId] = useState(String(reservation.table_id))
  const [notes, setNotes] = useState(reservation.notes ?? '')
  const [status, setStatus] = useState<EditableStatus>(
    reservation.status === 'cancelled' ? 'confirmed' : reservation.status,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const title = `Editar reserva de las ${formatTime(parseLocalTimestamp(reservation.reserved_at))}`

  function changedFields(): ReservationUpdate {
    const changes: ReservationUpdate = {}
    const reservedAt = joinDateTime(date, time)
    if (reservedAt !== reservation.reserved_at.slice(0, 19)) changes.reserved_at = reservedAt
    if (Number(partySize) !== reservation.party_size) changes.party_size = Number(partySize)
    if (Number(tableId) !== reservation.table_id) changes.table_id = Number(tableId)
    if ((notes.trim() || null) !== reservation.notes) changes.notes = notes.trim() || null
    if (status !== reservation.status) changes.status = status
    return changes
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const size = Number(partySize)
    if (!Number.isInteger(size) || size < 1 || size > 20) {
      setError('Indica entre 1 y 20 personas')
      return
    }
    const changes = changedFields()
    if (Object.keys(changes).length === 0) {
      setError('No has cambiado nada')
      return
    }
    if (changes.reserved_at && new Date(changes.reserved_at) < new Date()) {
      setError('No se puede mover una reserva a una fecha u hora pasada')
      return
    }
    setSaving(true)
    setError(null)
    try {
      onSaved(await updateReservation(reservation.id, changes))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const tableList = [...(tables.data ?? [])].sort((a, b) => a.number - b.number)

  return (
    <form className="card admin-form" onSubmit={handleSubmit} aria-label={title}>
      <h2>{title}</h2>
      <div className="filters">
        <label>
          Fecha
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Hora
          <input type="time" step="900" value={time} onChange={(e) => setTime(e.target.value)} required />
        </label>
        <label>
          Personas
          <input
            type="number"
            min="1"
            max="20"
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            required
          />
        </label>
        <label>
          Mesa
          <select value={tableId} onChange={(e) => setTableId(e.target.value)} disabled={!tables.data}>
            {tables.data ? (
              tableList.map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa {t.number} · {TABLE_LOCATION_LABEL[t.location]} · hasta {t.capacity} personas
                </option>
              ))
            ) : (
              <option value={tableId}>Cargando mesas…</option>
            )}
          </select>
        </label>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as EditableStatus)}>
            {EDITABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {RESERVATION_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Notas (opcional)
        <input
          type="text"
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alergias, celebración, trona…"
        />
      </label>

      {tables.error && (
        <p className="form-error" role="alert">
          No se pudieron cargar las mesas: {tables.error}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
