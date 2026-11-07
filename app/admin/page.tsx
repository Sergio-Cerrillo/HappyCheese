"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Home, LogOut, LayoutDashboard, RefreshCw } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import { useStoresManager } from "@/hooks/use-stores-manager"
import { useFlavorsManager } from "@/hooks/use-flavors-manager"
import { useOrdersManager } from "@/hooks/use-orders-manager"
import { AdminStats } from "@/components/admin/AdminStats"
import { AdminNavigation } from "@/components/admin/AdminNavigation"
import { OrdersTab } from "@/components/admin/OrdersTab"
import { FlavorsTab } from "@/components/admin/FlavorsTab"
import { StoresTab } from "@/components/admin/StoresTab"
import { AnalyticsTab } from "@/components/admin/AnalyticsTab"
import { OrdersCalendarTab } from "@/components/admin/OrdersCalendarTab"

export default function AdminPage() {
  const router = useRouter()

  const {
    stores: allStores,
    flavors: allFlavors,
    orders: allOrders,
    loading,
    ordersRefreshing,
    ordersSyncError,
    refreshOrders,
  } = useAdminData()

  const { stores, setStores, addStore, updateStore, deleteStore } =
    useStoresManager(allStores)

  const { flavors, setFlavors, addFlavor, updateFlavor, deleteFlavor, reorderFlavors } =
    useFlavorsManager(allFlavors)

  const { orders, setOrders, updateOrderStatus } = useOrdersManager(allOrders)

  useEffect(() => {
    setStores(allStores)
  }, [allStores, setStores])

  useEffect(() => {
    setFlavors(allFlavors)
  }, [allFlavors, setFlavors])

  useEffect(() => {
    // Una consulta iniciada antes de una acción del admin puede terminar después.
    // Conservar la versión más reciente en vez de revertir su cambio en pantalla.
    setOrders(previous => allOrders.map(incoming => {
      const current = previous.find(order => order.id === incoming.id)
      return current && new Date(current.updatedAt).getTime() > new Date(incoming.updatedAt).getTime()
        ? { ...current, paymentSyncError: incoming.paymentSyncError } : incoming
    }))
  }, [allOrders, setOrders])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f6_100%)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(56,56,54,0.05)] blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-[rgba(56,56,54,0.16)] border-t-[rgb(56,56,54)]" />
            <p className="mt-4 text-sm uppercase tracking-[0.18em] text-[rgba(56,56,54,0.58)]">
              Cargando panel
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f6_100%)]">
      {/* halos decorativos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(56,56,54,0.05)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[rgba(56,56,54,0.04)] blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
        <div
          className="
            mx-auto max-w-7xl rounded-2xl
            border border-[rgba(56,56,54,0.08)]
            bg-white/62 backdrop-blur-xl
            shadow-[0_10px_30px_rgba(0,0,0,0.06)]
          "
        >
          <div className="container mx-auto flex flex-col gap-5 px-4 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="
                  flex h-12 w-12 items-center justify-center rounded-2xl
                  border border-[rgba(56,56,54,0.08)]
                  bg-[rgba(56,56,54,0.05)]
                "
              >
                <LayoutDashboard className="h-5 w-5 text-[rgb(56,56,54)]" />
              </div>

              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.52)]">
                  Administración
                </p>
                <h1 className="font-bebas text-2xl font-semibold text-[rgb(56,56,54)] md:text-3xl">
                  Panel de control
                </h1>
                <p className="mt-1 text-sm text-[rgba(56,56,54,0.66)]">
                  Gestiona pedidos, sabores y tiendas desde un mismo lugar.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                asChild
                className="
                  rounded-xl border-[rgba(56,56,54,0.10)]
                  bg-white/55 text-[rgb(56,56,54)]
                  shadow-none backdrop-blur-md
                  transition-all duration-300
                  hover:scale-[1.02] hover:bg-[rgba(56,56,54,0.05)]
                "
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Ir al sitio
                </Link>
              </Button>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="
                  rounded-xl text-[rgb(56,56,54)]
                  transition-all duration-300
                  hover:scale-[1.02] hover:bg-[rgba(56,56,54,0.05)]
                "
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <section className="relative z-10 px-4 pb-12 pt-8 md:px-6 md:pt-10">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Stats */}
          <section aria-label="Resumen de pedidos" className="rounded-[24px] border border-[#383836]/8 bg-white/65 p-3 shadow-[0_6px_24px_rgba(56,56,54,0.035)] backdrop-blur-xl sm:rounded-[28px] sm:p-5">
            <AdminStats orders={orders} />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#e8e5df] pl-3 pt-2 sm:pl-5">
              <p className="min-w-0 text-[10px] leading-relaxed text-[#938b7c] sm:text-xs" role="status">
                {ordersSyncError || (ordersRefreshing ? 'Comprobando pagos…' : 'Comprobación automática de pagos')}
              </p>
              <Button type="button" variant="ghost" aria-label="Actualizar pedidos" title="Actualizar pedidos" onClick={() => refreshOrders()} disabled={ordersRefreshing} className="h-11 w-11 shrink-0 gap-2 rounded-xl px-2 text-[#797166] hover:bg-[#f3f1eb] hover:text-[#383836] sm:w-auto sm:px-3 sm:text-xs">
                <RefreshCw className={`h-3.5 w-3.5 ${ordersRefreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} aria-hidden="true" />
                <span className="hidden sm:inline">{ordersRefreshing ? 'Actualizando…' : 'Actualizar pedidos'}</span>
              </Button>
            </div>
          </section>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="min-w-0 space-y-6">
            <AdminNavigation />

            <TabsContent value="orders" className="mt-0">
              <div
                className="
                  rounded-[30px]
                  border border-[rgba(56,56,54,0.08)]
                  bg-white/58 p-4 backdrop-blur-xl
                  shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                  md:p-6
                "
              >
                <OrdersTab orders={orders} onStatusChange={updateOrderStatus} />
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <div
                className="
                  rounded-[30px]
                  border border-[rgba(56,56,54,0.08)]
                  bg-white/58 p-4 backdrop-blur-xl
                  shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                  md:p-6
                "
              >
                <OrdersCalendarTab orders={orders} stores={stores} />
              </div>
            </TabsContent>
            <TabsContent value="flavors" className="mt-0 min-w-0">
              <FlavorsTab
                flavors={flavors}
                stores={stores}
                onAdd={addFlavor}
                onUpdate={updateFlavor}
                onDelete={deleteFlavor}
                onReorder={reorderFlavors}
              />
            </TabsContent>

            <TabsContent value="stores" className="mt-0">
              <div
                className="
                  rounded-[30px]
                  border border-[rgba(56,56,54,0.08)]
                  bg-white/58 p-4 backdrop-blur-xl
                  shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                  md:p-6
                "
              >
                <StoresTab
                  stores={stores}
                  onAdd={addStore}
                  onUpdate={updateStore}
                  onDelete={deleteStore}
                />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div
                className="
                  rounded-[30px]
                  border border-[rgba(56,56,54,0.08)]
                  bg-white/58 p-4 backdrop-blur-xl
                  shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                  md:p-6
                "
              >
                <AnalyticsTab orders={orders} stores={stores} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  )
}
