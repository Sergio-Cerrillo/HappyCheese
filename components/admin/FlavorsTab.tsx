import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, MapPin, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FlavorCard } from './FlavorCard'
import { FlavorDialog } from './FlavorDialog'
import type { Flavor, Store } from '@/lib/types'
import { FlavorOrderEditor } from './FlavorOrderEditor'
import { sortFlavors } from '@/lib/flavor-catalog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FlavorsTabProps {
  flavors: Flavor[]
  stores: Store[]
  onAdd: (flavor: Partial<Flavor>) => Promise<boolean>
  onUpdate: (flavor: Flavor) => Promise<boolean>
  onDelete: (id: string) => void
  onReorder: (storeId: string, ids: string[]) => Promise<boolean>
}

export function FlavorsTab({
  flavors,
  stores,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: FlavorsTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null)
  const [editingOrder, setEditingOrder] = useState(false)
  const [orderStoreId, setOrderStoreId] = useState(stores[0]?.id || '')
  const unassignedFlavors = flavors.filter(flavor =>
    !flavor.availability.some(availability => availability.portions.length > 0)
  )
  const showingUnassigned = orderStoreId === 'unassigned' && unassignedFlavors.length > 0
  const orderStore = showingUnassigned ? undefined : stores.find(store => store.id === orderStoreId) || stores[0]
  const storeFlavors = orderStore ? sortFlavors(flavors.filter(flavor =>
    flavor.availability.some(availability => availability.storeId === orderStore.id && availability.portions.length > 0)
  ), orderStore.id) : []
  const visibleFlavors = showingUnassigned ? unassignedFlavors : storeFlavors
  const storeTabs = [
    ...stores.map(store => ({ id: store.id, name: store.name, count: flavors.filter(flavor => flavor.availability.some(entry => entry.storeId === store.id && entry.portions.length > 0)).length })),
    ...(unassignedFlavors.length ? [{ id: 'unassigned', name: 'Sin tienda', count: unassignedFlavors.length }] : []),
  ]

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
      <Tabs
        value={showingUnassigned ? 'unassigned' : orderStore?.id || ''}
        onValueChange={storeId => { if (!editingOrder) setOrderStoreId(storeId) }}
        className="gap-0"
      >
      <section className="space-y-6">
        <header aria-label="Gestión de sabores" className="rounded-[28px] border border-[#383836]/8 bg-white/65 px-5 py-7 shadow-[0_10px_30px_rgba(56,56,54,0.04)] backdrop-blur-xl sm:px-8 sm:py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-center lg:gap-10">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#938b7c]">Gestión de sabores</p>
            <h2 className="font-bebas text-3xl font-normal text-[#383836] md:text-4xl">Sabores disponibles</h2>
            <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-[#79756d] sm:text-sm lg:mx-0">
              Gestiona los sabores de cada tienda. Los sabores compartidos aparecen en ambas.
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-2xl border-t border-[#e8e5df] pt-6 lg:mx-0 lg:mt-0 lg:w-full lg:max-w-none lg:border-t-0 lg:pt-0">
            <p className="mb-3 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#938b7c] lg:justify-start">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> Sabores por tienda
            </p>
            {storeTabs.length ? <TabsList aria-label="Tienda de los sabores" className={cn(
              'grid h-auto w-full items-stretch gap-1.5 rounded-[20px] border border-[#e5e1d8] bg-[#f3f1eb] p-1.5',
              storeTabs.length === 1 ? 'grid-cols-1' : storeTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
            )}>
              {storeTabs.map((store, index) => <TabsTrigger key={store.id} value={store.id} disabled={editingOrder} className={cn(
                'h-auto min-h-[72px] min-w-0 flex-col gap-1.5 rounded-[14px] px-3 py-3 text-center whitespace-normal text-[#79756d] transition-colors data-[state=active]:border-[#e5e1d8] data-[state=active]:bg-white data-[state=active]:text-[#383836] data-[state=active]:shadow-[0_3px_12px_rgba(56,56,54,0.06)]',
                storeTabs.length > 2 && storeTabs.length % 2 !== 0 && index === storeTabs.length - 1 && 'col-span-2 sm:col-span-1'
              )}>
                <span className="text-xs font-medium leading-snug sm:text-sm">{store.name}</span>
                <span className="text-[9px] font-normal uppercase tracking-[0.12em] opacity-65">{store.count} {store.count === 1 ? 'sabor' : 'sabores'}</span>
              </TabsTrigger>)}
            </TabsList> : <p className="py-3 text-center text-sm text-muted-foreground">Sin tiendas disponibles</p>}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" disabled={storeFlavors.length < 2 || editingOrder} onClick={() => setEditingOrder(true)} className="h-12 min-w-0 gap-2 rounded-[14px] border-[#ded9cf] bg-white/75 px-2 text-xs text-[#625c52] shadow-none hover:border-[#b8ae9b] hover:bg-white sm:text-sm">
                <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> Editar orden
              </Button>
              <Button type="button" disabled={editingOrder} onClick={() => setIsAddDialogOpen(true)} className="h-12 min-w-0 gap-2 rounded-[14px] bg-[#383836] px-2 text-xs text-white shadow-[0_4px_12px_rgba(56,56,54,0.08)] hover:bg-[#4a4a46] sm:text-sm">
                <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Añadir sabor
              </Button>
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[#938b7c] lg:text-left">Cada tienda tiene su propio orden.</p>
          </div>
        </header>

        {/* Contenido */}
        <TabsContent value={showingUnassigned ? 'unassigned' : orderStore?.id || ''} className="mt-0">
        {editingOrder && orderStore ? <FlavorOrderEditor key={orderStore.id} flavors={storeFlavors} storeName={orderStore.name} onSave={ids => onReorder(orderStore.id, ids)} onCancel={() => setEditingOrder(false)} /> : visibleFlavors.length === 0 ? (
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
              {orderStore ? `No hay sabores asignados a ${orderStore.name}` : 'Aún no hay sabores'}
            </p>
            <p className="mt-3 text-[rgba(56,56,54,0.68)]">
              Cuando añadas un sabor y actives su disponibilidad en esta tienda, aparecerá aquí con sus precios.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {visibleFlavors.map((flavor) => (
              <FlavorCard
                key={flavor.id}
                flavor={flavor}
                stores={orderStore ? [orderStore] : stores}
                onEdit={handleEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
        </TabsContent>
      </section>
      </Tabs>

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
