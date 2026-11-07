"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, MapPin, Calendar, Clock, ShoppingBag, Home, Mail, CreditCard, ArrowUpRight } from 'lucide-react'
import type { Order, PortionType } from '@/lib/types'
import { getPaymentLabel } from '@/lib/order-status'
import { getStoreReviewUrl } from '@/lib/store-reviews'

const PORTION_LABELS: Record<PortionType, string> = {
  individual: 'Individual', doble: 'Doble', mediana: 'Mediana', grande: 'Grande',
}
const shellCardClass = 'rounded-[32px] border border-[rgba(56,56,54,0.08)] bg-white/60 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)]'
const detailCardClass = 'rounded-[24px] border border-[rgba(56,56,54,0.08)] bg-white/62 backdrop-blur-xl p-5'

export function OrderConfirmation({ order, verificationError = false, onRetry }: {
  order: Order
  verificationError?: boolean
  onRetry?: () => void
}) {
  const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'partially_refunded'
  const isCanceled = order.status === 'cancelado'
  const emailSent = !!order.customerConfirmationSentAt
  const reviewUrl = getStoreReviewUrl(order.storeId, order.storeReviewUrl)

  return (
    <Card className={`${shellCardClass} mx-auto max-w-4xl bg-white`}>
      <CardContent className="space-y-8 px-6 pb-10 pt-12 md:px-10">
        {verificationError && (
          <p role="status" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            No hemos podido volver a consultar Stripe. Este es el último estado verificado.
            Si ya has pagado, no repitas el pedido.
          </p>
        )}
        {/* Header */}
        <div className="space-y-5 text-center">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${isPaid ? 'bg-[rgba(34,197,94,0.12)]' : 'bg-[rgba(245,158,11,0.12)]'
              }`}
          >
            {isPaid ? (
              <CheckCircle className="h-10 w-10 text-green-600" />
            ) : (
              <Clock className="h-10 w-10 text-yellow-600" />
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.48)]">
              {isCanceled ? 'Pedido cancelado' : isPaid ? 'Pedido recibido' : getPaymentLabel(order)}
            </p>

            <h1 className="font-bebas text-4xl leading-none text-[rgb(56,56,54)] md:text-6xl">
              {isCanceled ? 'Pedido cancelado' : isPaid ? '¡Pedido pagado correctamente!' : getPaymentLabel(order)}
            </h1>

            <p className="mx-auto max-w-2xl text-[rgba(56,56,54,0.68)] md:text-lg">
              {isCanceled
                ? `Tu pedido está cancelado. Estado del pago: ${getPaymentLabel(order)}. Si necesitas ayuda, contacta con la tienda.`
                : isPaid
                ? 'Gracias por tu pedido. Tu pago está confirmado. Consulta los detalles de recogida a continuación.'
                : `Estado del pago: ${getPaymentLabel(order)}. El pedido solo se confirma cuando se verifica el pago.`}
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-[rgba(56,56,54,0.08)] bg-[rgba(56,56,54,0.03)] px-5 py-3">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.45)]">
                Número de pedido
              </p>
              <p className="mt-1 text-lg font-semibold tracking-[0.06em] text-[rgb(56,56,54)]">
                #{order.id}
              </p>
            </div>
          </div>
        </div>

        {/* Payment status */}
        {isPaid && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(34,197,94,0.18)] bg-[rgba(34,197,94,0.08)] px-4 py-3 text-green-800">
            <CreditCard className="h-5 w-5" />
            <span className="font-medium">{getPaymentLabel(order)}</span>
          </div>
        )}

        {/* Main detail grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className={detailCardClass}>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[rgb(56,56,54)]" />
              <h3 className="font-semibold text-[rgb(56,56,54)]">
                Punto de recogida
              </h3>
            </div>

            <p className="font-medium text-[rgb(56,56,54)]">{order.storeName}</p>
            <p className="mt-2 text-sm text-[rgba(56,56,54,0.58)]">
              Recuerda llevar tu número de pedido cuando vengas a recogerlo.
            </p>
          </div>

          <div className={detailCardClass}>
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[rgb(56,56,54)]" />
              <h3 className="font-semibold text-[rgb(56,56,54)]">
                Fecha y hora
              </h3>
            </div>

            <p className="flex items-center gap-2 font-medium text-[rgb(56,56,54)]">
              <Calendar className="h-4 w-4" />
              {new Date(order.pickupDate + 'T' + order.pickupTime).toLocaleDateString(
                'es-ES',
                {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}
            </p>

            <p className="mt-2 flex items-center gap-2 font-medium text-[rgb(56,56,54)]">
              <Clock className="h-4 w-4" />
              {order.pickupTime}
            </p>
          </div>
        </div>

        {/* Order items */}
        <div className={detailCardClass}>
          <div className="mb-5 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[rgb(56,56,54)]" />
            <h3 className="font-semibold text-[rgb(56,56,54)]">Tu pedido</h3>
          </div>

          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div
                key={`${item.flavorId}-${item.portion}-${item.customBase?.id || i}`}
                className="flex items-start justify-between gap-4 border-b border-[rgba(56,56,54,0.08)] pb-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[rgb(56,56,54)]">
                    {item.quantity}x {item.flavorName}
                    {item.portion && (
                      <span className="ml-1 text-[rgba(56,56,54,0.52)]">
                        ({PORTION_LABELS[item.portion]})
                      </span>
                    )}
                  </p>
                  {item.customBase && <p className="mt-1 text-sm text-muted-foreground">Base: {item.customBase.name} (+{item.customBase.surcharge.toFixed(2)} €/ud.)</p>}
                </div>

                <span className="whitespace-nowrap font-semibold text-[rgb(56,56,54)]">
                  {(item.quantity * item.price).toFixed(2)}€
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-[rgba(56,56,54,0.1)] pt-5">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-[rgb(56,56,54)]">
                Total
              </span>
              <span className="text-2xl font-bold text-[rgb(56,56,54)]">
                {Number(order.total).toFixed(2)}€
              </span>
            </div>
          </div>
        </div>

        {/* Email confirmation */}
        {order.customerEmail && isPaid && (
          <div className="rounded-[24px] border border-[rgba(56,56,54,0.10)] bg-[rgba(56,56,54,0.03)] p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-[rgb(56,56,54)]" />
              <div>
                <p className="font-medium text-[rgb(56,56,54)]">
                  {emailSent ? 'Confirmación enviada' : 'Confirmación pendiente de envío'}
                </p>
                <p className="mt-1 text-sm text-[rgba(56,56,54,0.68)]">
                  {emailSent ? 'Hemos enviado los detalles del pedido a' : 'Enviaremos los detalles del pedido a'}{' '}
                  <strong>{order.customerEmail}</strong>. Revisa tu bandeja de entrada
                  y spam.
                </p>
              </div>
            </div>
          </div>
        )}

        {isPaid && !isCanceled && reviewUrl && (
          <section aria-labelledby="review-heading" className="relative isolate overflow-hidden rounded-[28px] border border-white/15 bg-[linear-gradient(135deg,#424240_0%,#383836_55%,#2e2e2c_100%)] px-6 py-8 text-center text-white shadow-[0_14px_36px_rgba(56,56,54,0.14)] md:px-10 md:py-10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_50%)]" />
            <div className="relative">
              <p className="mb-5 text-[10px] uppercase tracking-[0.22em] text-white/55">Happycheese · Reseñas en Google</p>
              <h2 id="review-heading" className="font-bebas text-4xl leading-none uppercase tracking-wide md:text-5xl">Tu opinión nos importa</h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/75">
                Comparte tu experiencia en Google. Ayúdanos a que más personas descubran Happycheese.
              </p>
              <Button asChild className="group mt-6 min-h-12 w-full rounded-xl bg-white px-6 text-sm text-[rgb(56,56,54)] transition-all duration-300 hover:bg-white/90 motion-safe:hover:scale-[1.02] sm:w-auto">
                <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
                  Dejar mi reseña ahora <ArrowUpRight className="ml-2 h-4 w-4 transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              </Button>
              <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-white/45">{order.storeName}</p>
            </div>
          </section>
        )}

        {/* Important note */}
        <div className="rounded-[24px] border border-[rgba(217,119,6,0.18)] bg-[rgba(245,158,11,0.08)] p-5">
          <p className="text-sm leading-relaxed text-[rgb(120,53,15)]">
            <strong>Importante:</strong> recuerda recoger tu pedido en la fecha y hora indicadas.
            Si necesitas modificar algo, contáctanos lo antes posible.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="rounded-xl bg-[rgb(56,56,54)] text-white hover:bg-[rgba(56,56,54,0.92)]"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>

          {!isPaid && onRetry && (
            <Button
              onClick={() => onRetry?.()}
              variant="outline"
              className="rounded-xl border-[rgba(56,56,54,0.14)] bg-white/70 text-[rgb(56,56,54)]"
            >
              Volver a comprobar el pago
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

