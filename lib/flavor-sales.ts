import type { Flavor, OrderItem } from './types'

export function getFlavorSaleState(flavor: Flavor, now = new Date()) {
  const edition = flavor.limitedEdition
  if (!edition?.enabled) return { available: true, label: '', remaining: null }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const remaining = edition.maxUnits ? flavor.inventory?.remaining ?? 0 : null
  if (edition.endsOn && today > edition.endsOn) return { available: false, label: 'Edición finalizada', remaining }
  if (remaining === 0) return { available: false, label: 'Agotado', remaining }
  return {
    available: true,
    label: remaining === null ? 'Edición limitada' : `Queda${remaining === 1 ? '' : 'n'} ${remaining} ${remaining === 1 ? 'unidad' : 'unidades'}`,
    remaining,
  }
}

export function getFlavorPickupPeriod(flavor: Flavor) {
  const edition = flavor.limitedEdition
  if (!edition?.enabled) return null
  const format = (date: string) => date.split('-').reverse().join('/')
  if (edition.startsOn && edition.endsOn) {
    return edition.startsOn === edition.endsOn
      ? `Recogida el ${format(edition.startsOn)}`
      : `Recogida del ${format(edition.startsOn)} al ${format(edition.endsOn)}`
  }
  if (edition.startsOn) return `Recogida desde el ${format(edition.startsOn)}`
  if (edition.endsOn) return `Recogida hasta el ${format(edition.endsOn)}`
  return null
}

export function getFlavorPickupError(flavor: Flavor, pickupDate: string) {
  const edition = flavor.limitedEdition
  if (!edition?.enabled || !pickupDate) return null
  if ((edition.startsOn && pickupDate < edition.startsOn) || (edition.endsOn && pickupDate > edition.endsOn)) {
    return `${flavor.name} · ${getFlavorPickupPeriod(flavor)!.toLowerCase()}`
  }
  return null
}

export function getCartPickupWindow(flavors: Flavor[], cart: OrderItem[]) {
  let startsOn: string | null = null
  let endsOn: string | null = null
  for (const flavor of flavors) {
    const edition = flavor.limitedEdition
    if (!edition?.enabled || !cart.some(item => item.flavorId === flavor.id)) continue
    if (edition.startsOn && (!startsOn || edition.startsOn > startsOn)) startsOn = edition.startsOn
    if (edition.endsOn && (!endsOn || edition.endsOn < endsOn)) endsOn = edition.endsOn
  }
  return { startsOn, endsOn }
}

export function getFlavorCartError(flavor: Flavor, cart: OrderItem[], extraUnits = 0) {
  const sale = getFlavorSaleState(flavor)
  if (!sale.available) return `${flavor.name} · ${sale.label.toLowerCase()}`
  const quantity = cart.filter(item => item.flavorId === flavor.id).reduce((sum, item) => sum + item.quantity, 0) + extraUnits
  if (sale.remaining !== null && quantity > sale.remaining) return `${flavor.name} · ${sale.label.toLowerCase()}`
  return null
}
