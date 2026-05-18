"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Clock,
  ShoppingBag,
  Home,
  Mail,
  Loader2,
  CreditCard,
} from 'lucide-react'
import type { Order, PortionType } from '@/lib/types'

const PORTION_LABELS: Record<PortionType, string> = {
  individual: 'Individual',
  doble: 'Doble',
  mediana: 'Mediana',
  grande: 'Grande',
}

const shellCardClass =
  'rounded-[32px] border border-[rgba(56,56,54,0.08)] bg-white/60 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)]'

const detailCardClass =
  'rounded-[24px] border border-[rgba(56,56,54,0.08)] bg-white/62 backdrop-blur-xl p-5'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const orderId = searchParams.get('order_id')
  const canceled = searchParams.get('canceled')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrderData() {
      if (canceled) {
        setLoading(false)
        setError('canceled')
        return
      }

      if (!orderId) {
        setLoading(false)
        setError('no_order_id')
        return
      }

      try {
        const supabase = (await import('@/lib/supabase')).default
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderError || !orderData) {
          console.error('Error loading order:', orderError)
          setError('not_found')
          setLoading(false)
          return
        }

        setOrder(orderData)
        setLoading(false)
      } catch (err) {
        console.error('Error loading order:', err)
        setError('unknown')
        setLoading(false)
      }
    }

    loadOrderData()
  }, [orderId, canceled])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className={`${shellCardClass} w-full max-w-xl px-8 py-12 text-center`}
        >
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[rgb(56,56,54)]" />
          <p className="mt-5 text-[rgba(56,56,54,0.7)]">
            Cargando información del pedido...
          </p>
        </div>
      </div>
    )
  }

  if (error === 'canceled') {
    return (
      <Card className={`${shellCardClass} mx-auto max-w-2xl`}>
        <CardContent className="space-y-8 px-6 pb-10 pt-12 text-center md:px-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(245,158,11,0.12)]">
            <XCircle className="h-10 w-10 text-yellow-600" />
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.48)]">
              Pedido no completado
            </p>
            <h1 className="font-bebas text-4xl leading-none text-[rgb(56,56,54)] md:text-6xl">
              Pago cancelado
            </h1>
            <p className="mx-auto max-w-xl text-[rgba(56,56,54,0.68)] md:text-lg">
              Has cancelado el proceso de pago. Tu pedido no ha sido procesado.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="rounded-xl bg-[rgb(56,56,54)] text-white hover:bg-[rgba(56,56,54,0.92)]"
            >
              <Link href="/pedido">Volver a intentar</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-[rgba(56,56,54,0.14)] bg-white/70 text-[rgb(56,56,54)]"
            >
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !order) {
    return (
      <Card className={`${shellCardClass} mx-auto max-w-2xl`}>
        <CardContent className="space-y-8 px-6 pb-10 pt-12 text-center md:px-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(239,68,68,0.10)]">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.48)]">
              Incidencia
            </p>
            <h1 className="font-bebas text-4xl leading-none text-[rgb(56,56,54)] md:text-6xl">
              Error en el pedido
            </h1>
            <p className="mx-auto max-w-xl text-[rgba(56,56,54,0.68)] md:text-lg">
              No se pudo encontrar tu pedido. Si has realizado el pago, revisa tu email
              para la confirmación.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="rounded-xl bg-[rgb(56,56,54)] text-white hover:bg-[rgba(56,56,54,0.92)]"
            >
              <Link href="/pedido">Intentar de nuevo</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-[rgba(56,56,54,0.14)] bg-white/70 text-[rgb(56,56,54)]"
            >
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isPaid = order.paymentStatus === 'paid'
  const isPending = order.paymentStatus === 'pending'

  return (
    <Card className={`${shellCardClass} mx-auto max-w-4xl bg-white`}>
      <CardContent className="space-y-8 px-6 pb-10 pt-12 md:px-10">
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
              {isPaid ? 'Pedido recibido' : 'Procesando pedido'}
            </p>

            <h1 className="font-bebas text-4xl leading-none text-[rgb(56,56,54)] md:text-6xl">
              {isPaid ? '¡Pedido confirmado!' : 'Pedido en proceso'}
            </h1>

            <p className="mx-auto max-w-2xl text-[rgba(56,56,54,0.68)] md:text-lg">
              {isPaid
                ? 'Gracias por tu pedido. Hemos enviado la confirmación a tu email y ya estamos preparando tu recogida.'
                : 'Tu pedido está siendo procesado. Recibirás un email de confirmación muy pronto.'}
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-[rgba(56,56,54,0.08)] bg-[rgba(56,56,54,0.03)] px-5 py-3">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.45)]">
                Número de pedido
              </p>
              <p className="mt-1 text-lg font-semibold tracking-[0.06em] text-[rgb(56,56,54)]">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Payment status */}
        {isPaid && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(34,197,94,0.18)] bg-[rgba(34,197,94,0.08)] px-4 py-3 text-green-800">
            <CreditCard className="h-5 w-5" />
            <span className="font-medium">Pago confirmado</span>
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
                key={`${item.flavorId}-${item.portion || i}`}
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
                  Confirmación enviada
                </p>
                <p className="mt-1 text-sm text-[rgba(56,56,54,0.68)]">
                  Hemos enviado los detalles del pedido a{' '}
                  <strong>{order.customerEmail}</strong>. Revisa tu bandeja de entrada
                  y spam.
                </p>
              </div>
            </div>
          </div>
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

          {!isPaid && (
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-[rgba(56,56,54,0.14)] bg-white/70 text-[rgb(56,56,54)]"
            >
              <Link href="/pedido">Hacer otro pedido</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ConfirmationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[rgb(56,56,54)]">
      <Header />
      <main className="flex-1 px-4 py-16">
        <div className="container mx-auto">
          <ConfirmationContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}