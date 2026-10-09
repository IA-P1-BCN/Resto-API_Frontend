import type { NavItem } from '../routes/navigation'

export default function PlaceholderPage({ item }: { item: NavItem }) {
  return (
    <>
      <h1>{item.label}</h1>
      <p className="muted">{item.description}</p>
      <div className="card">Próximamente{item.hu ? ` (${item.hu})` : ''}.</div>
    </>
  )
}
