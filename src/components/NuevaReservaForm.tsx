import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { listMesasDisponibles } from '../api/mesas'
import { createReserva } from '../api/reservas'
import type { Mesa, Reserva } from '../api/types'
import { joinFechaHora, todayISO } from '../utils/format'
import { UBICACION_LABEL } from '../utils/labels'

interface Props {
  fechaInicial: string
  onCreated: (reserva: Reserva) => void
  onCancel: () => void
}

/** Paso 1: fecha, hora y personas → mesas disponibles (HU-18). Paso 2: elegir mesa y confirmar. */
export default function NuevaReservaForm({ fechaInicial, onCreated, onCancel }: Props) {
  const [fecha, setFecha] = useState(fechaInicial)
  const [hora, setHora] = useState('21:00')
  const [personas, setPersonas] = useState(2)
  const [notas, setNotas] = useState('')
  const [mesas, setMesas] = useState<Mesa[] | null>(null)
  const [mesaId, setMesaId] = useState<number | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fechaHora = joinFechaHora(fecha, hora)

  // Si cambian los datos de la búsqueda, hay que volver a buscar mesas
  function resetBusqueda() {
    setMesas(null)
    setMesaId(null)
    setError(null)
  }

  async function buscarMesas() {
    if (new Date(fechaHora) < new Date()) {
      setError('No se puede reservar en una fecha u hora pasada')
      return
    }
    setBuscando(true)
    setError(null)
    try {
      const disponibles = await listMesasDisponibles(fechaHora, personas)
      setMesas(disponibles)
      setMesaId(disponibles[0]?.id ?? null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBuscando(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mesas === null) {
      await buscarMesas()
      return
    }
    if (mesaId === null) return
    setGuardando(true)
    setError(null)
    try {
      const reserva = await createReserva({ mesa_id: mesaId, fecha_hora: fechaHora, num_personas: personas, notas })
      onCreated(reserva)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="card reserva-form" onSubmit={handleSubmit} aria-label="Nueva reserva">
      <h2>Nueva reserva</h2>
      <div className="filters">
        <label>
          Fecha
          <input
            type="date"
            min={todayISO()}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value)
              resetBusqueda()
            }}
            required
          />
        </label>
        <label>
          Hora
          <input
            type="time"
            step="900"
            value={hora}
            onChange={(e) => {
              setHora(e.target.value)
              resetBusqueda()
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
            value={personas}
            onChange={(e) => {
              setPersonas(Math.max(1, Number(e.target.value) || 1))
              resetBusqueda()
            }}
            required
          />
        </label>
      </div>

      {mesas !== null &&
        (mesas.length === 0 ? (
          <p className="form-error">No hay mesas libres para {personas} personas a esa hora. Prueba otra hora.</p>
        ) : (
          <>
            <label>
              Mesa
              <select value={mesaId ?? ''} onChange={(e) => setMesaId(Number(e.target.value))}>
                {mesas.map((m) => (
                  <option key={m.id} value={m.id}>
                    Mesa {m.numero} · {UBICACION_LABEL[m.ubicacion]} · hasta {m.capacidad} personas
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notas (opcional)
              <input
                type="text"
                maxLength={255}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
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
        {mesas === null ? (
          <button type="submit" className="btn" disabled={buscando}>
            {buscando ? 'Buscando…' : 'Ver mesas disponibles'}
          </button>
        ) : (
          <button type="submit" className="btn" disabled={guardando || mesaId === null}>
            {guardando ? 'Guardando…' : 'Confirmar reserva'}
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
