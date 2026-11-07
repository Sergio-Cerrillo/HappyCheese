export const STORE_CATALOG_UPDATED = 'happycheese:stores-updated'

export function notifyStoreCatalogChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(STORE_CATALOG_UPDATED))
  try {
    window.localStorage.setItem(STORE_CATALOG_UPDATED, `${Date.now()}-${Math.random()}`)
  } catch {
    // El catálogo también se actualiza al volver a la pestaña.
  }
}
