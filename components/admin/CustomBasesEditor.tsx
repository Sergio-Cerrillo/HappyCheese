import { Cookie, Layers3, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { CustomBaseOption, Store } from '@/lib/types'

export function CustomBasesEditor({ enabled, bases, stores, onChange }: {
  enabled: boolean
  bases: CustomBaseOption[]
  stores: Store[]
  onChange: (enabled: boolean, bases: CustomBaseOption[]) => void
}) {
  function update(id: string, patch: Partial<CustomBaseOption>) {
    onChange(enabled, bases.map(base => base.id === id ? { ...base, ...patch } : base))
  }
  return (
    <section id="custom-bases-section" className="scroll-mt-44 space-y-5 rounded-[24px] border border-[#e5e1d8] bg-[linear-gradient(135deg,#f7f5ef_0%,#fbfaf8_100%)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#383836] text-white"><Layers3 className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-[#797166]">Un toque diferente</p>
            <Label htmlFor="custom-bases-enabled" className="text-base font-medium text-[#383836]">Permitir bases personalizadas</Label>
            <p className="mt-2 text-xs leading-relaxed text-[#797166]">Crea las bases que se podrán elegir en tartas medianas y grandes.</p>
          </div>
        </div>
        <Switch id="custom-bases-enabled" className="data-[state=checked]:bg-[#383836]" checked={enabled} onCheckedChange={checked => onChange(checked, bases)} />
      </div>
      {enabled && <>
        {!bases.length && <div className="rounded-2xl border border-dashed border-[#d8d0c1] bg-white/70 px-5 py-6 text-center">
          <Cookie className="mx-auto mb-3 h-7 w-7 text-[#9c907c]" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm font-medium text-[#383836]">La base también puede ser especial</p>
          <p className="mt-2 text-xs leading-relaxed text-[#797166]">Añade una opción, su suplemento y las tiendas donde se podrá elegir.</p>
        </div>}
        {bases.map((base, index) => (
          <div key={base.id} className="space-y-4 rounded-[20px] border border-[#e5e1d8] bg-white p-4 shadow-[0_4px_16px_rgba(56,56,54,0.025)]">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f3f0e8] text-[#797166]"><Cookie className="h-4 w-4" aria-hidden="true" /></span>
                <p className="truncate text-sm font-medium text-[#383836]">{base.name || `Base ${index + 1}`}</p>
              </div>
              <Button type="button" size="icon" variant="ghost" aria-label={`Eliminar base ${index + 1}`} onClick={() => onChange(enabled, bases.filter(b => b.id !== base.id))}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`base-name-${base.id}`}>Sabor de la base</Label>
              <Input id={`base-name-${base.id}`} className="h-11 rounded-xl border-[#e5e1d8] bg-[#faf9f6]" maxLength={100} placeholder="Ej.: Galleta de pistacho" value={base.name} onChange={event => update(base.id, { name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`base-price-${base.id}`}>Suplemento por tarta (€)</Label>
              <Input id={`base-price-${base.id}`} className="h-11 rounded-xl border-[#e5e1d8] bg-[#faf9f6]" type="number" min="0" max="1000" step="0.01" value={Number.isNaN(base.surcharge) ? '' : base.surcharge} onChange={event => update(base.id, { surcharge: event.target.valueAsNumber })} />
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Tiendas donde se ofrece</legend>
              {stores.map(store => <label key={store.id} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-xs transition-colors ${base.storeIds.includes(store.id) ? 'border-[#383836]/25 bg-[#f4f2ed] text-[#383836]' : 'border-[#e9e5dc] text-[#797166]'}`}>
                <input type="checkbox" className="h-4 w-4 accent-foreground" checked={base.storeIds.includes(store.id)} onChange={event => update(base.id, { storeIds: event.target.checked ? [...base.storeIds, store.id] : base.storeIds.filter(id => id !== store.id) })} />
                {store.name}
              </label>)}
            </fieldset>
          </div>
        ))}
        <Button type="button" variant="outline" disabled={bases.length >= 20} className="min-h-11 w-full gap-2 rounded-xl border-dashed border-[#bdb4a3] bg-white/65 text-[#383836] hover:bg-white" onClick={() => onChange(enabled, [...bases, { id: crypto.randomUUID(), name: '', surcharge: 0, storeIds: [] }])}>
          <Plus className="h-4 w-4" /> Añadir opción de base
        </Button>
        <p className="text-xs text-muted-foreground">Solo aparece en las tiendas y tamaños donde la propia tarta esté disponible. El suplemento se suma a cada unidad.</p>
      </>}
    </section>
  )
}
