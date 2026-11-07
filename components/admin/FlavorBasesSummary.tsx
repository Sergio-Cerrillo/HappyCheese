import { Cookie, Layers3 } from 'lucide-react'
import { getCustomBases } from '@/lib/order-items'
import { cn } from '@/lib/utils'
import type { Flavor, Store } from '@/lib/types'

export function FlavorBasesSummary({ flavor, stores }: {
  flavor: Flavor
  stores: Store[]
}) {
  const bases = flavor.customBases || []
  if (!bases.length) return null
  const availableIds = new Set(stores.flatMap(store =>
    (flavor.availability.find(entry => entry.storeId === store.id)?.portions || [])
      .flatMap(portion => getCustomBases(flavor, store.id, portion).map(base => base.id))
  ))

  return <section aria-label={`Bases de ${flavor.name}`} className={cn(
    'mt-5 overflow-hidden rounded-[20px] border p-4 transition-opacity',
    flavor.customBasesEnabled
      ? 'border-[#e5e1d8] bg-[linear-gradient(135deg,#f7f5ef_0%,#fbfaf8_100%)]'
      : 'border-dashed border-[#e5e2dc] bg-[#f7f6f3] opacity-60'
  )}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#383836] shadow-[0_2px_8px_rgba(56,56,54,0.04)]"><Layers3 className="h-4 w-4" aria-hidden="true" /></span>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#797166]">Bases personalizadas</p>
          <p className="mt-1 text-xs text-[#625c52]">{bases.length} {bases.length === 1 ? 'opción creada' : 'opciones creadas'} · {flavor.customBasesEnabled ? 'Medianas y grandes' : 'Base personalizable no disponible'}</p>
        </div>
      </div>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {bases.map(base => <div key={base.id} className="flex items-start gap-2.5 rounded-xl border border-[#e9e5dc] bg-white/85 px-3 py-3">
        <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-[#797166]" strokeWidth={1.5} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-relaxed text-[#383836]">{base.name}</p>
          <p className="mt-1 text-[10px] text-[#797166]">{!flavor.customBasesEnabled ? 'No disponible' : availableIds.has(base.id) ? 'Disponible en esta tienda' : 'No se ofrece en esta tienda'}</p>
        </div>
        <span className="shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-[#383836]">+{base.surcharge.toFixed(2)} €</span>
      </div>)}
    </div>
  </section>
}
