import { ShoppingBag, TrendingUp } from 'lucide-react'
import type { Order } from '@/lib/types'
import { getOrderRevenue } from '@/lib/order-status'

interface AdminStatsProps {
  orders: Order[]
}

export function AdminStats({ orders }: AdminStatsProps) {
  const totalRevenue = orders.reduce((sum, order) => sum + getOrderRevenue(order), 0)

  return (
    <dl aria-label="Resumen del negocio" className="grid min-w-0 grid-cols-2 divide-x divide-[#e5e1d8]">
      <div className="min-w-0 px-3 py-2 sm:px-5 sm:py-3">
        <dt className="flex items-center gap-1.5 text-[10px] text-[#797166] sm:gap-2 sm:text-xs">
          <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-[#938b7c] sm:h-4 sm:w-4" strokeWidth={1.5} aria-hidden="true" /> Total pedidos
        </dt>
        <dd className="mt-2 whitespace-nowrap text-[clamp(1.125rem,5.5vw,1.75rem)] font-semibold leading-none tracking-tight text-[#383836] tabular-nums sm:mt-3 sm:text-3xl">{orders.length.toLocaleString('es-ES')}</dd>
      </div>
      <div className="min-w-0 px-3 py-2 sm:px-5 sm:py-3">
        <dt className="flex items-center gap-1.5 text-[10px] text-[#797166] sm:gap-2 sm:text-xs">
          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#938b7c] sm:h-4 sm:w-4" strokeWidth={1.5} aria-hidden="true" /> Ingresos
        </dt>
        <dd className="mt-2 whitespace-nowrap text-[clamp(1.125rem,5.5vw,1.75rem)] font-semibold leading-none tracking-tight text-[#383836] tabular-nums sm:mt-3 sm:text-3xl">{totalRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 })}</dd>
      </div>
    </dl>
  )
}
