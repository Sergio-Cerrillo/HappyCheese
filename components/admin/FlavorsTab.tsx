import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { FlavorCard } from './FlavorCard'
import { FlavorDialog } from './FlavorDialog'
import type { Flavor, Store } from '@/lib/types'

interface FlavorsTabProps {
  flavors: Flavor[]
  stores: Store[]
  onAdd: (flavor: Partial<Flavor>) => Promise<boolean>
  onUpdate: (flavor: Flavor) => Promise<boolean>
  onDelete: (id: string) => void
}

export function FlavorsTab({
  flavors,
  stores,
  onAdd,
  onUpdate,
  onDelete,
}: FlavorsTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null)

  const handleEdit = (flavor: Flavor) => {
    setEditingFlavor(flavor)
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async (flavor: Partial<Flavor>) => {
    const success = await onUpdate({ ...editingFlavor!, ...flavor })
    if (success) {
      setEditingFlavor(null)
    }
    return success
  }

  return (
    <>
      <section className="space-y-6">
        {/* Cabecera */}
        <div
          className="
            rounded-[28px]
            border border-[rgba(56,56,54,0.08)]
            bg-white/58 backdrop-blur-xl
            shadow-[0_10px_30px_rgba(0,0,0,0.04)]
            px-6 py-6 md:px-8
          "
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.52)]">
                Gestión de sabores
              </p>

              <h2 className="font-bebas text-2xl font-semibold text-[rgb(56,56,54)] md:text-3xl">
                Sabores disponibles
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-[rgba(56,56,54,0.68)]">
                Añade, edita y configura la disponibilidad de cada sabor por
                tienda y tipo de porción.
              </p>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="
                    gap-2 rounded-xl
                    bg-[rgb(56,56,54)] text-white
                    transition-all duration-300
                    hover:scale-[1.02] hover:bg-[rgba(56,56,54,0.92)]
                    active:scale-[0.98]
                  "
                >
                  <Plus className="h-4 w-4" />
                  Añadir sabor
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Contenido */}
        {flavors.length === 0 ? (
          <div
            className="
              rounded-[28px]
              border border-[rgba(56,56,54,0.08)]
              bg-white/54 backdrop-blur-xl
              px-6 py-14 text-center
              shadow-[0_10px_30px_rgba(0,0,0,0.04)]
            "
          >
            <p className="text-sm uppercase tracking-[0.16em] text-[rgba(56,56,54,0.48)]">
              Aún no hay sabores
            </p>
            <p className="mt-3 text-[rgba(56,56,54,0.68)]">
              Cuando añadas el primero, aparecerá aquí con su disponibilidad y precios.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {flavors.map((flavor) => (
              <FlavorCard
                key={flavor.id}
                flavor={flavor}
                stores={stores}
                onEdit={handleEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>

      <FlavorDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        stores={stores}
        onSave={onAdd}
        mode="create"
      />

      <FlavorDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        flavor={editingFlavor}
        stores={stores}
        onSave={handleUpdate}
        mode="edit"
      />
    </>
  )
}