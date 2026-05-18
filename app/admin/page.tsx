"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, LogOut, LayoutDashboard } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import { useStoresManager } from "@/hooks/use-stores-manager"
import { useFlavorsManager } from "@/hooks/use-flavors-manager"
import { useOrdersManager } from "@/hooks/use-orders-manager"
import { AdminStats } from "@/components/admin/AdminStats"
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
  } = useAdminData()

  const { stores, setStores, addStore, updateStore, deleteStore } =
    useStoresManager(allStores)

  const { flavors, setFlavors, addFlavor, updateFlavor, deleteFlavor } =
    useFlavorsManager(allFlavors)

  const { orders, setOrders, updateOrderStatus } = useOrdersManager(allOrders)

  useEffect(() => {
    setStores(allStores)
  }, [allStores, setStores])

  useEffect(() => {
    setFlavors(allFlavors)
  }, [allFlavors, setFlavors])

  useEffect(() => {
    setOrders(allOrders)
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
          <div
            className="
              rounded-[30px]
              border border-[rgba(56,56,54,0.08)]
              bg-white/56 p-4 backdrop-blur-xl
              shadow-[0_10px_30px_rgba(0,0,0,0.04)]
              md:p-6
            "
          >
            <AdminStats orders={orders} />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="space-y-6">
            <div
              className="
                rounded-[28px]
                border border-[rgba(56,56,54,0.08)]
                bg-white/56 p-3 backdrop-blur-xl
                shadow-[0_10px_30px_rgba(0,0,0,0.04)]
              "
            >
              <TabsList
                className="
                  grid h-auto w-full max-w-5xl grid-cols-5
                  rounded-2xl border border-[rgba(56,56,54,0.06)]
                  bg-[rgba(56,56,54,0.04)] p-1.5
                "
              >
                <TabsTrigger
                  value="orders"
                  className="
                    rounded-xl py-3 text-sm font-medium
                    text-[rgba(56,56,54,0.68)]
                    transition-all duration-300
                    hover:text-[rgb(56,56,54)]
                    hover:bg-[rgba(56,56,54,0.04)]
                    data-[state=active]:border
                    data-[state=active]:border-[rgba(56,56,54,0.08)]
                    data-[state=active]:bg-white/85
                    data-[state=active]:text-[rgb(56,56,54)]
                    data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                  "
                >
                  Pedidos
                </TabsTrigger>

                <TabsTrigger
                  value="flavors"
                  className="
                    rounded-xl py-3 text-sm font-medium
                    text-[rgba(56,56,54,0.68)]
                    transition-all duration-300
                    hover:text-[rgb(56,56,54)]
                    hover:bg-[rgba(56,56,54,0.04)]
                    data-[state=active]:border
                    data-[state=active]:border-[rgba(56,56,54,0.08)]
                    data-[state=active]:bg-white/85
                    data-[state=active]:text-[rgb(56,56,54)]
                    data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                  "
                >
                  Sabores
                </TabsTrigger>

                <TabsTrigger
                  value="stores"
                  className="
                    rounded-xl py-3 text-sm font-medium
                    text-[rgba(56,56,54,0.68)]
                    transition-all duration-300
                    hover:text-[rgb(56,56,54)]
                    hover:bg-[rgba(56,56,54,0.04)]
                    data-[state=active]:border
                    data-[state=active]:border-[rgba(56,56,54,0.08)]
                    data-[state=active]:bg-white/85
                    data-[state=active]:text-[rgb(56,56,54)]
                    data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                  "
                >
                  Tiendas
                </TabsTrigger>

                <TabsTrigger
                  value="analytics"
                  className="
                    rounded-xl py-3 text-sm font-medium
                    text-[rgba(56,56,54,0.68)]
                    transition-all duration-300
                    hover:text-[rgb(56,56,54)]
                    hover:bg-[rgba(56,56,54,0.04)]
                    data-[state=active]:border
                    data-[state=active]:border-[rgba(56,56,54,0.08)]
                    data-[state=active]:bg-white/85
                    data-[state=active]:text-[rgb(56,56,54)]
                    data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                  "
                >
                  Análisis
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="
                    rounded-xl py-3 text-sm font-medium
                    text-[rgba(56,56,54,0.68)]
                    transition-all duration-300
                    hover:text-[rgb(56,56,54)]
                    hover:bg-[rgba(56,56,54,0.04)]
                    data-[state=active]:border
                    data-[state=active]:border-[rgba(56,56,54,0.08)]
                    data-[state=active]:bg-white/85
                    data-[state=active]:text-[rgb(56,56,54)]
                    data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                  "
                >
                  Calendario de Pedidos
                </TabsTrigger>
              </TabsList>
            </div>

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
            <TabsContent value="flavors" className="mt-0">
              <div
                className="
                  rounded-[30px]
                  border border-[rgba(56,56,54,0.08)]
                  bg-white/58 p-4 backdrop-blur-xl
                  shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                  md:p-6
                "
              >
                <FlavorsTab
                  flavors={flavors}
                  stores={stores}
                  onAdd={addFlavor}
                  onUpdate={updateFlavor}
                  onDelete={deleteFlavor}
                />
              </div>
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