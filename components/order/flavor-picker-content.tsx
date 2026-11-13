'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Cookie, Minus, Plus, Users } from 'lucide-react'
import { Item as RadioItem } from '@radix-ui/react-radio-group'
import { RadioGroup } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { DrawerClose, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { CustomBaseSelector } from './custom-base-selector'
import { BASE_PORTION_LABELS, getCustomBases } from '@/lib/order-items'
import { getFlavorImageSrc } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import type { CustomBaseOption, Flavor, OrderItem, PortionType } from '@/lib/types'
import { getFlavorCartError, getFlavorPickupPeriod, getFlavorSaleState } from '@/lib/flavor-sales'

const INCLUDED_BASE_NAMES: Record<string, string> = {
  happycheese: 'Base de galleta María seleccionada',
  'happycheese-lux': 'Base de crumble artesanal',
  happycheese_lux: 'Base de crumble artesanal',
}

export function FlavorPickerContent({ flavor, storeId, cart, total, onAdd, onQuantity, onContinue }: {
  flavor: Flavor
  storeId: string
  cart: OrderItem[]
  total: number
  onAdd: (portion: PortionType, base?: CustomBaseOption) => void
  onQuantity: (portion: PortionType, delta: number, base?: OrderItem['customBase']) => void
  onContinue: () => void
}) {
  const availability = flavor.availability.find(entry => entry.storeId === storeId)
  const portions = availability?.portions || []
  const prices = availability?.prices || flavor.prices
  const [selectedPortion, setSelectedPortion] = useState<PortionType | undefined>(portions[0])
  const [selectedBases, setSelectedBases] = useState<Partial<Record<PortionType, string>>>({})
  const portion = portions.find(option => option === selectedPortion) || portions[0]
  const bases = portion ? getCustomBases(flavor, storeId, portion) : []
  const includedBaseName = storeId === 'happycheese' && bases.length > 0
    ? 'Base de galleta María'
    : INCLUDED_BASE_NAMES[storeId] || 'Base original'
  const base = bases.find(option => option.id === selectedBases[portion])
  const inCart = cart.find(item => item.flavorId === flavor.id && item.portion === portion && (item.customBase?.id || '') === (base?.id || ''))
  const price = portion ? prices[portion] + (base?.surcharge || 0) : 0
  const sale = getFlavorSaleState(flavor)
  const pickupPeriod = getFlavorPickupPeriod(flavor)
  const cannotAdd = !!getFlavorCartError(flavor, cart, 1)

  return <>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3 md:px-7 md:py-4" data-vaul-no-drag="">
      <div className="mx-auto max-w-xl">
        <DrawerHeader className="block p-0 text-center">
          <div className="mx-auto flex h-[clamp(160px,26dvh,240px)] w-full max-w-[420px] items-center justify-center">
            <Image src={getFlavorImageSrc(flavor, 'full')} alt={flavor.name} width={1200} height={1200} className="h-auto max-h-full w-auto max-w-full rounded-[20px] object-contain" sizes="(max-width: 459px) calc(100vw - 40px), 420px" />
          </div>
          <DrawerTitle className="mx-auto mt-3 break-words font-serif text-[26px] font-normal leading-tight tracking-[-0.015em] text-[#383836] sm:text-[30px]">{flavor.name}</DrawerTitle>
          <DrawerDescription className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[#797166]">{flavor.description}</DrawerDescription>
          {pickupPeriod ? <div className="mx-auto mt-3 max-w-md rounded-2xl border border-[#ded4c1] bg-[#f1ece2] px-4 py-3 text-center">
            <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#95815d]">Una edición exclusiva</p>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#62533b]">{pickupPeriod}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#8b7d67]">Haz tu pedido ahora y elige tu día de recogida dentro de este período.</p>
            {sale.remaining !== null && <p role="status" className="mt-2 text-[11px] font-medium text-[#79613f]">{sale.label}</p>}
          </div> : sale.label && <div role="status" className="mx-auto mt-3 w-fit rounded-full border border-[#ded2bc] bg-[#f1eadc] px-3 py-1.5 text-[11px] font-medium text-[#79613f]">{sale.label}</div>}
        </DrawerHeader>

        {portion ? <div className="mt-4 border-t border-[#e5e1d8] pt-3">
          <div className="mb-2 flex min-h-4 items-center justify-between gap-3">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#8b8377]">Elige el tamaño</p>
            {(portion === 'mediana' || portion === 'grande') && <span className="inline-flex items-center gap-1.5 text-[10px] text-[#938b7c]"><Users className="h-3 w-3" aria-hidden="true" />{portion === 'mediana' ? '8 personas' : '14 personas'}</span>}
          </div>
          <RadioGroup aria-label="Tamaño de la tarta" value={portion} onValueChange={value => setSelectedPortion(value as PortionType)} className="grid gap-1.5 rounded-[16px] border border-[#e5dfd3] bg-[#efede7] p-1" style={{ gridTemplateColumns: `repeat(${portions.length}, minmax(0, 1fr))` }}>
            {portions.map(option => {
              const optionBase = getCustomBases(flavor, storeId, option).find(choice => choice.id === selectedBases[option])
              return <RadioItem key={option} value={option} aria-label={`Tamaño ${BASE_PORTION_LABELS[option]}`} className={cn(
                'flex min-h-14 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#383836]/25',
                portion === option ? 'border-[#e1dbd0] bg-white text-[#383836] shadow-[0_2px_6px_rgba(56,56,54,0.04)]' : 'border-transparent text-[#938b7c] hover:bg-white/50'
              )}>
                <span className="text-[11px] font-medium leading-tight sm:text-xs">{BASE_PORTION_LABELS[option]}</span>
                <span className="text-[10px] tabular-nums opacity-70">{(prices[option] + (optionBase?.surcharge || 0)).toFixed(2)} €</span>
              </RadioItem>
            })}
          </RadioGroup>

          <section aria-label={`Formato ${BASE_PORTION_LABELS[portion]}`} className="mt-3">
            {bases.length > 0 ? <CustomBaseSelector options={bases} value={selectedBases[portion] || ''} portion={BASE_PORTION_LABELS[portion]} includedBaseName={includedBaseName} onChange={value => setSelectedBases(previous => ({ ...previous, [portion]: value }))} /> : <p className="flex min-h-7 items-center gap-2 text-[11px] text-[#938b7c]"><Cookie className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />{includedBaseName}</p>}
            <div className="mt-3 flex min-h-14 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 text-[9px] uppercase tracking-[0.12em] text-[#8b8377]">{base ? 'Con base personalizada' : 'Precio por tarta'}</p>
                <p className="text-xl font-semibold tabular-nums tracking-tight text-[#383836]">{price.toFixed(2)} €</p>
              </div>
              {inCart ? <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#e5e1d8] bg-white p-1">
                <button type="button" aria-label={`Quitar una tarta ${BASE_PORTION_LABELS[portion].toLowerCase()}`} onClick={() => onQuantity(portion, -1, inCart.customBase)} className="flex h-10 w-10 items-center justify-center rounded-full text-[#383836] transition-colors hover:bg-[#f0ede7]"><Minus className="h-4 w-4" /></button>
                <span className="w-5 text-center text-sm font-semibold tabular-nums text-[#383836]">{inCart.quantity}</span>
                <button type="button" disabled={cannotAdd} aria-label={`Añadir una tarta ${BASE_PORTION_LABELS[portion].toLowerCase()}`} onClick={() => onQuantity(portion, 1, inCart.customBase)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#383836] text-white transition-colors hover:bg-[#4a4a46] disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" /></button>
              </div> : <Button type="button" disabled={cannotAdd} onClick={() => onAdd(portion, base)} className="min-h-11 shrink-0 gap-1.5 rounded-xl bg-[#383836] px-4 text-xs text-white hover:bg-[#4a4a46]"><Plus className="h-3.5 w-3.5" />Añadir al pedido</Button>}
            </div>
          </section>
        </div> : <p className="py-6 text-center text-sm text-[#797166]">No hay tamaños disponibles para este sabor.</p>}
      </div>
    </div>

    <DrawerFooter className="shrink-0 border-t border-[#e5e1d8] bg-white/95 px-5 py-3 backdrop-blur-xl md:px-7">
      <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3">
        <DrawerClose asChild><Button variant="outline" className={cn('min-h-12 rounded-xl border-[#e5e1d8] bg-white px-2 text-xs text-[#797166]', !cart.length && 'col-span-2')}>Seguir eligiendo</Button></DrawerClose>
        {cart.length > 0 && <Button onClick={onContinue} aria-label={`Continuar · ${total.toFixed(2)} €`} className="min-h-12 flex-col gap-0.5 rounded-xl bg-[#383836] px-2 py-1.5 text-xs text-white hover:bg-[#4a4a46] sm:flex-row sm:gap-2">
          <span className="inline-flex items-center gap-1.5">Continuar<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span><span className="text-[10px] font-normal tabular-nums opacity-75 sm:text-xs">{total.toFixed(2)} €</span>
        </Button>}
      </div>
    </DrawerFooter>
  </>
}
