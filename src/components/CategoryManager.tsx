import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { createCategory, deleteCategory, updateCategory } from '../api/menu'
import type { Category } from '../api/types'
import ErrorMessage from './ErrorMessage'

interface Props {
  categories: Category[]
  onChanged: (message: string) => void
}

export default function CategoryManager({ categories, onChanged }: Props) {
  const nextSortOrder = Math.max(0, ...categories.map((c) => c.sort_order)) + 1
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(String(nextSortOrder))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(category: Category | null) {
    setEditing(category)
    setName(category?.name ?? '')
    setSortOrder(String(category?.sort_order ?? nextSortOrder))
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = { name: name.trim(), sort_order: Number(sortOrder) || 0 }
    setBusy(true)
    setError(null)
    try {
      if (editing) {
        await updateCategory(editing.id, data)
        onChanged(`Categoría "${data.name}" guardada.`)
      } else {
        await createCategory(data)
        onChanged(`Categoría "${data.name}" creada.`)
      }
      startEdit(null)
      setSortOrder(String(Math.max(nextSortOrder, data.sort_order + 1)))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`¿Borrar la categoría "${category.name}"?`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteCategory(category.id)
      if (editing?.id === category.id) startEdit(null)
      onChanged(`Categoría "${category.name}" borrada.`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card admin-form" aria-label="Categorías">
      <h2>Categorías</h2>

      <ul className="admin-list">
        {categories.map((c) => (
          <li key={c.id}>
            <span>
              <strong>{c.name}</strong> <span className="muted small">· orden {c.sort_order}</span>
            </span>
            <span className="actions">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => startEdit(c)}
                aria-label={`Editar categoría ${c.name}`}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                disabled={busy}
                onClick={() => handleDelete(c)}
                aria-label={`Borrar categoría ${c.name}`}
              >
                Borrar
              </button>
            </span>
          </li>
        ))}
      </ul>

      {error && <ErrorMessage message={error} />}

      <form
        className="filters"
        onSubmit={handleSubmit}
        aria-label={editing ? `Editar categoría ${editing.name}` : 'Nueva categoría'}
      >
        <label>
          Nombre de la categoría
          <input type="text" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Orden en la carta
          <input type="number" step="1" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </label>
        <div className="actions">
          <button type="submit" className="btn" disabled={busy}>
            {editing ? 'Guardar categoría' : 'Añadir categoría'}
          </button>
          {editing && (
            <button type="button" className="btn btn-secondary" onClick={() => startEdit(null)}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
