import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/errors'

interface Result<T> {
  fetcher?: () => Promise<T>
  version: number
  data?: T
  error?: string
}

/**
 * Carga datos con `fetcher` y vuelve a cargar cuando cambia (memorízalo con useCallback).
 * Mientras recarga mantiene los datos anteriores para que la vista no parpadee.
 */
export function useQuery<T>(fetcher: () => Promise<T>) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<Result<T>>({ version: -1 })

  useEffect(() => {
    let cancelled = false
    fetcher().then(
      (data) => {
        if (!cancelled) setResult({ fetcher, version, data })
      },
      (error: unknown) => {
        if (!cancelled) setResult({ fetcher, version, data: undefined, error: getErrorMessage(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [fetcher, version])

  const loading = result.fetcher !== fetcher || result.version !== version
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return { data: result.data, error: loading ? undefined : result.error, loading, reload }
}
