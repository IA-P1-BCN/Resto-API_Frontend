import { useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { listTables, updateTableStatus } from '../api/tables'
import type { DiningTable, TableStatus } from '../api/types'
import ErrorMessage from '../components/ErrorMessage'
import { useQuery } from '../hooks/useQuery'
import { TABLE_LOCATION_LABEL, TABLE_LOCATIONS, TABLE_STATUS_LABEL, TABLE_STATUSES } from '../utils/labels'

/** Estado de la sala por zonas; sala puede cambiar el estado de cada mesa. */
export default function TablesPage() {
  const tables = useQuery(listTables)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function changeStatus(table: DiningTable, status: TableStatus) {
    setSavingId(table.id)
    setSaveError(null)
    try {
      await updateTableStatus(table.id, status)
      tables.reload()
    } catch (error) {
      setSaveError(`No se pudo cambiar la mesa ${table.number}: ${getErrorMessage(error)}`)
    } finally {
      setSavingId(null)
    }
  }

  const list = [...(tables.data ?? [])].sort((a, b) => a.number - b.number)

  return (
    <>
      <h1>Mesas</h1>
      <p className="muted">Estado de la sala</p>

      {tables.error && <ErrorMessage message={tables.error} onRetry={tables.reload} />}
      {saveError && <ErrorMessage message={saveError} />}
      {tables.loading && !tables.data && <p className="page-message">Cargando mesas…</p>}

      {tables.data && (
        <>
          <ul className="summary" aria-label="Resumen de la sala">
            {TABLE_STATUSES.map((status) => (
              <li key={status} className={`chip table-${status}`}>
                {TABLE_STATUS_LABEL[status]}: {list.filter((t) => t.status === status).length}
              </li>
            ))}
          </ul>

          {TABLE_LOCATIONS.map((location) => {
            const inZone = list.filter((t) => t.location === location)
            if (inZone.length === 0) return null
            return (
              <section key={location} className="zone">
                <h2>{TABLE_LOCATION_LABEL[location]}</h2>
                <ul className="cards table-list">
                  {inZone.map((table) => (
                    <li key={table.id} className={`card table-card table-border-${table.status}`}>
                      <div className="card-header">
                        <strong>Mesa {table.number}</strong>
                        <span className="muted">👥 {table.capacity}</span>
                      </div>
                      <span className={`chip table-${table.status}`}>{TABLE_STATUS_LABEL[table.status]}</span>
                      <label className="small">
                        Cambiar estado
                        <select
                          aria-label={`Estado de la mesa ${table.number}`}
                          value={table.status}
                          disabled={savingId === table.id}
                          onChange={(e) => changeStatus(table, e.target.value as TableStatus)}
                        >
                          {TABLE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {TABLE_STATUS_LABEL[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </>
      )}
    </>
  )
}
