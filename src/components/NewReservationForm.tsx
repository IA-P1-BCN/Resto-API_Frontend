import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { createReservation } from '../api/reservations'
import { listAvailableTables } from '../api/tables'
import type { DiningTable, Reservation } from '../api/types'
import { joinDateTime, todayISO } from '../utils/format'
import { TABLE_LOCATION_LABEL } from '../utils/labels'

interface Props {
  initialDate: string
  onCreated: (reservation: Reservation, table: DiningTable) => void
  onCancel: () => void
}

export default function NewReservationForm({ initialDate, onCreated, onCancel }: Props) {
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('21:00')
  const [partySizeInput, setPartySizeInput] = useState('2')
  const [notes, setNotes] = useState('')
  const [tables, setTables] = useState<DiningTable[] | null>(null)
  const [tableId, setTableId] = useState<number | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reservedAt = joinDateTime(date, time)
  const partySize = Number(partySizeInput)

  function resetSearch() {
    setTables(null)
    setTableId(null)
    setError(null)
  }

  async function searchTables() {
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      setError('Indica entre 1 y 20 personas')
      return
    }
    if (new Date(reservedAt) < new Date()) {
      setError('No se puede reservar en una fecha u hora pasada')
      return
    }
    setSearching(true)
    setError(null)
    try {
      const available = await listAvailableTables(reservedAt, partySize)
      setTables(available)
      setTableId(available[0]?.id ?? null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (tables === null) {
      await searchTables()
      return
    }
    const table = tables.find((t) => t.id === tableId)
    if (!table) return
    setSaving(true)
    setError(null)
    try {
      const reservation = await createReservation({
        table_id: table.id,
        reserved_at: reservedAt,
        party_size: partySize,
        notes: notes.trim() || undefined,
      })
      onCreated(reservation, table)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card reservation-form" onSubmit={handleSubmit} aria-label="Nueva reserva">
      <h2>Nueva reserva</h2>
      <div className="filters">
        <label>
          Fecha
          <input
            type="date"
            min={todayISO()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              resetSearch()
            }}
            required
          />
        </label>
        <label>
          Hora
          <input
            type="time"
            step="900"
            value={time}
            onChange={(e) => {
              setTime(e.target.value)
              resetSearch()
            }}
            required
          />
        </label>
        <label>
          Personas
          <input
            type="number"
            min="1"
            max="20"
            value={partySizeInput}
            onChange={(e) => {
              setPartySizeInput(e.target.value)
              resetSearch()
            }}
            required
          />
        </label>
      </div>

      {tables !== null &&
        (tables.length === 0 ? (
          <p className="form-error">No hay mesas libres para {partySize} personas a esa hora. Prueba otra hora.</p>
        ) : (
          <>
            <label>
              Mesa
              <select value={tableId ?? ''} onChange={(e) => setTableId(Number(e.target.value))}>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Mesa {t.number} · {TABLE_LOCATION_LABEL[t.location]} · hasta {t.capacity} personas
                  </option>
                ))}
              </select>
            </label>
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
          </>
        ))}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        {tables === null ? (
          <button type="submit" className="btn" disabled={searching}>
            {searching ? 'Buscando…' : 'Ver mesas disponibles'}
          </button>
        ) : (
          <button type="submit" className="btn" disabled={saving || tableId === null}>
            {saving ? 'Guardando…' : 'Confirmar reserva'}
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
