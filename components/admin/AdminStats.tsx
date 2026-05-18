import { Card, CardContent } from '@/components/ui/card'
import { ShoppingBag, TrendingUp } from 'lucide-react'
import type { Order } from '@/lib/types'

interface AdminStatsProps {
  orders: Order[]
}

/**
 * Componente para mostrar estadísticas del dashboard
 * Principio Single Responsibility: Solo muestra estadísticas
 */
export function AdminStats({ orders }: AdminStatsProps) {
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pedidos</p>
              <p className="text-3xl font-bold">{orders.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos</p>
              <p className="text-3xl font-bold">{totalRevenue.toFixed(0)}€</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
