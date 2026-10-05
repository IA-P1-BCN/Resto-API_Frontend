import { useCallback, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { cancelarReserva, listReservas } from '../api/reservas'
import type { Reserva } from '../api/types'
import ErrorMessage from '../components/ErrorMessage'
import NuevaReservaForm from '../components/NuevaReservaForm'
import { useAuth } from '../context/useAuth'
import { useQuery } from '../hooks/useQuery'
import { formatFecha, formatHora, todayISO } from '../utils/format'
import { ESTADO_RESERVA_LABEL } from '../utils/labels'

export default function ReservasPage() {
  const { user } = useAuth()
  const esCliente = user?.rol === 'cliente'

  const [fecha, setFecha] = useState(todayISO)
  const [formAbierto, setFormAbierto] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [accionError, setAccionError] = useState<string | null>(null)
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)

  // El personal ve las reservas de un día; el cliente, todas las suyas
  const fetchReservas = useCallback(() => listReservas(esCliente ? {} : { fecha }), [esCliente, fecha])
  const reservas = useQuery(fetchReservas)

  function handleCreated(reserva: Reserva) {
    setFormAbierto(false)
    setAccionError(null)
    setAviso(
      `Reserva confirmada: ${formatFecha(reserva.fecha_hora)} a las ${formatHora(reserva.fecha_hora)}, mesa ${reserva.mesa?.numero ?? reserva.mesa_id}.`,
    )
    if (!esCliente) setFecha(reserva.fecha_hora.slice(0, 10))
    reservas.reload()
  }

  async function handleCancelar(reserva: Reserva) {
    const cuando = `${formatFecha(reserva.fecha_hora)} a las ${formatHora(reserva.fecha_hora)}`
    if (!window.confirm(`¿Cancelar la reserva del ${cuando}?`)) return
    setCancelandoId(reserva.id)
    setAccionError(null)
    setAviso(null)
    try {
      await cancelarReserva(reserva.id)
      setAviso(`Reserva del ${cuando} cancelada.`)
      reservas.reload()
    } catch (error) {
      setAccionError(getErrorMessage(error))
    } finally {
      setCancelandoId(null)
    }
  }

  const lista = reservas.data ?? []

  return (
    <>
      <h1>{esCliente ? 'Mis reservas' : 'Reservas'}</h1>
      <p className="muted">{esCliente ? 'Tus reservas en el restaurante' : 'Reservas por fecha y hora'}</p>

      <div className="toolbar">
        {!esCliente && (
          <label>
            Fecha
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
        )}
        {!formAbierto && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setFormAbierto(true)
              setAviso(null)
            }}
          >
            + Nueva reserva
          </button>
        )}
      </div>

      {formAbierto && (
        <NuevaReservaForm
          fechaInicial={esCliente ? todayISO() : fecha}
          onCreated={handleCreated}
          onCancel={() => setFormAbierto(false)}
        />
      )}

      {aviso && (
        <div className="banner banner-success" role="status">
          {aviso}
        </div>
      )}
      {accionError && <ErrorMessage message={accionError} />}
      {reservas.error && <ErrorMessage message={reservas.error} onRetry={reservas.reload} />}
      {reservas.loading && !reservas.data && <p className="page-message">Cargando reservas…</p>}

      {reservas.data &&
        (lista.length === 0 ? (
          <div className="card">{esCliente ? 'Todavía no tienes reservas.' : 'No hay reservas para este día.'}</div>
        ) : (
          <div className="table-wrap">
            <table aria-busy={reservas.loading}>
              <thead>
                <tr>
                  {esCliente && <th>Fecha</th>}
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
                {lista.map((r) => (
                  <tr key={r.id} className={r.estado === 'cancelada' ? 'fila-cancelada' : undefined}>
                    {esCliente && <td>{formatFecha(r.fecha_hora)}</td>}
                    <td>{formatHora(r.fecha_hora)}</td>
                    <td>{r.mesa?.numero ?? r.mesa_id}</td>
                    <td>{r.num_personas}</td>
                    <td>
                      <span className={`chip reserva-${r.estado}`}>{ESTADO_RESERVA_LABEL[r.estado]}</span>
                    </td>
                    <td>{r.notas ?? '—'}</td>
                    <td>
                      {r.estado === 'confirmada' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          disabled={cancelandoId === r.id}
                          onClick={() => handleCancelar(r)}
                          aria-label={`Cancelar reserva de las ${formatHora(r.fecha_hora)}`}
                        >
                          Cancelar
                        </button>
                      )}
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
