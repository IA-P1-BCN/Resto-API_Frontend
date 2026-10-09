interface Props {
  page: number
  size: number
  total: number
  onChange: (page: number) => void
  label?: string
}

export default function Pagination({ page, size, total, onChange, label = 'resultados' }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / size))
  return (
    <nav className="pagination" aria-label="Paginación">
      <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Anterior
      </button>
      <span className="muted">
        Página {page} de {totalPages} · {total} {label}
      </span>
      <button type="button" className="btn btn-secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente →
      </button>
    </nav>
  )
}
