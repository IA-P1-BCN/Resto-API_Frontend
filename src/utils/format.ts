const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const fechaLarga = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const hora = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })

export function formatPrecio(precio: number | string): string {
  return eur.format(Number(precio))
}

export function formatHora(fechaHora: string): string {
  return hora.format(new Date(fechaHora))
}

export function formatFecha(fechaHora: string): string {
  return fechaLarga.format(new Date(fechaHora))
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toLocalTimestamp(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${toISODate(date)}T${hh}:${mm}:${ss}`
}

export function formatHace(fechaHora: string, ahora = Date.now()): string {
  const minutos = Math.max(0, Math.floor((ahora - new Date(fechaHora).getTime()) / 60_000))
  if (minutos < 1) return 'ahora mismo'
  if (minutos < 60) return `hace ${minutos} min`
  return `hace ${Math.floor(minutos / 60)} h ${minutos % 60} min`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function joinFechaHora(fecha: string, horaTexto: string): string {
  return `${fecha}T${horaTexto}:00`
}

export function splitAlergenos(alergenos: string | null): string[] {
  return (alergenos ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
}