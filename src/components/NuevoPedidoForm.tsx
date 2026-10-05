import { useMemo, useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { listCategorias, listPlatos } from '../api/menu'
import { listMesas } from '../api/mesas'
import { createPedido } from '../api/pedidos'
import type { Pedido, Plato } from '../api/types'
import { useQuery } from '../hooks/useQuery'
import { formatPrecio } from '../utils/format'
import { UBICACION_LABEL } from '../utils/labels'

interface Linea {
  plato: Plato
  cantidad: number
  notas: string
}

const fetchPlatosDisponibles = () => listPlatos({ soloDisponibles: true, size: 100 }).then((p) => p.items)

interface Props {
  onCreated: (pedido: Pedido) => void
  onCancel: () => void
}

export default function NuevoPedidoForm({ onCreated, onCancel }: Props) {
  const mesas = useQuery(listMesas)
  const categorias = useQuery(listCategorias)
  const platos = useQuery(fetchPlatosDisponibles)

  const [mesaId, setMesaId] = useState<number | null>(null)
  const [lineas, setLineas] = useState<Linea[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mesasUtiles = (mesas.data ?? []).filter((m) => m.estado !== 'fuera_servicio')
  const porCategoria = useMemo(
    () =>
      (categorias.data ?? [])
        .map((c) => ({ categoria: c, platos: (platos.data ?? []).filter((p) => p.categoria_id === c.id) }))
        .filter((g) => g.platos.length > 0),
    [categorias.data, platos.data],
  )
  // Total = Σ(cantidad × precio), igual que lo calcula la API
  const total = lineas.reduce((t, l) => t + l.cantidad * Number(l.plato.precio), 0)

  function agregar(plato: Plato) {
    setLineas((ls) => {
      const existente = ls.find((l) => l.plato.id === plato.id)
      if (existente) return ls.map((l) => (l === existente ? { ...l, cantidad: l.cantidad + 1 } : l))
      return [...ls, { plato, cantidad: 1, notas: '' }]
    })
  }

  function cambiarCantidad(platoId: number, delta: number) {
    setLineas((ls) =>
      ls.map((l) => (l.plato.id === platoId ? { ...l, cantidad: l.cantidad + delta } : l)).filter((l) => l.cantidad > 0),
    )
  }

  function cambiarNotas(platoId: number, notas: string) {
    setLineas((ls) => ls.map((l) => (l.plato.id === platoId ? { ...l, notas } : l)))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mesaId === null || lineas.length === 0) return
    setGuardando(true)
    setError(null)
    try {
      const pedido = await createPedido({
        mesa_id: mesaId,
        lineas: lineas.map((l) => ({ plato_id: l.plato.id, cantidad: l.cantidad, notas: l.notas || undefined })),
      })
      onCreated(pedido)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setGuardando(false)
    }
  }

  const cargando = mesas.loading || categorias.loading || platos.loading
  const errorCarga = mesas.error ?? categorias.error ?? platos.error

  return (
    <form className="card pedido-form" onSubmit={handleSubmit} aria-label="Nuevo pedido">
      <h2>Nuevo pedido</h2>

      {errorCarga && <p className="form-error">{errorCarga}</p>}
      {cargando && !platos.data && <p className="muted">Cargando carta…</p>}

      <label>
        Mesa
        <select value={mesaId ?? ''} onChange={(e) => setMesaId(e.target.value === '' ? null : Number(e.target.value))} required>
          <option value="">Elige una mesa</option>
          {mesasUtiles.map((m) => (
            <option key={m.id} value={m.id}>
              Mesa {m.numero} · {UBICACION_LABEL[m.ubicacion]}
            </option>
          ))}
        </select>
      </label>

      <div className="pedido-grid">
        <section aria-label="Carta">
          {porCategoria.map(({ categoria, platos: lista }) => (
            <div key={categoria.id} className="carta-grupo">
              <h3>{categoria.nombre}</h3>
              <ul className="carta-rapida">
                {lista.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="btn btn-secondary btn-plato" onClick={() => agregar(p)} aria-label={`Añadir ${p.nombre}`}>
                      <span>{p.nombre}</span>
                      <span className="precio">{formatPrecio(p.precio)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="comanda" aria-label="Comanda">
          <h3>Comanda</h3>
          {lineas.length === 0 ? (
            <p className="muted">Añade platos desde la carta.</p>
          ) : (
            <ul className="comanda-lineas">
              {lineas.map((l) => (
                <li key={l.plato.id}>
                  <div className="comanda-fila">
                    <span>{l.plato.nombre}</span>
                    <span className="cantidad">
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => cambiarCantidad(l.plato.id, -1)} aria-label={`Quitar uno de ${l.plato.nombre}`}>
                        −
                      </button>
                      <output aria-label={`Cantidad de ${l.plato.nombre}`}>{l.cantidad}</output>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => cambiarCantidad(l.plato.id, 1)} aria-label={`Añadir otro de ${l.plato.nombre}`}>
                        +
                      </button>
                    </span>
                    <span className="precio">{formatPrecio(l.cantidad * Number(l.plato.precio))}</span>
                  </div>
                  <input
                    type="text"
                    maxLength={255}
                    value={l.notas}
                    onChange={(e) => cambiarNotas(l.plato.id, e.target.value)}
                    placeholder="Notas: sin cebolla, al punto…"
                    aria-label={`Notas de ${l.plato.nombre}`}
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="comanda-total">
            Total <strong data-testid="total-pedido">{formatPrecio(total)}</strong>
          </p>
        </section>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="submit" className="btn" disabled={guardando || mesaId === null || lineas.length === 0}>
          {guardando ? 'Enviando…' : 'Enviar a cocina'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
