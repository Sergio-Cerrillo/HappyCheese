import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock3,
  CreditCard,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { Order, PortionType } from '@/lib/types'
import { canConfirmOrder, getPaymentLabel } from '@/lib/order-status'
import { cn } from '@/lib/utils'
import { StripeAttemptDetails } from './StripeAttemptDetails'

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

const ORDER_STATES: Record<Order['status'], { label: string; icon: LucideIcon; badge: string; accent: string }> = {
  pendiente: {
    label: 'Pendiente', icon: Clock3,
    badge: 'border-amber-200/70 bg-amber-50 text-amber-800', accent: 'bg-amber-400',
  },
  confirmado: {
    label: 'Confirmado', icon: CircleCheck,
    badge: 'border-sky-200/70 bg-sky-50 text-sky-800', accent: 'bg-sky-400',
  },
  completado: {
    label: 'Completado', icon: PackageCheck,
    badge: 'border-emerald-200/70 bg-emerald-50 text-emerald-800', accent: 'bg-emerald-500',
  },
  cancelado: {
    label: 'Cancelado', icon: CircleX,
    badge: 'border-rose-200/70 bg-rose-50 text-rose-800', accent: 'bg-rose-300',
  },
}

function paymentAppearance(status: Order['paymentStatus']): { icon: LucideIcon; classes: string } {
  switch (status) {
    case 'paid':
      return { icon: CircleCheck, classes: 'border-emerald-200/80 bg-emerald-50 text-emerald-800' }
    case 'failed':
      return { icon: CircleX, classes: 'border-rose-200/80 bg-rose-50 text-rose-800' }
    case 'refunded':
      return { icon: RotateCcw, classes: 'border-stone-200 bg-stone-100 text-stone-700' }
    case 'partially_refunded':
      return { icon: RotateCcw, classes: 'border-amber-200/80 bg-amber-50 text-amber-800' }
    case 'expired':
      return { icon: Clock3, classes: 'border-stone-200 bg-stone-100 text-stone-600' }
    default:
      return { icon: Clock3, classes: 'border-amber-200/80 bg-amber-50 text-amber-800' }
  }
}

