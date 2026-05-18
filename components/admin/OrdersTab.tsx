import { useState } from 'react'
import { OrderCard } from './OrderCard'
import type { Order } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Filter } from 'lucide-react'

interface OrdersTabProps {
  orders: Order[]
  onStatusChange: (id: string, status: Order['status']) => void
}

export function OrdersTab({ orders, onStatusChange }: OrdersTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [storeFilter, setStoreFilter] = useState<string>('todas')

  // Ordenar por más reciente primero
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Aplicar filtros
  const filteredOrders = sortedOrders.filter((order) => {
    // Filtro de búsqueda (cliente, email, teléfono, ID)
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.customerEmail.toLowerCase().includes(searchLower) ||
      order.customerPhone.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower)

    // Filtro de estado
    const matchesStatus = statusFilter === 'todos' || order.status === statusFilter

    // Filtro de tienda
    const matchesStore = storeFilter === 'todas' || order.storeId === storeFilter

    return matchesSearch && matchesStatus && matchesStore
  })

  // Obtener tiendas únicas
  const stores = Array.from(new Set(orders.map((o) => o.storeId)))

  return (
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
              Gestión de pedidos
            </p>

            <h2 className="font-bebas text-2xl font-semibold text-[rgb(56,56,54)] md:text-3xl">
              Registro de pedidos
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-[rgba(56,56,54,0.68)]">
              Gestiona, revisa y actualiza el estado de todos los pedidos realizados.
            </p>
          </div>

          <div
            className="
              rounded-[18px]
              border border-[rgba(56,56,54,0.08)]
              bg-[rgba(56,56,54,0.03)]
              px-4 py-3
              text-right
            "
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.48)]">
              Total pedidos
            </p>
            <p className="mt-1 text-2xl font-semibold text-[rgb(56,56,54)]">
              {filteredOrders.length} / {orders.length}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div
        className="
          rounded-[28px]
          border border-[rgba(56,56,54,0.08)]
          bg-white/58 backdrop-blur-xl
          shadow-[0_10px_30px_rgba(0,0,0,0.04)]
          px-6 py-5 md:px-8
        "
      >
        {/* Tabs de Tiendas */}
        <div className="mb-5">
          <Tabs value={storeFilter} onValueChange={setStoreFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[rgba(56,56,54,0.06)] rounded-xl p-1">
              <TabsTrigger
                value="todas"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[rgb(56,56,54)] data-[state=active]:shadow-sm"
              >
                Todas las tiendas
              </TabsTrigger>
              {stores.map((storeId) => {
                const storeName = orders.find((o) => o.storeId === storeId)?.storeName || storeId
                return (
                  <TabsTrigger
                    key={storeId}
                    value={storeId}
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[rgb(56,56,54)] data-[state=active]:shadow-sm"
                  >
                    {storeName}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(56,56,54,0.4)]" />
            <Input
              placeholder="Buscar por cliente, email, teléfono o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border-[rgba(56,56,54,0.1)] bg-white/75 pl-10 placeholder:text-[rgba(56,56,54,0.4)]"
            />
          </div>

          {/* Filtro por Estado */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[rgba(56,56,54,0.4)] pointer-events-none" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl border-[rgba(56,56,54,0.1)] bg-white/75 pl-10">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contador de resultados */}
        {(searchQuery || statusFilter !== 'todos' || storeFilter !== 'todas') && (
          <div className="mt-4 text-center">
            <p className="text-sm text-[rgba(56,56,54,0.6)]">
              Mostrando <strong className="text-[rgb(56,56,54)]">{filteredOrders.length}</strong> de{' '}
              <strong className="text-[rgb(56,56,54)]">{orders.length}</strong> pedidos
            </p>
          </div>
        )}
      </div>

      {/* Contenido */}
      {filteredOrders.length === 0 ? (
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
            {orders.length === 0 ? 'Aún no hay pedidos' : 'No hay pedidos que coincidan con los filtros'}
          </p>
          <p className="mt-3 text-[rgba(56,56,54,0.68)]">
            {orders.length === 0 
              ? 'Cuando entren nuevos pedidos, aparecerán aquí con todos sus detalles.'
              : 'Intenta ajustar los filtros de búsqueda para ver más resultados.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </section>
  )
}