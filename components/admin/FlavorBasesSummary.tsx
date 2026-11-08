import { Cookie, Layers3 } from 'lucide-react'
import { BASE_PORTION_LABELS, getCustomBasePortionSettings, getCustomBases } from '@/lib/order-items'
import { cn } from '@/lib/utils'
import type { Flavor, PortionType, Store } from '@/lib/types'

export function FlavorBasesSummary({ flavor, stores }: { flavor: Flavor; stores: Store[] }) {
  const bases = flavor.customBases || []
  if (!bases.length) return null
  const offeredSizes = new Map<string, Set<PortionType>>()
  for (const store of stores) {
    for (const portion of flavor.availability.find(entry => entry.storeId === store.id)?.portions || []) {
      for (const base of getCustomBases(flavor, store.id, portion)) {
        const sizes = offeredSizes.get(base.id) || new Set<PortionType>()
        sizes.add(portion)
        offeredSizes.set(base.id, sizes)
      }
    }
  }
  const available = offeredSizes.size > 0

  return <section aria-label={`Bases de ${flavor.name}`} className={cn(
    'mt-5 overflow-hidden rounded-[20px] border p-4 transition-opacity',
    available ? 'border-[#e5e1d8] bg-[linear-gradient(135deg,#f7f5ef_0%,#fbfaf8_100%)]' : 'border-dashed border-[#e5e2dc] bg-[#f7f6f3] opacity-60'
  )}>
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#383836] shadow-[0_2px_8px_rgba(56,56,54,0.04)]"><Layers3 className="h-4 w-4" aria-hidden="true" /></span>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#797166]">Bases personalizadas</p>
        <p className="mt-1 text-xs text-[#625c52]">{bases.length} {bases.length === 1 ? 'opción creada' : 'opciones creadas'} · {available ? 'Suplementos por tamaño' : 'Base personalizable no disponible'}</p>
      </div>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {bases.map(base => {
        const settings = getCustomBasePortionSettings(base)
        const portions = (Object.keys(BASE_PORTION_LABELS) as PortionType[]).filter(portion => settings[portion]?.enabled)
        return <div key={base.id} className="flex items-start gap-2.5 rounded-xl border border-[#e9e5dc] bg-white/85 px-3 py-3">
          <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-[#797166]" strokeWidth={1.5} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-relaxed text-[#383836]">{base.name}</p>
            <p className="mt-1 text-[10px] text-[#797166]">{!flavor.customBasesEnabled ? 'No disponible' : !portions.length ? 'Sin tamaños activados' : offeredSizes.has(base.id) ? 'Disponible en esta tienda' : 'No se ofrece en esta tienda'}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {portions.map(portion => <span key={portion} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] text-[#625c52]', offeredSizes.get(base.id)?.has(portion) ? 'border-[#e5dfd3] bg-[#f5f2eb]' : 'border-dashed border-[#e5dfd3] opacity-55')}>
                {BASE_PORTION_LABELS[portion]} <strong className="font-semibold tabular-nums">+{settings[portion]!.surcharge.toFixed(2)} €</strong>
              </span>)}
            </div>
          </div>
        </div>
      })}
    </div>
  </section>
}