const money = (value: number) => Number(value).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const state = ORDER_STATES[order.status] || ORDER_STATES.pendiente
  const StateIcon = state.icon
  const payment = paymentAppearance(order.paymentStatus)
  const PaymentIcon = payment.icon
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0)
  const statusId = `order-status-${order.id}`
  const created = new Date(order.createdAt)
  const pickup = new Date(`${order.pickupDate}T12:00:00`)
  const stripeDashboard = `https://dashboard.stripe.com/${order.stripeSessionId?.startsWith('cs_test_') ? 'test/' : ''}`
  const stripeLink = order.status !== 'cancelado' && order.paymentStatus !== 'expired' && order.stripePaymentIntentId
    ? { href: `${stripeDashboard}payments/${encodeURIComponent(order.stripePaymentIntentId)}`, label: 'Ver pago en Stripe' }
    : null

  return (
    <article
      aria-label={`Pedido ${order.id}`}
      className="relative min-w-0 overflow-hidden rounded-[24px] border border-[#e7e3dc] bg-white shadow-[0_4px_24px_-12px_rgba(56,56,54,0.16)] transition-shadow duration-200 hover:shadow-[0_10px_36px_-16px_rgba(56,56,54,0.22)]"
    >
      <div className={cn('absolute inset-x-0 top-0 h-[3px]', state.accent)} />

      <header className="flex flex-col justify-between gap-4 border-b border-[#eeeae4] px-5 py-5 sm:flex-row sm:items-center sm:px-7">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#797166]">
            <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
            Pedido
          </div>
          <h3 className="break-all font-mono text-sm font-semibold tracking-[-0.02em] text-[#383836] sm:text-base">
            #{order.id}
          </h3>
          <p className="mt-1.5 text-xs text-[#797166]">
            {created.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })}
            <span className="mx-2 text-[#d1cbc1]" aria-hidden="true">·</span>
            {created.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#797166]">Estado del pedido</span>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium', state.badge)}>
            <StateIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {state.label}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 px-5 py-6 sm:px-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            <section className="min-w-0" aria-label="Datos del cliente">
              <p className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#797166]">
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> Cliente
              </p>
              <p className="break-words text-base font-semibold tracking-[-0.02em] text-[#383836]">{order.customerName}</p>
              <a href={`mailto:${order.customerEmail}`} className="mt-2 flex items-start gap-2 text-sm text-[#716c63] transition-colors hover:text-[#383836] hover:underline focus-visible:outline-offset-4">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="break-all">{order.customerEmail}</span>
              </a>
              <a href={`tel:${order.customerPhone}`} className="mt-1.5 flex items-center gap-2 text-sm text-[#716c63] transition-colors hover:text-[#383836] hover:underline focus-visible:outline-offset-4">
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {order.customerPhone}
              </a>
            </section>

            <section className="min-w-0" aria-label="Detalles de recogida">
              <p className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#797166]">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Recogida
              </p>
              <p className="break-words text-base font-semibold tracking-[-0.02em] text-[#383836]">{order.storeName}</p>
              <p className="mt-2 flex items-start gap-2 text-sm text-[#716c63]">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {pickup.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-[#383836]">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-[#797166]" aria-hidden="true" />
                {order.pickupTime.slice(0, 5)} h
              </p>
            </section>
          </div>

          <section className="mt-6 border-t border-[#eeeae4] pt-5" aria-label="Productos del pedido">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#797166]">
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" /> Productos
              </p>
              <span className="text-xs text-[#797166]">{itemCount} {itemCount === 1 ? 'unidad' : 'unidades'}</span>
            </div>
            <ul className="divide-y divide-[#f1eee9]">
              {order.items.map((item, index) => (
                <li key={`${item.flavorId}-${item.portion}-${index}`} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                  <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-[#eeeae4] bg-[#faf8f5] px-1.5 text-xs font-semibold tabular-nums text-[#625c52]">
                    {item.quantity}<span className="ml-0.5 text-[10px] font-normal text-[#9b9488]">×</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-[#383836]">{item.flavorName}</p>
                    <p className="mt-0.5 text-xs text-[#797166]">{PORTION_LABELS[item.portion] || item.portion}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-[#383836]">{money(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>

          {order.notes && (
            <section className="mt-5 rounded-xl border border-[#eadfc6] bg-[#fcf8ef] px-4 py-3.5" aria-label="Alergias e información relevante">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a6935]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Alergias e información relevante
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#6f5b3b]">{order.notes}</p>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col border-t border-[#eeeae4] bg-[#faf9f6] px-5 py-6 sm:px-7 lg:border-l lg:border-t-0 lg:px-6" aria-label="Pago y gestión del pedido">
          <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#797166]">
            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" /> Total del pedido
          </p>
          <p className="mt-2.5 text-[34px] font-semibold leading-none tracking-[-0.055em] tabular-nums text-[#383836]">{money(order.total)}</p>
          <span className={cn('mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium', payment.classes)}>
            <PaymentIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {getPaymentLabel(order)}
          </span>
          {Number(order.refundedAmount) > 0 && (
            <p className="mt-2 text-xs text-[#797166]">Reembolsado: {money(order.refundedAmount!)}</p>
          )}

          {order.paymentSyncError && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800" role="status">
              No se ha podido actualizar desde Stripe. Se muestra el último estado guardado.
            </p>
          )}

          <div className="mt-6 border-t border-[#e7e3dc] pt-5">
            <label htmlFor={statusId} className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#797166]">
              Gestionar pedido
            </label>
            <Select value={order.status} onValueChange={value => onStatusChange(order.id, value as Order['status'])}>
              <SelectTrigger id={statusId} className="h-10 w-full rounded-xl border-[#dfd9cf] bg-white text-sm text-[#383836] shadow-[0_1px_2px_rgba(56,56,54,0.03)] focus-visible:ring-[#bca77b]/30">
                <SelectValue>{state.label}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#e7e3dc]">
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado" disabled={!canConfirmOrder(order)}>Confirmado</SelectItem>
                <SelectItem value="completado" disabled={!canConfirmOrder(order)}>Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            {order.status === 'cancelado' && canConfirmOrder(order) && (
              <p className="mt-3 text-xs leading-relaxed text-amber-800">Cancelar el pedido no reembolsa el pago en Stripe.</p>
            )}
          </div>

          {(order.status === 'cancelado' || order.paymentStatus === 'failed' || order.paymentStatus === 'expired') && (
            <div className="mt-5 border-t border-[#e7e3dc] pt-4">
              <StripeAttemptDetails key={`${order.id}-${order.updatedAt}`} orderId={order.id} />
            </div>
          )}
          {stripeLink && (
            <div className="mt-auto pt-6">
              <a
                href={stripeLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#625c52] underline decoration-[#c9bdab] underline-offset-4 transition-colors hover:text-[#383836] focus-visible:outline-offset-4"
              >
                {stripeLink.label} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
