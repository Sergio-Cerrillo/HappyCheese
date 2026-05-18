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
import { Switch } from '@/components/ui/switch'
import type { Store } from '@/lib/types'

interface StoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store?: Store | null
  onSave: (store: Partial<Store>) => Promise<boolean>
  mode: 'create' | 'edit'
}

const INITIAL_STORE: Partial<Store> = {
  name: '',
  address: '',
  phone: '',
  hours: '',
  coordinates: { lat: 0, lng: 0 },
  active: true
}

/**
 * Componente de diálogo para crear/editar tiendas
 * Principio Single Responsibility: Solo gestiona el formulario de tiendas
 * Principio Open/Closed: Recibe handler de guardado como prop
 */
export function StoreDialog({ open, onOpenChange, store, onSave, mode }: StoreDialogProps) {
  const [formData, setFormData] = useState<Partial<Store>>(INITIAL_STORE)

  useEffect(() => {
    if (mode === 'edit' && store) {
      setFormData(store)
    } else {
      setFormData(INITIAL_STORE)
    }
  }, [store, mode, open])

  const handleSave = async () => {
    const success = await onSave(formData)
    if (success) {
      setFormData(INITIAL_STORE)
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setFormData(INITIAL_STORE)
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
              {mode === 'create' ? 'Nueva tienda' : 'Editar tienda'}
            </p>

            <SheetTitle className="font-bebas text-2xl font-semibold text-[rgb(56,56,54)]">
              {mode === 'create'
                ? 'Añadir nueva tienda'
                : `Editar tienda: ${store?.name}`}
            </SheetTitle>

            <SheetDescription className="mt-2 text-sm leading-relaxed text-[rgba(56,56,54,0.68)]">
              {mode === 'create'
                ? 'Crea un nuevo punto de venta con sus detalles de ubicación y contacto.'
                : `Actualiza la información y detalles de ${store?.name}.`}
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
                    htmlFor="store-name"
                    className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.60)]"
                  >
                    Nombre de la tienda
                  </Label>
                  <Input
                    id="store-name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Santa Catalina"
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
                  <Label
                    htmlFor="store-address"
                    className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.60)]"
                  >
                    Dirección
                  </Label>
                  <Input
                    id="store-address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Ej: Carrer de Sant Magí, 45"
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
                  <Label
                    htmlFor="store-phone"
                    className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.60)]"
                  >
                    Teléfono
                  </Label>
                  <Input
                    id="store-phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+34 871 234 567"
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
                  <Label
                    htmlFor="store-hours"
                    className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.60)]"
                  >
                    Horario
                  </Label>
                  <Input
                    id="store-hours"
                    value={formData.hours || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hours: e.target.value }))}
                    placeholder="Lun-Sáb: 10:00 - 20:00"
                    className="
                      h-12 rounded-xl border-[rgba(56,56,54,0.10)]
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
                  Estado de la tienda
                </p>
                <Label
                  htmlFor="store-active"
                  className="mt-2 block cursor-pointer text-base font-medium text-[rgb(56,56,54)]"
                >
                  {formData.active ? 'Tienda activa' : 'Tienda inactiva'}
                </Label>
                <p className="mt-1 text-sm text-[rgba(56,56,54,0.66)]">
                  Activa o desactiva la visibilidad de esta tienda en la web.
                </p>
              </div>

              <Switch
                id="store-active"
                checked={formData.active || false}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, active: checked }))}
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
              {mode === 'create' ? 'Añadir tienda' : 'Guardar cambios'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
