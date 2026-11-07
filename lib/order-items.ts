import type { Flavor, OrderItem, PortionType } from './types'

export function getCustomBases(flavor: Flavor, storeId: string, portion: PortionType) {
  if (!flavor.customBasesEnabled || !['mediana', 'grande'].includes(portion)) return []
  return (flavor.customBases || []).filter(base => base.storeIds.includes(storeId))
}

export function getItemKey(item: Pick<OrderItem, 'flavorId' | 'portion' | 'customBase'>) {
  return JSON.stringify([item.flavorId, item.portion, item.customBase?.id || ''])
}

export function getBaseDescription(item: Pick<OrderItem, 'customBase'>) {
  return item.customBase
    ? `Base: ${item.customBase.name} (+${item.customBase.surcharge.toFixed(2)} €/ud.)`
    : ''
}

// Rebuild the entire price and product description from the catalogue, never from
// client amounts. Store the base snapshot so later catalogue edits don't change orders.
export function priceOrderItems(input: unknown[], flavors: Flavor[], storeId: string): OrderItem[] {
  if (!input.length || input.length > 100) throw new Error('El pedido debe contener entre 1 y 100 productos')
  return input.map(raw => {
    if (!raw || typeof raw !== 'object') throw new Error('Producto no válido')
    const item = raw as Partial<OrderItem>
    const flavor = flavors.find(f => f.id === item.flavorId && f.active)
    const availability = flavor?.availability.find(a => a.storeId === storeId)
    if (!flavor || !item.portion || !availability?.portions.includes(item.portion)) {
      throw new Error('Uno de los sabores o tamaños ya no está disponible en esta tienda')
    }
    if (!Number.isInteger(item.quantity) || item.quantity! < 1 || item.quantity! > 100) {
      throw new Error('La cantidad debe estar entre 1 y 100')
    }
    let customBase: OrderItem['customBase']
    if (item.customBase != null) {
      const base = getCustomBases(flavor, storeId, item.portion).find(b => b.id === item.customBase?.id)
      if (!base) throw new Error('La base seleccionada ya no está disponible para esta tarta')
      if (!Number.isFinite(base.surcharge) || base.surcharge < 0) throw new Error('Suplemento de base no válido')
      customBase = { id: base.id, name: base.name, surcharge: base.surcharge }
    }
    const basePrice = (availability.prices || flavor.prices)[item.portion]
    const price = Math.round((basePrice + (customBase?.surcharge || 0)) * 100) / 100
    if (!Number.isFinite(price) || price <= 0) throw new Error('Precio no válido')
    return {
      flavorId: flavor.id, flavorName: flavor.name, portion: item.portion,
      quantity: item.quantity!, price, ...(customBase ? { customBase } : {}),
    }
  })
}
