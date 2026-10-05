const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const fechaLarga = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const hora = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })

export function formatPrecio(precio: number | string): string {
  return eur.format(Number(precio))
}

/** "2026-10-07T21:00:00" → "21:00" */
export function formatHora(fechaHora: string): string {
  return hora.format(new Date(fechaHora))
}

/** "2026-10-07T21:00:00" → "mié, 7 oct" */
export function formatFecha(fechaHora: string): string {
  return fechaLarga.format(new Date(fechaHora))
}

/** Fecha local en formato YYYY-MM-DD (el de <input type="date">). */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** "2026-10-07" + "21:00" → "2026-10-07T21:00:00" (TIMESTAMP sin zona, como la BD). */
export function joinFechaHora(fecha: string, horaTexto: string): string {
  return `${fecha}T${horaTexto}:00`
}

export function splitAlergenos(alergenos: string | null): string[] {
  return (alergenos ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
}
