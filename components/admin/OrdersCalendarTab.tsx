"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Order } from "@/lib/types"
import { Calendar as CalendarIcon } from "lucide-react"

import type { Store } from "@/lib/types"

interface OrdersCalendarTabProps {
  orders: Order[]
  stores: Store[]
}

function getMonthMatrix(year: number, month: number) {
  // Devuelve una matriz de semanas con los días del mes (0 = vacío)
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const matrix: (number | null)[][] = []
  let week: (number | null)[] = []
  let dayOfWeek = firstDay.getDay() // 0=domingo
  // Rellenar huecos antes del primer día
  for (let i = 0; i < dayOfWeek; i++) week.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(d)
    if (week.length === 7) {
      matrix.push(week)
      week = []
    }
  }
  // Rellenar huecos al final
  if (week.length) {
    while (week.length < 7) week.push(null)
    matrix.push(week)
  }
  return matrix
}

export function OrdersCalendarTab({ orders, stores }: OrdersCalendarTabProps) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [activeStore, setActiveStore] = useState<string>(stores[0]?.id || "")

  // Filtrar pedidos por tienda activa
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => order.storeId === activeStore)
  }, [orders, activeStore])

  // Agrupar pedidos por día
  const ordersByDay = useMemo(() => {
    const map: Record<string, Order[]> = {}
    filteredOrders.forEach((order) => {
      const date = new Date(order.pickupDate || order.createdAt)
      if (date.getMonth() === month && date.getFullYear() === year) {
        const key = date.getDate().toString()
        if (!map[key]) map[key] = []
        map[key].push(order)
      }
    })
    return map
  }, [filteredOrders, month, year])

  const monthMatrix = useMemo(() => getMonthMatrix(year, month), [year, month])
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs de tiendas */}
      <div className="flex flex-wrap gap-2 justify-center mb-2">
        {stores.map((store) => (
          <button
            key={store.id}
            className={cn(
              "px-5 py-2 rounded-xl font-medium text-sm transition-all border",
              activeStore === store.id
                ? "bg-[rgb(56,56,54)] text-white border-[rgb(56,56,54)] shadow"
                : "bg-white/80 text-[rgb(56,56,54)] border-[rgba(56,56,54,0.12)] hover:bg-[rgba(56,56,54,0.06)]"
            )}
            onClick={() => {
              setActiveStore(store.id)
              setSelectedDay(null)
            }}
          >
            {store.name}
          </button>
        ))}
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Calendario */}
        <Card className="flex-1 bg-white/58 border border-[rgba(56,56,54,0.08)] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[28px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[rgb(56,56,54)]">
              <CalendarIcon className="h-5 w-5 text-[rgba(56,56,54,0.68)]" />
              Calendario de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <button
                className="text-[rgba(56,56,54,0.38)] hover:text-[rgb(56,56,54)]"
                onClick={() => {
                  if (month === 0) {
                    setMonth(11)
                    setYear((y) => y - 1)
                  } else {
                    setMonth((m) => m - 1)
                  }
                  setSelectedDay(null)
                }}
              >
                &#8592;
              </button>
              <span className="text-lg font-semibold text-[rgb(56,56,54)]">
                {monthNames[month]} {year}
              </span>
              <button
                className="text-[rgba(56,56,54,0.38)] hover:text-[rgb(56,56,54)]"
                onClick={() => {
                  if (month === 11) {
                    setMonth(0)
                    setYear((y) => y + 1)
                  } else {
                    setMonth((m) => m + 1)
                  }
                  setSelectedDay(null)
                }}
              >
                &#8594;
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((wd) => (
                <div key={wd} className="text-xs text-[rgba(56,56,54,0.38)] text-center py-1">
                  {wd}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthMatrix.flat().map((day, idx) => {
                const hasOrders = day && ordersByDay[day]
                return (
                  <button
                    key={idx}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all border",
                      day
                        ? hasOrders
                          ? selectedDay === day
                            ? "bg-[rgba(34,197,94,0.12)] border-[rgb(21,128,61)] text-[rgb(21,128,61)] shadow-lg"
                            : "bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.18)] text-[rgb(21,128,61)] hover:bg-[rgba(34,197,94,0.18)]"
                          : "bg-white/58 border-[rgba(56,56,54,0.08)] text-[rgba(56,56,54,0.38)] hover:bg-[rgba(56,56,54,0.06)]"
                        : "bg-transparent border-transparent cursor-default"
                    )}
                    disabled={!day}
                    onClick={() => day && setSelectedDay(day)}
                  >
                    {day || ""}
                    {hasOrders && (
                      <span className="text-xs mt-1 font-normal">
                        {ordersByDay[day]?.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lista de pedidos del día seleccionado */}
        <Card className="w-full md:w-[380px] bg-white/58 border border-[rgba(56,56,54,0.08)] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] rounded-[28px]">
          <CardHeader>
            <CardTitle className="text-[rgb(56,56,54)] text-base">
              {selectedDay
                ? `Pedidos del ${selectedDay} de ${monthNames[month]}`
                : "Selecciona un día"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDay && ordersByDay[selectedDay]?.length ? (
              <ul className="space-y-3">
                {ordersByDay[selectedDay].map((order) => (
                  <li
                    key={order.id}
                    className="rounded-xl bg-white/80 border border-[rgba(56,56,54,0.08)] px-4 py-3 flex flex-col gap-1 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[rgba(56,56,54,0.38)] font-mono">{order.id}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-semibold",
                        order.status === "completado"
                          ? "bg-[rgba(34,197,94,0.12)] text-[rgb(21,128,61)]"
                          : order.status === "pendiente"
                          ? "bg-[rgba(253,224,71,0.12)] text-[rgb(202,138,4)]"
                          : "bg-[rgba(56,56,54,0.08)] text-[rgb(56,56,54)]"
                      )}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-medium text-[rgb(56,56,54)]">
                        {order.customerName}
                      </span>
                      <span className="font-semibold text-[rgb(21,128,61)]">
                        {order.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                      </span>
                    </div>
                    <div className="text-xs text-[rgba(56,56,54,0.38)]">
                      {order.items.length} artículo{order.items.length !== 1 ? "s" : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[rgba(56,56,54,0.38)] text-sm text-center py-8">
                {selectedDay ? "No hay pedidos para este día." : ""}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
