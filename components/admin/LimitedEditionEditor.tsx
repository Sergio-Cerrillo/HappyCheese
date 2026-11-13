import { CalendarDays, Hourglass } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Flavor } from '@/lib/types'

export function LimitedEditionEditor({ edition, inventory, onChange }: {
  edition: Flavor['limitedEdition']
  inventory: Flavor['inventory']
  onChange: (edition: NonNullable<Flavor['limitedEdition']>) => void
}) {
  const value = edition || { enabled: false }
  const days = value.startsOn && value.endsOn
    ? Math.round((Date.parse(value.endsOn) - Date.parse(value.startsOn)) / 86400000) + 1 : null

  return <section className="overflow-hidden rounded-2xl border border-[#e2dbcd] bg-[#f8f6f1]">
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="flex min-w-0 items-start gap-3">
        <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-[#8c7e63]" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <Label htmlFor="limited-edition" className="cursor-pointer text-sm font-medium text-[#383836]">Edición limitada</Label>
          <p className="mt-1 text-xs leading-relaxed text-[#797166]">Recogida en fechas exclusivas, unidades limitadas o ambas opciones.</p>
        </div>
      </div>
      <Switch id="limited-edition" checked={value.enabled} onCheckedChange={enabled => onChange({ ...value, enabled })} />
    </div>
    {value.enabled && <div className="space-y-5 border-t border-[#e2dbcd] p-5">
      <div>
        <p className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8c7e63]"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />Días de recogida</p>
        <div className="grid gap-3 min-[380px]:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="sale-start" className="text-xs text-[#797166]">Primer día</Label>
            <Input id="sale-start" type="date" value={value.startsOn || ''} max={value.endsOn || undefined} onChange={event => onChange({ ...value, startsOn: event.target.value || null })} className="min-w-0 rounded-xl bg-white text-xs" />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="sale-end" className="text-xs text-[#797166]">Último día, incluido</Label>
            <Input id="sale-end" type="date" value={value.endsOn || ''} min={value.startsOn || undefined} onChange={event => onChange({ ...value, endsOn: event.target.value || null })} className="min-w-0 rounded-xl bg-white text-xs" />
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#938b7c]">{days && days > 0 ? `${days} ${days === 1 ? 'día de recogida' : 'días de recogida'}. ` : ''}El cliente puede comprar desde que actives el sabor y elegir su recogida dentro de estas fechas, respetando la antelación de la tienda.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sale-max-units" className="text-xs text-[#797166]">Máximo de unidades de esta edición</Label>
        <Input id="sale-max-units" type="number" min={1} max={100000} step={1} placeholder="Ej. 20 · vacío para no limitar unidades" value={value.maxUnits ?? ''} onChange={event => onChange({ ...value, maxUnits: event.target.value === '' ? null : Number(event.target.value) })} className="rounded-xl bg-white" />
        <p className="text-[11px] leading-relaxed text-[#938b7c]">Cupo compartido entre tiendas, tamaños y bases. Cada tarta cuenta como una unidad. Define al menos una fecha final o un máximo.</p>
      </div>
      {inventory && <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#e2dbcd] bg-white/70 p-3 text-center">
        <div><p className="text-base font-semibold tabular-nums text-[#383836]">{inventory.sold}</p><p className="text-[10px] text-[#797166]">Vendidas</p></div>
        <div><p className="text-base font-semibold tabular-nums text-[#383836]">{inventory.reserved}</p><p className="text-[10px] text-[#797166]">En pago</p></div>
        <div><p className="text-base font-semibold tabular-nums text-[#383836]">{inventory.remaining ?? 'Sin límite'}</p><p className="text-[10px] text-[#797166]">Disponibles</p></div>
      </div>}
    </div>}
  </section>
}
