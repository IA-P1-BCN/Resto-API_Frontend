import { useCallback, useEffect, useState } from 'react'
import { connectCocina, type ConnectionStatus } from '../api/cocinaSocket'
import { getErrorMessage } from '../api/errors'
import { ESTADOS_COCINA } from '../api/pedidoReglas'
import { listPedidos } from '../api/pedidos'
import type { Pedido } from '../api/types'

/** Sin WebSocket, la cocina se actualiza consultando cada 10 s (riesgo R5). */
export const POLL_MS = 10_000

function aplicar(lista: Pedido[] | null, pedido: Pedido): Pedido[] {
  const resto = (lista ?? []).filter((p) => p.id !== pedido.id)
  return ESTADOS_COCINA.includes(pedido.estado) ? [...resto, pedido] : resto
}

/**
 * Pedidos que cocina tiene que preparar, en tiempo real:
 * carga inicial + eventos del WebSocket + polling mientras la conexión está caída.
 */
export function useCocinaFeed() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [nuevos, setNuevos] = useState<ReadonlySet<number>>(new Set())
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  // Eventos en directo
  useEffect(
    () =>
      connectCocina({
        onStatus: setStatus,
        onEvent: ({ event, pedido }) => {
          setPedidos((lista) => aplicar(lista, pedido))
          if (event === 'pedido_creado') setNuevos((ids) => new Set(ids).add(pedido.id))
        },
      }),
    [],
  )

  // Carga inicial y al (re)conectar; polling mientras no haya conexión
  useEffect(() => {
    let cancelled = false
    const cargar = () =>
      listPedidos({ estados: ESTADOS_COCINA }).then(
        (lista) => {
          if (cancelled) return
          setPedidos(lista)
          setError(null)
        },
        (err: unknown) => {
          if (!cancelled) setError(getErrorMessage(err))
        },
      )
    void cargar()
    const interval = status === 'open' ? undefined : setInterval(() => void cargar(), POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [status, reloadKey])

  /** Aplica en la lista la respuesta de un cambio hecho desde esta pantalla. */
  const actualizarLocal = useCallback((pedido: Pedido) => {
    setPedidos((lista) => aplicar(lista, pedido))
    setNuevos((ids) => {
      const copia = new Set(ids)
      copia.delete(pedido.id)
      return copia
    })
  }, [])

  return { pedidos, status, error, nuevos, refresh, actualizarLocal }
}
