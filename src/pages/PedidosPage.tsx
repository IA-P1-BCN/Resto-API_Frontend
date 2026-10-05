import { useCallback, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { ESTADOS_ACTIVOS, transicionesPara } from '../api/pedidoReglas'
import { listPedidos, updatePedidoEstado } from '../api/pedidos'
import type { EstadoPedido, Pedido } from '../api/types'
import ErrorMessage from '../components/ErrorMessage'
import NuevoPedidoForm from '../components/NuevoPedidoForm'
import { useAuth } from '../context/useAuth'
import { useQuery } from '../hooks/useQuery'
import { formatHora, formatPrecio } from '../utils/format'
import { ESTADO_PEDIDO_LABEL, ESTADOS_PEDIDO } from '../utils/labels'

type Filtro = 'activos' | 'todos' | EstadoPedido

function resumenLineas(pedido: Pedido): string {
  return pedido.lineas.map((l) => `${l.cantidad}× ${l.plato?.nombre ?? `plato ${l.plato_id}`}`).join(', ')
}

export default function PedidosPage() {
  const { user } = useAuth()
  const [filtro, setFiltro] = useState<Filtro>('activos')
  const [formAbierto, setFormAbierto] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [accionError, setAccionError] = useState<string | null>(null)
  const [cambiandoId, setCambiandoId] = useState<number | null>(null)

  const fetchPedidos = useCallback(() => {
    const estados = filtro === 'todos' ? undefined : filtro === 'activos' ? ESTADOS_ACTIVOS : [filtro]
    return listPedidos({ estados })
  }, [filtro])
  const pedidos = useQuery(fetchPedidos)

  function handleCreated(pedido: Pedido) {
    setFormAbierto(false)
    setAviso(`Pedido #${pedido.id} enviado a cocina (mesa ${pedido.mesa?.numero ?? pedido.mesa_id}, ${formatPrecio(pedido.total)}).`)
    pedidos.reload()
  }

  async function cambiarEstado(pedido: Pedido, estado: EstadoPedido) {
    if (estado === 'cancelado' && !window.confirm(`¿Cancelar el pedido #${pedido.id}?`)) return
    setCambiandoId(pedido.id)
    setAccionError(null)
    setAviso(null)
    try {
      await updatePedidoEstado(pedido.id, estado)
      setAviso(`Pedido #${pedido.id}: ${ESTADO_PEDIDO_LABEL[estado].toLowerCase()}.`)
      pedidos.reload()
    } catch (error) {
      setAccionError(getErrorMessage(error))
    } finally {
      setCambiandoId(null)
    }
  }

  if (!user) return null
  const lista = pedidos.data ?? []

  return (
    <>
      <h1>Pedidos</h1>
      <p className="muted">Comandas por mesa</p>

      <div className="toolbar">
        <label>
          Mostrar
          <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
            <option value="activos">En curso</option>
            <option value="todos">Todos</option>
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e} value={e}>
                {ESTADO_PEDIDO_LABEL[e]}
              </option>
            ))}
          </select>
        </label>
        {!formAbierto && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setFormAbierto(true)
              setAviso(null)
            }}
          >
            + Nuevo pedido
          </button>
        )}
      </div>

      {formAbierto && <NuevoPedidoForm onCreated={handleCreated} onCancel={() => setFormAbierto(false)} />}

      {aviso && (
        <div className="banner banner-success" role="status">
          {aviso}
        </div>
      )}
      {accionError && <ErrorMessage message={accionError} />}
      {pedidos.error && <ErrorMessage message={pedidos.error} onRetry={pedidos.reload} />}
      {pedidos.loading && !pedidos.data && <p className="page-message">Cargando pedidos…</p>}

      {pedidos.data &&
        (lista.length === 0 ? (
          <div className="card">No hay pedidos.</div>
        ) : (
          <div className="table-wrap">
            <table aria-busy={pedidos.loading}>
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
                {lista.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.mesa?.numero ?? p.mesa_id}</td>
                    <td>{formatHora(p.creado_en)}</td>
                    <td>{resumenLineas(p)}</td>
                    <td>{formatPrecio(p.total)}</td>
                    <td>
                      <span className={`chip pedido-${p.estado}`}>{ESTADO_PEDIDO_LABEL[p.estado]}</span>
                    </td>
                    <td className="acciones-fila">
                      {transicionesPara(user.rol, p.estado).map((t) => (
                        <button
                          key={t.a}
                          type="button"
                          className="btn btn-secondary btn-small"
                          disabled={cambiandoId === p.id}
                          onClick={() => cambiarEstado(p, t.a)}
                          aria-label={`${t.accion} pedido ${p.id}`}
                        >
                          {t.accion}
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
