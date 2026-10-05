import { useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { listMesas, updateMesaEstado } from '../api/mesas'
import type { EstadoMesa, Mesa } from '../api/types'
import ErrorMessage from '../components/ErrorMessage'
import { useQuery } from '../hooks/useQuery'
import { ESTADO_MESA_LABEL, ESTADOS_MESA, UBICACION_LABEL, UBICACIONES } from '../utils/labels'

export default function MesasPage() {
  const mesas = useQuery(listMesas)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function cambiarEstado(mesa: Mesa, estado: EstadoMesa) {
    setSavingId(mesa.id)
    setSaveError(null)
    try {
      await updateMesaEstado(mesa.id, estado)
      mesas.reload()
    } catch (error) {
      setSaveError(`No se pudo cambiar la mesa ${mesa.numero}: ${getErrorMessage(error)}`)
    } finally {
      setSavingId(null)
    }
  }

  const lista = mesas.data ?? []

  return (
    <>
      <h1>Mesas</h1>
      <p className="muted">Estado de la sala</p>

      {mesas.error && <ErrorMessage message={mesas.error} onRetry={mesas.reload} />}
      {saveError && <ErrorMessage message={saveError} />}
      {mesas.loading && !mesas.data && <p className="page-message">Cargando mesas…</p>}

      {mesas.data && (
        <>
          <ul className="resumen" aria-label="Resumen de la sala">
            {ESTADOS_MESA.map((estado) => (
              <li key={estado} className={`chip estado-${estado}`}>
                {ESTADO_MESA_LABEL[estado]}: {lista.filter((m) => m.estado === estado).length}
              </li>
            ))}
          </ul>

          {UBICACIONES.map((ubicacion) => {
            const deZona = lista.filter((m) => m.ubicacion === ubicacion)
            if (deZona.length === 0) return null
            return (
              <section key={ubicacion} className="zona">
                <h2>{UBICACION_LABEL[ubicacion]}</h2>
                <ul className="cards mesa-list">
                  {deZona.map((mesa) => (
                    <li key={mesa.id} className={`card mesa estado-borde-${mesa.estado}`}>
                      <div className="plato-header">
                        <strong>Mesa {mesa.numero}</strong>
                        <span className="muted">👥 {mesa.capacidad}</span>
                      </div>
                      <span className={`chip estado-${mesa.estado}`}>{ESTADO_MESA_LABEL[mesa.estado]}</span>
                      <label className="small">
                        Cambiar estado
                        <select
                          aria-label={`Estado de la mesa ${mesa.numero}`}
                          value={mesa.estado}
                          disabled={savingId === mesa.id}
                          onChange={(e) => cambiarEstado(mesa, e.target.value as EstadoMesa)}
                        >
                          {ESTADOS_MESA.map((estado) => (
                            <option key={estado} value={estado}>
                              {ESTADO_MESA_LABEL[estado]}
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
