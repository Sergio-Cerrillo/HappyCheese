import links from './store-review-links.json'
import { isGoogleReviewUrl } from './catalog-validation'

// Prefer the dashboard setting; defaults keep each known store's link available
// before its first edit. Never guess the store from its name or use another shop.
export function getStoreReviewUrl(storeId: string, configuredUrl?: string | null): string | null {
  if (configuredUrl && isGoogleReviewUrl(configuredUrl)) return configuredUrl
  const id = storeId === 'happycheese_lux' ? 'happycheese-lux' : storeId
  return Object.prototype.hasOwnProperty.call(links, id) ? links[id as keyof typeof links] : null
}
