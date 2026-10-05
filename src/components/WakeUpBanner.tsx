import { useSyncExternalStore } from 'react'
import { serverStatus } from '../api/serverStatus'

/** Aviso mientras Render despierta del cold start (riesgo R1). */
export default function WakeUpBanner() {
  const waking = useSyncExternalStore(serverStatus.subscribe, serverStatus.isWaking)
  if (!waking) return null
  return (
    <div className="banner banner-warning" role="status">
      ⏳ Despertando el servidor… la primera petición puede tardar hasta un minuto.
    </div>
  )
}
