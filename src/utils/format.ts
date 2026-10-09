const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const longDate = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const time = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })

export function formatPrice(price: number | string): string {
  return eur.format(Number(price))
}

export function formatTime(date: Date): string {
  return time.format(date)
}

export function formatDate(date: Date): string {
  return longDate.format(date)
}

export function formatElapsed(date: Date, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60_000))
  if (minutes < 1) return 'ahora mismo'
  if (minutes < 60) return `hace ${minutes} min`
  return `hace ${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

export function parseServerTimestamp(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`)
}

export function parseLocalTimestamp(value: string): Date {
  return new Date(value)
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toServerTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function joinDateTime(date: string, hhmm: string): string {
  return `${date}T${hhmm}:00`
}

export function splitAllergens(allergens: string | null): string[] {
  return (allergens ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
}
