import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { createTable, updateTable } from '../api/tables'
import type { DiningTable, TableLocation, TableStatus } from '../api/types'
import { TABLE_LOCATION_LABEL, TABLE_LOCATIONS, TABLE_STATUS_LABEL, TABLE_STATUSES } from '../utils/labels'

interface Props {
  table?: DiningTable
  suggestedNumber?: number
  onSaved: (table: DiningTable) => void
  onCancel: () => void
}

export default function TableForm({ table, suggestedNumber = 1, onSaved, onCancel }: Props) {
  const [number, setNumber] = useState(String(table?.number ?? suggestedNumber))
  const [capacity, setCapacity] = useState(String(table?.capacity ?? 4))
  const [location, setLocation] = useState<TableLocation>(table?.location ?? 'indoor')
  const [status, setStatus] = useState<TableStatus>(table?.status ?? 'available')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const title = table ? `Editar mesa ${table.number}` : 'Nueva mesa'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = { number: Number(number), capacity: Number(capacity), location, status }
    if (!Number.isInteger(data.number) || data.number < 1) {
      setError('El número de mesa debe ser 1 o más')
      return
    }
    if (!Number.isInteger(data.capacity) || data.capacity < 1) {
      setError('La capacidad debe ser de 1 persona o más')
      return
    }
    setSaving(true)
    setError(null)
    try {
      onSaved(table ? await updateTable(table.id, data) : await createTable(data))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card admin-form" onSubmit={handleSubmit} aria-label={title}>
      <h2>{title}</h2>
      <div className="filters">
        <label>
          Número
          <input type="number" min="1" step="1" value={number} onChange={(e) => setNumber(e.target.value)} required />
        </label>
        <label>
          Capacidad (personas)
          <input
            type="number"
            min="1"
            step="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
          />
        </label>
        <label>
          Zona
          <select value={location} onChange={(e) => setLocation(e.target.value as TableLocation)}>
            {TABLE_LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {TABLE_LOCATION_LABEL[l]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as TableStatus)}>
            {TABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TABLE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Guardando…' : table ? 'Guardar cambios' : 'Crear mesa'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
