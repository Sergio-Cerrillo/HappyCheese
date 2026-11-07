'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { STORE_CATALOG_UPDATED } from '@/lib/store-catalog'
import type { Store } from '@/lib/types'

export function useStoreCatalog() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const mounted = useRef(false)
  const latestRequest = useRef(0)

  const refreshStores = useCallback(async () => {
    const request = ++latestRequest.current
    try {
      const response = await fetch('/api/stores', { cache: 'no-store' })
      if (!response.ok) throw new Error('No se han podido actualizar las tiendas')
      const data: Store[] = await response.json()
      if (!Array.isArray(data)) throw new Error('Catálogo de tiendas no válido')
      if (mounted.current && request === latestRequest.current) {
        setStores(data.filter(store => store.active))
        setError(false)
      }
    } catch (error) {
      if (mounted.current && request === latestRequest.current) setError(true)
      console.error('Error refreshing stores:', error)
    } finally {
      if (mounted.current && request === latestRequest.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    const refresh = () => {
      if (document.visibilityState === 'visible') void refreshStores()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORE_CATALOG_UPDATED) refresh()
    }
    void refreshStores()
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    window.addEventListener('storage', onStorage)
    window.addEventListener(STORE_CATALOG_UPDATED, refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      mounted.current = false
      latestRequest.current++
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(STORE_CATALOG_UPDATED, refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [refreshStores])

  return { stores, loading, error, refreshStores }
}
