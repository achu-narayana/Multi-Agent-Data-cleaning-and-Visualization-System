import { useCallback, useEffect, useRef, useState } from 'react'

interface ApiDataState<T> {
  /** Identifies the request (key + reload counter) that produced this state. */
  requestKey: string | null
  key: string | null
  data?: T
  error?: unknown
}

/**
 * Fetches data whenever `key` changes (pass `null` to skip).
 * Exposes loading / error / data explicitly so pages can render
 * LoadingState / ErrorState / EmptyState instead of silently falling back.
 */
export function useApiData<T>(key: string | null, fetcher: () => Promise<T>) {
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const [state, setState] = useState<ApiDataState<T>>({ requestKey: null, key: null })
  const [reloadToken, setReloadToken] = useState(0)
  const requestKey = key ? `${key}#${reloadToken}` : null

  useEffect(() => {
    if (!key || !requestKey) return
    let cancelled = false

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ requestKey, key, data })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            requestKey,
            key,
            data: prev.key === key ? prev.data : undefined,
            error,
          }))
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, requestKey])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  return {
    data: state.key === key ? state.data : undefined,
    error: state.requestKey === requestKey ? state.error : undefined,
    isLoading: !!requestKey && state.requestKey !== requestKey,
    reload,
  }
}
