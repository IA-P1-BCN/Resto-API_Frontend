import { useCallback, useMemo, useState } from 'react'
import { DISHES_PAGE_SIZE, listCategories, listDishes } from '../api/menu'
import ErrorMessage from '../components/ErrorMessage'
import Pagination from '../components/Pagination'
import { useQuery } from '../hooks/useQuery'
import { formatPrice, splitAllergens } from '../utils/format'

/** Carta con filtros por categoría, disponibilidad y precio máximo (todos los roles). */
export default function MenuPage() {
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [maxPrice, setMaxPrice] = useState('')
  const [page, setPage] = useState(1)

  const categories = useQuery(listCategories)
  const categoryName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )

  const maxPriceNumber = maxPrice.trim() === '' || !Number.isFinite(Number(maxPrice)) ? undefined : Number(maxPrice)
  const fetchDishes = useCallback(
    () =>
      listDishes({
        category_id: categoryId,
        is_available: onlyAvailable ? true : undefined,
        max_price: maxPriceNumber,
        page,
      }),
    [categoryId, onlyAvailable, maxPriceNumber, page],
  )
  const dishes = useQuery(fetchDishes)

  return (
    <>
      <h1>Carta</h1>
      <p className="muted">Categorías, platos, precios y alérgenos</p>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Categoría
          <select
            value={categoryId ?? ''}
            onChange={(e) => {
              setCategoryId(e.target.value === '' ? undefined : Number(e.target.value))
              setPage(1)
            }}
          >
            <option value="">Todas</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value)
              setPage(1)
            }}
            placeholder="Sin límite"
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => {
              setOnlyAvailable(e.target.checked)
              setPage(1)
            }}
          />
          Solo disponibles
        </label>
      </form>

      {dishes.error && <ErrorMessage message={dishes.error} onRetry={dishes.reload} />}
      {dishes.loading && !dishes.data && <p className="page-message">Cargando carta…</p>}

      {dishes.data && (
        <>
          {dishes.data.items.length === 0 ? (
            <div className="card">No hay platos con estos filtros.</div>
          ) : (
            <ul className="cards dish-list" aria-busy={dishes.loading}>
              {dishes.data.items.map((dish) => (
                <li key={dish.id} className={`card dish${dish.is_available ? '' : ' dish-unavailable'}`}>
                  <div className="card-header">
                    <strong>{dish.name}</strong>
                    <span className="price">{formatPrice(dish.price)}</span>
                  </div>
                  <span className="muted small">{categoryName.get(dish.category_id)}</span>
                  {dish.description && <p className="dish-description">{dish.description}</p>}
                  <div className="chips">
                    {!dish.is_available && <span className="chip chip-warning">No disponible</span>}
                    {splitAllergens(dish.allergens).map((a) => (
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
            page={dishes.data.page}
            size={dishes.data.size || DISHES_PAGE_SIZE}
            total={dishes.data.total}
            onChange={setPage}
            label="platos"
          />
        </>
      )}
    </>
  )
}
