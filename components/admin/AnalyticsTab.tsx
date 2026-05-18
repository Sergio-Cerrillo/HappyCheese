"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { 
  TrendingUp, 
  ShoppingBag, 
  Euro, 
  PieChart as PieChartIcon,
  Calendar,
  Store as StoreIcon,
  BarChart3
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend
} from "recharts"
import type { Order, Store, PortionType } from "@/lib/types"

interface AnalyticsTabProps {
  orders: Order[]
  stores: Store[]
}

type Period = "30days" | "1year"

interface FlavorSales {
  name: string
  quantity: number
  revenue: number
}

interface PortionSales {
  portion: PortionType
  quantity: number
  revenue: number
}

const PORTION_LABELS: Record<PortionType, string> = {
  individual: "Individual",
  doble: "Doble",
  mediana: "Mediana (6 porciones)",
  grande: "Grande (8 porciones)",
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
]

const PORTION_COLORS: Record<PortionType, string> = {
  individual: "#3b82f6",
  doble: "#8b5cf6",
  mediana: "#ec4899",
  grande: "#f59e0b",
}

/**
 * Componente de análisis del negocio con métricas avanzadas
 * Filtrado por período y tienda
 */
export function AnalyticsTab({ orders, stores }: AnalyticsTabProps) {
  const [period, setPeriod] = useState<Period>("30days")
  const [selectedStore, setSelectedStore] = useState<string>("all")

  // Calcular fecha límite según período
  const dateLimit = useMemo(() => {
    const now = new Date()
    if (period === "30days") {
      return new Date(now.setDate(now.getDate() - 30))
    } else {
      return new Date(now.setFullYear(now.getFullYear() - 1))
    }
  }, [period])

  // Filtrar pedidos según período y tienda
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Solo pedidos completados o confirmados (no cancelados ni pendientes de pago)
      if (order.status === "cancelado" || order.paymentStatus === "failed") {
        return false
      }

      // Filtro de fecha
      const orderDate = new Date(order.createdAt)
      if (orderDate < dateLimit) return false

      // Filtro de tienda
      if (selectedStore !== "all" && order.storeId !== selectedStore) {
        return false
      }

      return true
    })
  }, [orders, dateLimit, selectedStore])

  // Calcular métricas principales
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = filteredOrders.length
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      totalRevenue,
      totalOrders,
      avgTicket,
    }
  }, [filteredOrders])

  // Análisis de tartas más vendidas
  const flavorStats = useMemo(() => {
    const flavorMap = new Map<string, FlavorSales>()

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = flavorMap.get(item.flavorName) || {
          name: item.flavorName,
          quantity: 0,
          revenue: 0,
        }

        flavorMap.set(item.flavorName, {
          name: item.flavorName,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.price * item.quantity,
        })
      })
    })

    return Array.from(flavorMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filteredOrders])

  // Análisis de porciones más vendidas
  const portionStats = useMemo(() => {
    const portionMap = new Map<PortionType, PortionSales>()

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = portionMap.get(item.portion) || {
          portion: item.portion,
          quantity: 0,
          revenue: 0,
        }

        portionMap.set(item.portion, {
          portion: item.portion,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.price * item.quantity,
        })
      })
    })

    return Array.from(portionMap.values())
      .sort((a, b) => b.revenue - a.revenue)
  }, [filteredOrders])

  // Análisis por tienda (cuando está en "todas")
  const storeStats = useMemo(() => {
    if (selectedStore !== "all") return []

    const storeMap = new Map<string, { name: string; orders: number; revenue: number }>()

    filteredOrders.forEach((order) => {
      const current = storeMap.get(order.storeId) || {
        name: order.storeName,
        orders: 0,
        revenue: 0,
      }

      storeMap.set(order.storeId, {
        name: order.storeName,
        orders: current.orders + 1,
        revenue: current.revenue + order.total,
      })
    })

    return Array.from(storeMap.values()).sort((a, b) => b.revenue - a.revenue)
  }, [filteredOrders, selectedStore])

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Últimos 30 días</SelectItem>
                <SelectItem value="1year">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <StoreIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tiendas</SelectItem>
                {stores
                  .filter((s) => s.active)
                  .map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Facturación Total
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {metrics.totalRevenue.toFixed(2)}€
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Pedidos
                </p>
                <p className="mt-2 text-3xl font-bold">{metrics.totalOrders}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ticket Medio
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {metrics.avgTicket.toFixed(2)}€
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {/* Tartas más vendidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tartas Más Vendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flavorStats.length > 0 ? (
              <div className="space-y-6">
                {/* Gráfico de barras */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-125 h-80">
                    <ChartContainer
                      config={flavorStats.slice(0, 5).reduce((acc, flavor, index) => ({
                        ...acc,
                        [flavor.name]: {
                          label: flavor.name,
                          color: CHART_COLORS[index],
                        },
                      }), {})}
                      className="h-full w-full"
                    >
                      <BarChart 
                        data={flavorStats.slice(0, 10)} 
                        margin={{ top: 20, right: 20, left: 20, bottom: 80 }}
                        width={500}
                        height={320}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 11 }}
                          interval={0}
                        />
                        <YAxis 
                          tick={{ fontSize: 11 }}
                          label={{ value: 'Ingresos (€)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent 
                              className="w-50"
                              formatter={(value, name) => [
                                `${Number(value).toFixed(2)}€`,
                                name
                              ]}
                            />
                          }
                        />
                        <Bar 
                          dataKey="revenue" 
                          radius={[8, 8, 0, 0]}
                          fill="hsl(var(--primary))"
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>

                {/* Tabla detallada */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sabor</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flavorStats.map((flavor, index) => (
                        <TableRow key={flavor.name}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {index + 1}
                              </span>
                              <span className="truncate">{flavor.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{flavor.quantity}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {flavor.revenue.toFixed(2)}€
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay datos disponibles para el período seleccionado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Porciones más vendidas */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribución de Porciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portionStats.length > 0 ? (
                <div className="flex items-center justify-center w-full">
                  <div className="h-80 w-full max-w-md">
                    <ChartContainer
                      config={portionStats.reduce((acc, portion) => ({
                        ...acc,
                        [portion.portion]: {
                          label: PORTION_LABELS[portion.portion],
                          color: PORTION_COLORS[portion.portion],
                        },
                      }), {})}
                      className="h-full w-full"
                    >
                      <PieChart>
                        <Pie
                          data={portionStats.map(p => ({
                            name: PORTION_LABELS[p.portion],
                            value: p.revenue,
                            quantity: p.quantity,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => {
                            // Usar nombre corto para mejor visualización
                            const shortName = name.split(' ')[0]
                            return `${shortName}: ${(percent * 100).toFixed(0)}%`
                          }}
                          outerRadius={100}
                          innerRadius={0}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {portionStats.map((portion, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={PORTION_COLORS[portion.portion]} 
                            />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent 
                              hideLabel
                              formatter={(value, name, props) => [
                                `${Number(value).toFixed(2)}€ (${props.payload.quantity} unidades)`,
                                name
                              ]}
                            />
                          }
                        />
                      </PieChart>
                    </ChartContainer>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay datos disponibles para el período seleccionado
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Detalle de Porciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portionStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Porción</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portionStats.map((portion, index) => (
                        <TableRow key={portion.portion}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{ backgroundColor: PORTION_COLORS[portion.portion] }}
                              />
                              <span className="truncate">{PORTION_LABELS[portion.portion]}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{portion.quantity}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {portion.revenue.toFixed(2)}€
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay datos disponibles para el período seleccionado
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Análisis por tienda (solo cuando se muestran todas) */}
      {selectedStore === "all" && storeStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StoreIcon className="h-5 w-5" />
              Rendimiento por Tienda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Gráfico comparativo */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-100 h-80">
                  <ChartContainer
                    config={storeStats.reduce((acc, store, index) => ({
                      ...acc,
                      [store.name]: {
                        label: store.name,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                      },
                    }), {})}
                    className="h-full w-full"
                  >
                    <BarChart 
                      data={storeStats} 
                      margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                      width={400}
                      height={320}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 11 }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Facturación (€)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent 
                            className="w-55"
                            formatter={(value, name, props) => {
                              if (name === 'revenue') {
                                return [`${Number(value).toFixed(2)}€`, 'Facturación']
                              }
                              return [value, name]
                            }}
                          />
                        }
                      />
                      <Bar 
                        dataKey="revenue" 
                        radius={[8, 8, 0, 0]}
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>

              {/* Tabla detallada */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tienda</TableHead>
                      <TableHead className="text-right">Pedidos</TableHead>
                      <TableHead className="text-right">Facturación</TableHead>
                      <TableHead className="text-right">Ticket Medio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storeStats.map((store, index) => (
                      <TableRow key={store.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {index + 1}
                            </span>
                            <span className="truncate">{store.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{store.orders}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {store.revenue.toFixed(2)}€
                        </TableCell>
                        <TableCell className="text-right">
                          {(store.revenue / store.orders).toFixed(2)}€
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
