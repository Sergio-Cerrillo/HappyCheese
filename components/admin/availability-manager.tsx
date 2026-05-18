"use client"

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { Store, FlavorAvailability, PortionType, PortionPrice } from '@/lib/types'
import { Store as StoreIcon, Euro } from 'lucide-react'
import { cn } from '@/lib/utils'

const PORTION_LABELS: Record<PortionType, string> = {
    individual: 'Individual',
    doble: 'Doble',
    mediana: 'Mediana',
    grande: 'Grande',
}

interface AvailabilityDisplayProps {
    availability: FlavorAvailability[]
    stores: Store[]
    className?: string
}

export function AvailabilityDisplay({
    availability,
    stores,
    className,
}: AvailabilityDisplayProps) {
    const activeStores = stores.filter((s) => s.active)
    const availableStores = activeStores
        .map((store) => ({
            store,
            storeAvail: availability.find((a) => a.storeId === store.id),
        }))
        .filter(({ storeAvail }) => storeAvail && storeAvail.portions.length > 0)

    if (availableStores.length === 0) {
        return (
            <div className={cn('flex flex-wrap gap-2', className)}>
                <Badge className="border-0 bg-[rgba(56,56,54,0.08)] text-[rgba(56,56,54,0.68)] shadow-none">
                    No disponible
                </Badge>
            </div>
        )
    }

    return (
        <div className={cn('grid gap-3 md:grid-cols-2', className)}>
            {availableStores.map(({ store, storeAvail }) => (
                <div
                    key={store.id}
                    className="
            rounded-2xl border border-[rgba(56,56,54,0.08)]
            bg-white/70 px-4 py-4
          "
                >
                    <div className="mb-3 flex items-center gap-2">
                        <div
                            className="
                flex h-8 w-8 items-center justify-center rounded-xl
                border border-[rgba(56,56,54,0.08)]
                bg-[rgba(56,56,54,0.05)]
              "
                        >
                            <StoreIcon className="h-4 w-4 text-[rgb(56,56,54)]" />
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-medium text-[rgb(56,56,54)]">
                                {store.name}
                            </p>
                            {storeAvail!.prices && (
                                <p className="text-xs text-[rgba(56,56,54,0.54)]">
                                    Precios personalizados
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {storeAvail!.portions.map((portion) => (
                            <span
                                key={portion}
                                className="
                  rounded-xl border border-[rgba(56,56,54,0.08)]
                  bg-[rgba(56,56,54,0.04)]
                  px-3 py-1.5 text-[11px]
                  uppercase tracking-[0.12em]
                  text-[rgb(56,56,54)]
                "
                            >
                                {PORTION_LABELS[portion]}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

interface AvailabilityEditorProps {
    availability: FlavorAvailability[]
    stores: Store[]
    onChange: (availability: FlavorAvailability[]) => void
    defaultPrices: PortionPrice // Precios por defecto del sabor
}

export function AvailabilityEditor({
    availability,
    stores,
    onChange,
    defaultPrices,
}: AvailabilityEditorProps) {
    const togglePortion = (
        storeId: string,
        portion: PortionType,
        checked: boolean
    ) => {
        const newAvailability = [...availability]
        const index = newAvailability.findIndex((a) => a.storeId === storeId)

        if (index === -1) {
            if (checked) {
                newAvailability.push({ storeId, portions: [portion] })
            }
        } else {
            if (checked) {
                newAvailability[index].portions = [
                    ...new Set([...newAvailability[index].portions, portion]),
                ]
            } else {
                newAvailability[index].portions = newAvailability[index].portions.filter(
                    (p) => p !== portion
                )
                if (newAvailability[index].portions.length === 0) {
                    newAvailability.splice(index, 1)
                }
            }
        }

        onChange(newAvailability)
    }

    const toggleStore = (storeId: string, checked: boolean) => {
        const newAvailability = [...availability]
        const index = newAvailability.findIndex((a) => a.storeId === storeId)

        if (checked) {
            if (index === -1) {
                newAvailability.push({
                    storeId,
                    portions: ['individual', 'doble', 'mediana', 'grande'],
                })
            }
        } else {
            if (index !== -1) {
                newAvailability.splice(index, 1)
            }
        }

        onChange(newAvailability)
    }

    const toggleCustomPrices = (storeId: string, useCustom: boolean) => {
        const newAvailability = [...availability]
        const index = newAvailability.findIndex((a) => a.storeId === storeId)

        if (index !== -1) {
            if (useCustom) {
                // Inicializar con los precios por defecto
                newAvailability[index].prices = { ...defaultPrices }
            } else {
                // Eliminar los precios personalizados
                delete newAvailability[index].prices
            }
            onChange(newAvailability)
        }
    }

    const updatePrice = (storeId: string, portion: PortionType, price: number) => {
        const newAvailability = [...availability]
        const index = newAvailability.findIndex((a) => a.storeId === storeId)

        if (index !== -1) {
            if (!newAvailability[index].prices) {
                newAvailability[index].prices = { ...defaultPrices }
            }
            newAvailability[index].prices![portion] = price
            onChange(newAvailability)
        }
    }

    return (
        <div className="space-y-4">
            {stores
                .filter((s) => s.active)
                .map((store) => {
                    const storeAvailability = availability.find((a) => a.storeId === store.id)
                    const isStoreEnabled =
                        !!storeAvailability && storeAvailability.portions.length > 0

                    return (
                        <section
                            key={store.id}
                            className="
                rounded-3xl
                border border-[rgba(56,56,54,0.08)]
                bg-white/72 backdrop-blur-md
                p-4 md:p-5
              "
                        >
                            {/* Cabecera tienda */}
                            <div className="mb-4 flex flex-col gap-3 border-b border-[rgba(56,56,54,0.08)] pb-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="
                          flex h-10 w-10 items-center justify-center rounded-2xl
                          border border-[rgba(56,56,54,0.08)]
                          bg-[rgba(56,56,54,0.05)]
                        "
                                        >
                                            <StoreIcon className="h-4 w-4 text-[rgb(56,56,54)]" />
                                        </div>

                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.48)]">
                                                Tienda
                                            </p>
                                            <h4 className="text-base font-semibold text-[rgb(56,56,54)]">
                                                {store.name}
                                            </h4>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 self-start sm:self-auto">
                                        <Checkbox
                                            id={`store-${store.id}-all`}
                                            checked={isStoreEnabled}
                                            onCheckedChange={(checked) =>
                                                toggleStore(store.id, checked as boolean)
                                            }
                                        />
                                        <Label
                                            htmlFor={`store-${store.id}-all`}
                                            className="cursor-pointer text-sm font-medium text-[rgb(56,56,54)]"
                                        >
                                            Activar todas las porciones
                                        </Label>
                                    </label>
                                </div>

                                {/* Toggle de precios personalizados */}
                                {isStoreEnabled && (
                                    <div className="flex flex-col gap-2 rounded-xl bg-[rgba(56,56,54,0.04)] p-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <Label
                                                htmlFor={`custom-prices-${store.id}`}
                                                className="text-sm font-medium text-[rgb(56,56,54)]"
                                            >
                                                Precios personalizados
                                            </Label>
                                            <p className="mt-0.5 text-xs text-[rgba(56,56,54,0.58)]">
                                                {storeAvailability?.prices
                                                    ? 'Usando precios específicos para esta tienda'
                                                    : 'Usando precios por defecto del sabor'}
                                            </p>
                                        </div>
                                        <Switch
                                            id={`custom-prices-${store.id}`}
                                            checked={!!storeAvailability?.prices}
                                            onCheckedChange={(checked) =>
                                                toggleCustomPrices(store.id, checked)
                                            }
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Porciones */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                {(['individual', 'doble', 'mediana', 'grande'] as PortionType[]).map(
                                    (portion) => {
                                        const checked =
                                            storeAvailability?.portions.includes(portion) || false
                                        const hasCustomPrices = !!storeAvailability?.prices
                                        const currentPrice = hasCustomPrices
                                            ? storeAvailability?.prices?.[portion] || 0
                                            : defaultPrices[portion]

                                        return (
                                            <div
                                                key={portion}
                                                className={cn(
                                                    `
                          rounded-2xl border p-4
                          transition-all duration-300
                          `,
                                                    checked
                                                        ? 'border-[rgba(56,56,54,0.18)] bg-[rgba(56,56,54,0.06)]'
                                                        : 'border-[rgba(56,56,54,0.08)] bg-white/70'
                                                )}
                                            >
                                                <label
                                                    htmlFor={`${store.id}-${portion}`}
                                                    className="flex items-center gap-3 cursor-pointer"
                                                >
                                                    <Checkbox
                                                        id={`${store.id}-${portion}`}
                                                        checked={checked}
                                                        onCheckedChange={(value) =>
                                                            togglePortion(store.id, portion, value as boolean)
                                                        }
                                                    />

                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-[rgb(56,56,54)]">
                                                            {PORTION_LABELS[portion]}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-[rgba(56,56,54,0.54)]">
                                                            {checked ? 'Disponible' : 'No disponible'}
                                                        </p>
                                                    </div>
                                                </label>

                                                {/* Input de precio */}
                                                {checked && hasCustomPrices && (
                                                    <div className="mt-3 pt-3 border-t border-[rgba(56,56,54,0.08)]">
                                                        <Label
                                                            htmlFor={`price-${store.id}-${portion}`}
                                                            className="text-xs text-[rgba(56,56,54,0.60)]"
                                                        >
                                                            Precio personalizado
                                                        </Label>
                                                        <div className="relative mt-2">
                                                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(56,56,54,0.48)]" />
                                                            <Input
                                                                id={`price-${store.id}-${portion}`}
                                                                type="number"
                                                                step="0.10"
                                                                min="0"
                                                                value={currentPrice}
                                                                onChange={(e) =>
                                                                    updatePrice(
                                                                        store.id,
                                                                        portion,
                                                                        parseFloat(e.target.value) || 0
                                                                    )
                                                                }
                                                                className="
                                                                    h-10 rounded-xl border-[rgba(56,56,54,0.10)]
                                                                    bg-white/90 pl-9 text-sm text-[rgb(56,56,54)]
                                                                    shadow-none transition-all duration-300
                                                                    focus:border-[rgba(56,56,54,0.22)] focus:ring-0
                                                                "
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Mostrar precio por defecto si no hay personalizado */}
                                                {checked && !hasCustomPrices && (
                                                    <div className="mt-3 pt-3 border-t border-[rgba(56,56,54,0.08)]">
                                                        <p className="text-xs text-[rgba(56,56,54,0.54)]">
                                                            Precio: <span className="font-semibold text-[rgb(56,56,54)]">{currentPrice.toFixed(2)}€</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }
                                )}
                            </div>
                        </section>
                    )
                })}
        </div>
    )
}