import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Clock } from 'lucide-react'
import type { Order, PortionType } from '@/lib/types'

interface OrderCardProps {
  order: Order
  onStatusChange: (id: string, status: Order['status']) => void
}

const PORTION_LABELS: Record<PortionType, string> = {
  individual: 'Individual',
  doble: 'Doble',
  mediana: 'Mediana',
  grande: 'Grande',
}

function getStatusBadgeClasses(status: Order['status']) {
  switch (status) {
    case 'completado':
      return 'border-0 bg-[rgba(34,197,94,0.12)] text-[rgb(21,128,61)]'
    case 'confirmado':
      return 'border-0 bg-[rgba(59,130,246,0.12)] text-[rgb(29,78,216)]'
    case 'cancelado':
      return 'border-0 bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]'
    default:
      return 'border-0 bg-[rgba(56,56,54,0.08)] text-[rgb(56,56,54)]'
  }
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  return (
    <div
      className="
        rounded-[28px]
        border border-[rgba(56,56,54,0.08)]
        bg-white/58 backdrop-blur-xl
        shadow-[0_10px_30px_rgba(0,0,0,0.04)]
        px-6 py-6 md:px-7
        transition-all duration-300
        hover:-translate-y-[2px]
        hover:shadow-[0_14px_40px_rgba(0,0,0,0.06)]
      "
    >
      {/* Top */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[rgba(56,56,54,0.05)] px-3 py-1 font-mono text-sm font-semibold text-[rgb(56,56,54)]">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>

            <Badge className={getStatusBadgeClasses(order.status)}>
              {order.status}
            </Badge>
          </div>

          <p className="text-sm text-[rgba(56,56,54,0.52)]">
            {new Date(order.createdAt).toLocaleString('es-ES')}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <p className="font-bebas text-3xl leading-none text-[rgb(56,56,54)] md:text-4xl">
            {order.total.toFixed(2)}€
          </p>

          <Select
            value={order.status}
            onValueChange={(value) => onStatusChange(order.id, value as Order['status'])}
          >
            <SelectTrigger
              className="
                w-[190px] rounded-xl
                border-[rgba(56,56,54,0.12)]
                bg-white/80
                text-[rgb(56,56,54)]
              "
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Middle */}
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <div
          className="
            rounded-[20px]
            border border-[rgba(56,56,54,0.08)]
            bg-[rgba(56,56,54,0.02)]
            p-4
          "
        >
          <h4 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.48)]">
            Cliente
          </h4>

          <p className="font-medium text-[rgb(56,56,54)]">{order.customerName}</p>
          <p className="mt-1 text-sm text-[rgba(56,56,54,0.62)]">{order.customerEmail}</p>
          <p className="text-sm text-[rgba(56,56,54,0.62)]">{order.customerPhone}</p>
        </div>

        <div
          className="
            rounded-[20px]
            border border-[rgba(56,56,54,0.08)]
            bg-[rgba(56,56,54,0.02)]
            p-4
          "
        >
          <h4 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.48)]">
            Recogida
          </h4>

          <p className="flex items-center gap-2 font-medium text-[rgb(56,56,54)]">
            <MapPin className="h-4 w-4 shrink-0" />
            {order.storeName}
          </p>

          <p className="mt-1 flex items-center gap-2 text-sm text-[rgba(56,56,54,0.62)]">
            <Clock className="h-4 w-4 shrink-0" />
            {new Date(order.pickupDate + 'T' + order.pickupTime).toLocaleString('es-ES')}
          </p>
        </div>
      </div>

      {/* Products */}
      <div
        className="
          rounded-[20px]
          border border-[rgba(56,56,54,0.08)]
          bg-[rgba(56,56,54,0.02)]
          p-4
        "
      >
        <h4 className="mb-3 text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.48)]">
          Productos
        </h4>

        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-[rgba(56,56,54,0.78)]">
                {item.quantity}x {item.flavorName} ({PORTION_LABELS[item.portion]})
              </span>

              <span className="font-medium text-[rgb(56,56,54)]">
                {(item.price * item.quantity).toFixed(2)}€
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mt-5 border-t border-[rgba(56,56,54,0.08)] pt-5">
          <h4 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.48)]">
            Notas
          </h4>
          <p className="text-sm leading-relaxed text-[rgba(56,56,54,0.72)]">
            {order.notes}
          </p>
        </div>
      )}
    </div>
  )
}