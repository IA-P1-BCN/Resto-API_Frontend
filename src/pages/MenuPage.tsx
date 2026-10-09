import { useCallback, useMemo, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { deleteDish, DISHES_PAGE_SIZE, listCategories, listDishes } from '../api/menu'
import type { Dish } from '../api/types'
import CategoryManager from '../components/CategoryManager'
import DishForm from '../components/DishForm'
import ErrorMessage from '../components/ErrorMessage'
import Pagination from '../components/Pagination'
import { useAuth } from '../context/useAuth'
import { useConfirm } from '../context/useConfirm'
import { useQuery } from '../hooks/useQuery'
import { formatPrice, splitAllergens } from '../utils/format'

type DishFormState = { mode: 'new' } | { mode: 'edit'; dish: Dish } | null

export default function MenuPage() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const isAdmin = user?.role === 'admin'
  const [dishForm, setDishForm] = useState<DishFormState>(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
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

  function showNotice(message: string) {
    setNotice(message)
    setActionError(null)
  }

  function handleDishSaved(dish: Dish) {
    showNotice(dishForm?.mode === 'edit' ? `Plato "${dish.name}" guardado.` : `Plato "${dish.name}" creado.`)
    setDishForm(null)
    dishes.reload()
  }

  async function handleDeleteDish(dish: Dish) {
    const confirmed = await confirm({
      title: `¿Borrar "${dish.name}" de la carta?`,
      message: 'Si el plato está en algún pedido, márcalo como no disponible en lugar de borrarlo.',
      confirmLabel: 'Borrar',
    })
    if (!confirmed) return
    setDeletingId(dish.id)
    setNotice(null)
    setActionError(null)
    try {
      await deleteDish(dish.id)
      showNotice(`Plato "${dish.name}" borrado.`)
      if (dishForm?.mode === 'edit' && dishForm.dish.id === dish.id) setDishForm(null)
      dishes.reload()
    } catch (error) {
      setActionError(`No se pudo borrar "${dish.name}": ${getErrorMessage(error)}`)
    } finally {
      setDeletingId(null)
    }
  }

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

      {isAdmin && (
        <div className="toolbar">
          {dishForm === null && (
            <button
              type="button"
              className="btn"
              disabled={!categories.data?.length}
              onClick={() => {
                setDishForm({ mode: 'new' })
                setNotice(null)
              }}
            >
              + Nuevo plato
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            aria-expanded={categoriesOpen}
            onClick={() => setCategoriesOpen((open) => !open)}
          >
            {categoriesOpen ? 'Ocultar categorías' : 'Gestionar categorías'}
          </button>
        </div>
      )}

      {isAdmin && categoriesOpen && categories.data && (
        <CategoryManager
          categories={categories.data}
          onChanged={(message) => {
            showNotice(message)
            categories.reload()
            dishes.reload()
          }}
        />
      )}

      {isAdmin && dishForm && categories.data && (
        <DishForm
          key={dishForm.mode === 'edit' ? dishForm.dish.id : 'new'}
          categories={categories.data}
          dish={dishForm.mode === 'edit' ? dishForm.dish : undefined}
          onSaved={handleDishSaved}
          onCancel={() => setDishForm(null)}
        />
      )}

      {notice && (
        <div className="banner banner-success" role="status">
          {notice}
        </div>
      )}
      {actionError && <ErrorMessage message={actionError} />}
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
                  {isAdmin && (
                    <div className="actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => {
                          setDishForm({ mode: 'edit', dish })
                          setNotice(null)
                        }}
                        aria-label={`Editar ${dish.name}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        disabled={deletingId === dish.id}
                        onClick={() => handleDeleteDish(dish)}
                        aria-label={`Borrar ${dish.name}`}
                      >
                        Borrar
                      </button>
                    </div>
                  )}
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
