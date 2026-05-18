import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/ui/image-upload'
import { AvailabilityEditor } from './availability-manager'
import type { Flavor, Store, PortionType } from '@/lib/types'

interface FlavorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flavor?: Flavor | null
  stores: Store[]
  onSave: (flavor: Partial<Flavor>) => Promise<boolean>
  mode: 'create' | 'edit'
}

const PORTION_LABELS: Record<PortionType, string> = {
  individual: 'Individual',
  doble: 'Doble',
  mediana: 'Mediana',
  grande: 'Grande',
}

const INITIAL_FLAVOR: Partial<Flavor> = {
  name: '',
  description: '',
  prices: { individual: 0, doble: 0, mediana: 0, grande: 0 },
  image: '',
  active: true,
  availability: [],
}

export function FlavorDialog({
  open,
  onOpenChange,
  flavor,
  stores,
  onSave,
  mode,
}: FlavorDialogProps) {
  const [formData, setFormData] = useState<Partial<Flavor>>(INITIAL_FLAVOR)

  useEffect(() => {
    if (mode === 'edit' && flavor) {
      setFormData(flavor)
    } else {
      setFormData(INITIAL_FLAVOR)
    }
  }, [flavor, mode, open])

  const handleSave = async () => {
    const success = await onSave(formData)
    if (success) {
      setFormData(INITIAL_FLAVOR)
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setFormData(INITIAL_FLAVOR)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="overflow-y-auto p-0"
      >
        <div className="sticky top-0 z-10 border-b border-[rgba(56,56,54,0.08)] bg-white/95 backdrop-blur-sm px-6 py-6">
          <SheetHeader>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.52)]">
              {mode === 'create' ? 'Nuevo sabor' : 'Editar sabor'}
            </p>

            <SheetTitle className="font-bebas text-2xl font-semibold text-[rgb(56,56,54)]">
              {mode === 'create'
                ? 'Añadir nuevo sabor'
                : `Editar sabor: ${flavor?.name}`}
            </SheetTitle>

            <SheetDescription className="mt-2 text-sm leading-relaxed text-[rgba(56,56,54,0.68)]">
              {mode === 'create'
                ? 'Crea un nuevo sabor, define sus precios por porción y configura su disponibilidad por tienda.'
                : `Actualiza la información, precios y disponibilidad de ${flavor?.name}.`}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="space-y-8 px-6 py-6">
          {/* Datos principales */}
          <section className="space-y-5">
            <div>
              <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.48)]">
                Información principal
              </p>
              <div className="grid gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="flavor-name"
                    className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.60)]"
                  >
                    Nombre del sabor
                  </Label>
                  <Input
                    id="flavor-name"
                    value={formData.name || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ej: Mango Tropical"
                    className="
                      h-12 rounded-xl border-[rgba(56,56,54,0.10)]
                      bg-white/75 text-[rgb(56,56,54)]
                      placeholder:text-[rgba(56,56,54,0.38)]
                      shadow-none transition-all duration-300
                      focus:border-[rgba(56,56,54,0.22)] focus:ring-0
                    "
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.60)]">
                    Imagen del sabor
                  </Label>
                  <div
                    className="
                      rounded-2xl border border-[rgba(56,56,54,0.08)]
                      bg-[rgba(56,56,54,0.03)]
                      p-4
                    "
                  >
                    <ImageUpload
                      value={formData.image || ''}
                      onChange={(url) =>
                        setFormData((prev) => ({ ...prev, image: url }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="flavor-description"
                    className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.60)]"
                  >
                    Descripción
                  </Label>
                  <Textarea
                    id="flavor-description"
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe el sabor..."
                    rows={4}
                    className="
                      resize-none rounded-2xl border-[rgba(56,56,54,0.10)]
                      bg-white/75 text-[rgb(56,56,54)]
                      placeholder:text-[rgba(56,56,54,0.38)]
                      shadow-none transition-all duration-300
                      focus:border-[rgba(56,56,54,0.22)] focus:ring-0
                    "
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Precios */}
          <section className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.48)]">
                Precios por porción
              </p>
              <p className="text-sm text-[rgba(56,56,54,0.66)]">
                Define el precio para cada formato disponible.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(['individual', 'doble', 'mediana', 'grande'] as PortionType[]).map(
                (portion) => (
                  <div
                    key={portion}
                    className="
                      rounded-2xl border border-[rgba(56,56,54,0.08)]
                      bg-[rgba(56,56,54,0.03)]
                      p-4
                    "
                  >
                    <Label
                      htmlFor={`price-${portion}`}
                      className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.56)]"
                    >
                      {PORTION_LABELS[portion]}
                    </Label>

                    <div className="relative mt-3">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[rgba(56,56,54,0.52)]">
                        €
                      </span>
                      <Input
                        id={`price-${portion}`}
                        type="number"
                        step="0.10"
                        min="0"
                        value={formData.prices?.[portion] || 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            prices: {
                              ...prev.prices!,
                              [portion]: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="
                          h-12 rounded-xl border-[rgba(56,56,54,0.10)]
                          bg-white/80 pl-9 text-[rgb(56,56,54)]
                          shadow-none transition-all duration-300
                          focus:border-[rgba(56,56,54,0.22)] focus:ring-0
                        "
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Disponibilidad */}
          <section className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.48)]">
                Disponibilidad por tienda
              </p>
              <p className="text-sm text-[rgba(56,56,54,0.66)]">
                Selecciona en qué tiendas y tamaños estará disponible este sabor.
              </p>
            </div>

            <div
              className="
                rounded-2xl border border-[rgba(56,56,54,0.08)]
                bg-[rgba(56,56,54,0.03)]
                p-4 md:p-5
              "
            >
              <AvailabilityEditor
                availability={formData.availability || []}
                stores={stores}
                defaultPrices={formData.prices || { individual: 0, doble: 0, mediana: 0, grande: 0 }}
                onChange={(availability) =>
                  setFormData((prev) => ({ ...prev, availability }))
                }
              />
            </div>
          </section>

          {/* Estado */}
          <section>
            <div
              className="
                flex flex-col gap-4 rounded-2xl border border-[rgba(56,56,54,0.08)]
                bg-[rgba(56,56,54,0.04)] p-5
                sm:flex-row sm:items-center sm:justify-between
              "
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.48)]">
                  Estado del sabor
                </p>
                <Label
                  htmlFor="flavor-active"
                  className="mt-2 block cursor-pointer text-base font-medium text-[rgb(56,56,54)]"
                >
                  {formData.active ? 'Visible en tienda' : 'Oculto para clientes'}
                </Label>
                <p className="mt-1 text-sm text-[rgba(56,56,54,0.66)]">
                  Activa o desactiva la visibilidad de este sabor en la web.
                </p>
              </div>

              <Switch
                id="flavor-active"
                checked={formData.active || false}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, active: checked }))
                }
              />
            </div>
          </section>
        </div>

        <SheetFooter className="sticky bottom-0 border-t border-[rgba(56,56,54,0.08)] bg-white/95 backdrop-blur-sm px-6 py-5">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              className="
                rounded-xl border-[rgba(56,56,54,0.10)]
                bg-white/65 text-[rgb(56,56,54)]
                shadow-none transition-all duration-300
                hover:bg-[rgba(56,56,54,0.05)]
              "
            >
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              className="
                rounded-xl bg-[rgb(56,56,54)] text-white
                transition-all duration-300
                hover:scale-[1.02] hover:bg-[rgba(56,56,54,0.92)]
                active:scale-[0.98]
              "
            >
              {mode === 'create' ? 'Añadir sabor' : 'Guardar cambios'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}