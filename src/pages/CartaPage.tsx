import { useCallback, useMemo, useState } from 'react'
import { listCategorias, listPlatos, PLATOS_POR_PAGINA } from '../api/menu'
import ErrorMessage from '../components/ErrorMessage'
import Pagination from '../components/Pagination'
import { useQuery } from '../hooks/useQuery'
import { formatPrecio, splitAlergenos } from '../utils/format'

export default function CartaPage() {
  const [categoriaId, setCategoriaId] = useState<number | undefined>()
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [precioMax, setPrecioMax] = useState('')
  const [page, setPage] = useState(1)

  const categorias = useQuery(listCategorias)
  const nombreCategoria = useMemo(
    () => new Map((categorias.data ?? []).map((c) => [c.id, c.nombre])),
    [categorias.data],
  )

  const precioMaxNum = precioMax.trim() === '' || !Number.isFinite(Number(precioMax)) ? undefined : Number(precioMax)
  const fetchPlatos = useCallback(
    () => listPlatos({ categoriaId, soloDisponibles, precioMax: precioMaxNum, page }),
    [categoriaId, soloDisponibles, precioMaxNum, page],
  )
  const platos = useQuery(fetchPlatos)

  return (
    <>
      <h1>Carta</h1>
      <p className="muted">Categorías, platos, precios y alérgenos</p>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Categoría
          <select
            value={categoriaId ?? ''}
            onChange={(e) => {
              setCategoriaId(e.target.value === '' ? undefined : Number(e.target.value))
              setPage(1)
            }}
          >
            <option value="">Todas</option>
            {(categorias.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Precio máximo (€)
          <input
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={precioMax}
            onChange={(e) => {
              setPrecioMax(e.target.value)
              setPage(1)
            }}
            placeholder="Sin límite"
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={soloDisponibles}
            onChange={(e) => {
              setSoloDisponibles(e.target.checked)
              setPage(1)
            }}
          />
          Solo disponibles
        </label>
      </form>

      {platos.error && <ErrorMessage message={platos.error} onRetry={platos.reload} />}
      {platos.loading && !platos.data && <p className="page-message">Cargando carta…</p>}

      {platos.data && (
        <>
          {platos.data.items.length === 0 ? (
            <div className="card">No hay platos con estos filtros.</div>
          ) : (
            <ul className="cards plato-list" aria-busy={platos.loading}>
              {platos.data.items.map((plato) => (
                <li key={plato.id} className={`card plato${plato.disponible ? '' : ' plato-agotado'}`}>
                  <div className="plato-header">
                    <strong>{plato.nombre}</strong>
                    <span className="precio">{formatPrecio(plato.precio)}</span>
                  </div>
                  <span className="muted small">{nombreCategoria.get(plato.categoria_id)}</span>
                  {plato.descripcion && <p className="plato-desc">{plato.descripcion}</p>}
                  <div className="chips">
                    {!plato.disponible && <span className="chip chip-warning">No disponible</span>}
                    {splitAlergenos(plato.alergenos).map((a) => (
                      <span key={a} className="chip">
                        {a}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={platos.data.page}
            size={platos.data.size || PLATOS_POR_PAGINA}
            total={platos.data.total}
            onChange={setPage}
            label="platos"
          />
        </>
      )}
    </>
  )
}
