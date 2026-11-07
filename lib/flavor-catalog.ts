import type { Flavor } from './types'

export const FLAVOR_CATALOG_UPDATED = 'happycheese:flavors-updated'

export function sortFlavors(flavors: Flavor[], storeId?: string): Flavor[] {
  return [...flavors].sort((a, b) => {
    if (storeId) {
      const difference = (a.storeSortOrders?.[storeId] ?? Number.MAX_SAFE_INTEGER)
        - (b.storeSortOrders?.[storeId] ?? Number.MAX_SAFE_INTEGER)
      if (difference) return difference
    }
    // Preserve the previous order until a store is configured. Newly available
    // flavors without a position go after that store's explicitly ordered ones.
    return (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)
  })
}

// Notify existing order tabs without sharing the administrative catalogue.
export function notifyFlavorCatalogChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(FLAVOR_CATALOG_UPDATED))
  try {
    window.localStorage.setItem(FLAVOR_CATALOG_UPDATED, `${Date.now()}-${Math.random()}`)
  } catch {
    // Focus/visibility refreshes still work when browser storage is unavailable.
  }
}
