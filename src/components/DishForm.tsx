import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { createDish, updateDish, type DishInput } from '../api/menu'
import type { Category, Dish } from '../api/types'

interface Props {
  categories: Category[]
  dish?: Dish
  onSaved: (dish: Dish) => void
  onCancel: () => void
}

export default function DishForm({ categories, dish, onSaved, onCancel }: Props) {
  const [name, setName] = useState(dish?.name ?? '')
  const [categoryId, setCategoryId] = useState(String(dish?.category_id ?? categories[0]?.id ?? ''))
  const [price, setPrice] = useState(dish ? String(Number(dish.price)) : '')
  const [description, setDescription] = useState(dish?.description ?? '')
  const [allergens, setAllergens] = useState(dish?.allergens ?? '')
  const [isAvailable, setIsAvailable] = useState(dish?.is_available ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const title = dish ? `Editar ${dish.name}` : 'Nuevo plato'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const priceNumber = Number(price)
    if (price.trim() === '' || !Number.isFinite(priceNumber) || priceNumber < 0) {
      setError('Indica un precio válido')
      return
    }
    const data: DishInput = {
      name: name.trim(),
      category_id: Number(categoryId),
      price: priceNumber.toFixed(2),
      description: description.trim() || null,
      allergens: allergens.trim() || null,
      is_available: isAvailable,
    }
    setSaving(true)
    setError(null)
    try {
      onSaved(dish ? await updateDish(dish.id, data) : await createDish(data))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card admin-form" onSubmit={handleSubmit} aria-label={title}>
      <h2>{title}</h2>
      <div className="filters">
        <label>
          Nombre
          <input type="text" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Categoría
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Precio (€)
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>
      </div>
      <label>
        Descripción (opcional)
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Alérgenos (opcional, separados por comas)
        <input
          type="text"
          maxLength={255}
          value={allergens}
          onChange={(e) => setAllergens(e.target.value)}
          placeholder="gluten, lácteos, huevo"
        />
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
        Disponible
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Guardando…' : dish ? 'Guardar cambios' : 'Crear plato'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
