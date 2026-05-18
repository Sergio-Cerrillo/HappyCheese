import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Store as StoreIcon, Sparkles } from 'lucide-react'
import Image from 'next/image'
import type { Flavor, Store, PortionType } from '@/lib/types'

interface FlavorCardProps {
  flavor: Flavor
  stores: Store[]
  onEdit: (flavor: Flavor) => void
  onDelete: (id: string) => void
}

const PORTION_LABELS: Record<PortionType, string> = {
  individual: 'Individual',
  doble: 'Doble',
  mediana: 'Mediana',
  grande: 'Grande',
}

export function FlavorCard({
  flavor,
  stores,
  onEdit,
  onDelete,
}: FlavorCardProps) {
  // Filtrar tiendas con disponibilidad válida
  const availableStores = stores
    .filter((s) => s.active)
    .map((store) => {
      const availability = flavor.availability.find((a) => a.storeId === store.id)
      if (!availability || availability.portions.length === 0) return null

      // Obtener precios (específicos de tienda o por defecto)
      const prices = availability.prices || flavor.prices

      // Filtrar solo porciones disponibles con precio > 0
      const validPortions = availability.portions.filter(
        (portion) => prices[portion] > 0
      )

      if (validPortions.length === 0) return null

      return {
        store,
        portions: validPortions.map((portion) => ({
          portion,
          price: prices[portion],
        })),
        hasCustomPrices: !!availability.prices,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <article
      className="
        group overflow-hidden rounded-[28px]
        border border-[rgba(56,56,54,0.08)]
        bg-white/60 backdrop-blur-xl
        shadow-[0_10px_30px_rgba(0,0,0,0.05)]
        transition-all duration-300
        hover:-translate-y-px
        hover:shadow-[0_14px_40px_rgba(0,0,0,0.07)]
      "
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        {/* Imagen */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl sm:h-36 sm:w-36">
          <Image
            src={flavor.image || '/images/clasica.jpg'}
            alt={flavor.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.35)] via-transparent to-transparent" />

          {!flavor.active && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
              <Badge className="border-0 bg-white/90 text-[rgb(56,56,54)] shadow-none">
                Inactivo
              </Badge>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className=" truncate text-2xl font-semibold tracking-tight text-[rgb(56,56,54)]">
                  {flavor.name}
                </h3>

                {flavor.active ? (
                  <Badge className="border-0 bg-[rgba(56,56,54,0.08)] text-[rgb(56,56,54)] shadow-none">
                    Disponible
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-[rgba(56,56,54,0.78)] text-white shadow-none">
                    No disponible
                  </Badge>
                )}
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(56,56,54,0.70)]">
                {flavor.description}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start">
              <Button
                size="icon"
                variant="outline"
                className="
                  h-10 w-10 rounded-xl
                  border-[rgba(56,56,54,0.10)]
                  bg-white/60 text-[rgb(56,56,54)]
                  shadow-none
                  transition-all duration-300
                  hover:scale-[1.03] hover:bg-[rgba(56,56,54,0.05)]
                "
                onClick={() => onEdit(flavor)}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="
                  h-10 w-10 rounded-xl
                  border-[rgba(120,40,40,0.16)]
                  bg-white/60 text-[rgb(120,40,40)]
                  shadow-none
                  transition-all duration-300
                  hover:scale-[1.03] hover:bg-[rgba(120,40,40,0.06)]
                "
                onClick={() => onDelete(flavor.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Disponibilidad y Precios por Tienda */}
          <div className="mt-5">
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.48)]">
              Disponibilidad y Precios
            </p>

            {availableStores.length === 0 ? (
              <div
                className="
                  rounded-2xl border border-[rgba(56,56,54,0.08)]
                  bg-[rgba(56,56,54,0.03)]
                  p-4 text-center
                "
              >
                <p className="text-sm text-[rgba(56,56,54,0.58)]">
                  No disponible en ninguna tienda
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableStores.map(({ store, portions, hasCustomPrices }) => (
                  <div
                    key={store!.id}
                    className="
                      rounded-2xl border border-[rgba(56,56,54,0.08)]
                      bg-white/70 p-4
                    "
                  >
                    {/* Header de tienda */}
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
                        <p className="text-sm font-semibold text-[rgb(56,56,54)]">
                          {store!.name}
                        </p>

                      </div>
                    </div>

                    {/* Porciones con precios */}
                    <div className="flex flex-wrap gap-2">
                      {portions!.map(({ portion, price }) => (
                        <div
                          key={portion}
                          className="
                            rounded-xl border border-[rgba(56,56,54,0.08)]
                            bg-[rgba(56,56,54,0.04)]
                            px-3 py-2
                          "
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-[rgb(56,56,54)]">
                              {PORTION_LABELS[portion]}
                            </span>
                            <span className="text-sm font-bold text-[rgb(56,56,54)]">
                              {price.toFixed(2)}€
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}