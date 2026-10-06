import { useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { mockServer } from '../api/mock/server'
import { transicionesPara } from '../api/pedidoReglas'
import { updatePedidoEstado } from '../api/pedidos'
import type { EstadoPedido, Pedido } from '../api/types'
import ErrorMessage from '../components/ErrorMessage'
import { USE_MOCK } from '../config'
import { useAuth } from '../context/useAuth'
import { POLL_MS, useCocinaFeed } from '../hooks/useCocinaFeed'
import { useNow } from '../hooks/useNow'
import { formatHace, formatHora } from '../utils/format'

const COLUMNAS: { estado: EstadoPedido; titulo: string }[] = [
  { estado: 'pendiente', titulo: 'Pendientes' },
  { estado: 'en_cocina', titulo: 'En preparación' },
]

export default function CocinaPage() {
  const { user } = useAuth()
  const { pedidos, status, error, nuevos, refresh, actualizarLocal } = useCocinaFeed()
  const ahora = useNow()
  const [cambiandoId, setCambiandoId] = useState<number | null>(null)
  const [accionError, setAccionError] = useState<string | null>(null)

  async function cambiarEstado(pedido: Pedido, estado: EstadoPedido) {
    setCambiandoId(pedido.id)
    setAccionError(null)
    try {
      actualizarLocal(await updatePedidoEstado(pedido.id, estado))
    } catch (err) {
      setAccionError(getErrorMessage(err))
    } finally {
      setCambiandoId(null)
    }
  }

  if (!user) return null

  return (
    <>
      <div className="cocina-header">
        <div>
          <h1>Cocina</h1>
          <p className="muted">Pedidos en tiempo real</p>
        </div>
        <span className={`conexion conexion-${status}`} role="status">
          {status === 'open'
            ? '🟢 En directo'
            : status === 'connecting'
              ? '🟡 Conectando…'
              : `🔴 Sin conexión · actualizando cada ${POLL_MS / 1000} s`}
        </span>
      </div>

      {USE_MOCK && (
        <div className="toolbar">
          <button type="button" className="btn btn-secondary" onClick={() => void mockServer.simularPedidoDeSala()}>
            Simular pedido de sala
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={refresh} />}
      {accionError && <ErrorMessage message={accionError} />}
      {pedidos === null && !error && <p className="page-message">Cargando pedidos…</p>}

      {pedidos && (
        <div className="kanban">
          {COLUMNAS.map(({ estado, titulo }) => {
            const columna = pedidos
              .filter((p) => p.estado === estado)
              .sort((a, b) => a.creado_en.localeCompare(b.creado_en))
            return (
              <section key={estado} className="kanban-col" aria-label={titulo}>
                <h2>
                  {titulo} <span className="badge">{columna.length}</span>
                </h2>
                {columna.length === 0 && <p className="muted">Nada por aquí.</p>}
                {columna.map((p) => (
                  <article key={p.id} className={`card ticket${nuevos.has(p.id) ? ' ticket-nuevo' : ''}`} aria-label={`Pedido ${p.id}`}>
                    <header className="ticket-header">
                      <strong>Mesa {p.mesa?.numero ?? p.mesa_id}</strong>
                      <span className="muted small">
                        #{p.id} · {formatHora(p.creado_en)} · {formatHace(p.creado_en, ahora)}
                      </span>
                    </header>
                    {nuevos.has(p.id) && <span className="chip chip-warning">Nuevo</span>}
                    <ul className="ticket-lineas">
                      {p.lineas.map((l) => (
                        <li key={l.id}>
                          <strong>{l.cantidad}×</strong> {l.plato?.nombre ?? `Plato ${l.plato_id}`}
                          {l.notas && <span className="ticket-nota">⚠ {l.notas}</span>}
                        </li>
                      ))}
                    </ul>
                    <div className="actions">
                      {transicionesPara(user.rol, p.estado)
                        .filter((t) => t.a !== 'cancelado')
                        .map((t) => (
                          <button
                            key={t.a}
                            type="button"
                            className="btn"
                            disabled={cambiandoId === p.id}
                            onClick={() => cambiarEstado(p, t.a)}
                            aria-label={`${t.accion} pedido ${p.id}`}
                          >
                            {t.accion}
                          </button>
                        ))}
                    </div>
                  </article>
                ))}
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}