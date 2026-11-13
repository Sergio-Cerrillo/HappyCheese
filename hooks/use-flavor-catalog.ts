import { useCallback, useEffect, useRef, useState } from 'react'
import { FLAVOR_CATALOG_UPDATED, sortFlavors } from '@/lib/flavor-catalog'
import type { Flavor } from '@/lib/types'

export function useFlavorCatalog() {
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const mounted = useRef(false)
  const latestRequest = useRef(0)

  const refreshFlavors = useCallback(async () => {
    const request = ++latestRequest.current
    const response = await fetch('/api/flavors', { cache: 'no-store' })
    if (!response.ok) throw new Error('No se han podido actualizar los sabores')
    const data: Flavor[] = await response.json()
    if (!Array.isArray(data)) throw new Error('Catálogo de sabores no válido')
    if (mounted.current && request === latestRequest.current) setFlavors(sortFlavors(data))
  }, [])

  useEffect(() => {
    mounted.current = true
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        refreshFlavors().catch(error => console.error('Error refreshing flavors:', error))
      }
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === FLAVOR_CATALOG_UPDATED) refresh()
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    window.addEventListener('storage', onStorage)
    window.addEventListener(FLAVOR_CATALOG_UPDATED, refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      mounted.current = false
      latestRequest.current++
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(FLAVOR_CATALOG_UPDATED, refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [refreshFlavors])

  const hasLimitedEditions = flavors.some(flavor => flavor.limitedEdition?.enabled)
  useEffect(() => {
    if (!hasLimitedEditions) return
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshFlavors().catch(error => console.error('Error refreshing limited editions:', error))
    }, 30_000)
    return () => window.clearInterval(interval)
  }, [hasLimitedEditions, refreshFlavors])

  return { flavors, refreshFlavors }
}
