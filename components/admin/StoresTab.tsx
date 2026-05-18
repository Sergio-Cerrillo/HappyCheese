import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { StoreCard } from './StoreCard'
import { StoreDialog } from './StoreDialog'
import type { Store } from '@/lib/types'

interface StoresTabProps {
  stores: Store[]
  onAdd: (store: Partial<Store>) => Promise<boolean>
  onUpdate: (store: Store) => Promise<boolean>
  onDelete: (id: string) => void
}

export function StoresTab({
  stores,
  onAdd,
  onUpdate,
  onDelete,
}: StoresTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async (store: Partial<Store>) => {
    const success = await onUpdate({ ...editingStore!, ...store })
    if (success) {
      setEditingStore(null)
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
                Gestión de tiendas
              </p>

              <h2 className="font-bebas text-2xl font-semibold text-[rgb(56,56,54)] md:text-3xl">
                Tiendas disponibles
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-[rgba(56,56,54,0.68)]">
                Añade, edita y configura las tiendas físicas donde estarán disponibles tus pedidos.
              </p>
            </div>


          </div>
        </div>

        {/* Contenido */}
        {stores.length === 0 ? (
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
              Aún no hay tiendas
            </p>
            <p className="mt-3 text-[rgba(56,56,54,0.68)]">
              Cuando añadas la primera, aparecerá aquí con su información y configuración.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onEdit={handleEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>



      <StoreDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        store={editingStore}
        onSave={handleUpdate}
        mode="edit"
      />
    </>
  )
}