"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  XCircle,
  Loader2,
} from 'lucide-react'
import type { Order } from '@/lib/types'
import { OrderConfirmation } from '@/components/order/order-confirmation'

const shellCardClass =
  'rounded-[32px] border border-[rgba(56,56,54,0.08)] bg-white/60 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)]'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const orderId = searchParams.get('order_id')
  const canceled = searchParams.get('canceled')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setOrder(null)
    setLoading(true)
    setError(null)
    setVerificationError(false)
    async function loadOrderData() {
      if (canceled) {
        setLoading(false)
        setError('canceled')
        return
      }

      if (!orderId || !sessionId) {
        setLoading(false)
        setError('no_order_id')
        return
      }

      try {
        const response = await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, orderId }),
          cache: 'no-store',
        })
        if (!response.ok) throw new Error('Payment verification unavailable')
        const orderData: Order = await response.json()
        if (!active) return
        setOrder(orderData)
        setError(null)
        setVerificationError(false)
        setLoading(false)
        return orderData.paymentStatus === 'paid' && !!orderData.customerConfirmationSentAt
          || orderData.paymentStatus === 'refunded'
          || orderData.paymentStatus === 'expired'
          || orderData.paymentStatus === 'partially_refunded'

      } catch (err) {
        if (!active) return
        console.error('Error loading order:', err)
        setVerificationError(true)
        setError('verification')
        setLoading(false)
      }
    }

    let timer: ReturnType<typeof setTimeout>
    let attempts = 0
    const poll = async () => {
      if (!active) return
      const complete = await loadOrderData()
      if (active && !complete && orderId && sessionId && !canceled && ++attempts < 20) timer = setTimeout(poll, 3000)
    }
    poll()
    return () => { active = false; clearTimeout(timer) }
  }, [orderId, sessionId, canceled, retry])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className={`${shellCardClass} w-full max-w-xl px-8 py-12 text-center`}
        >
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[rgb(56,56,54)]" />
          <p className="mt-5 text-[rgba(56,56,54,0.7)]">
            Verificando tu pago con Stripe...
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

  if (!order && (error || !loading)) {
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
              No hemos podido verificar el pago
            </h1>
            <p className="mx-auto max-w-xl text-[rgba(56,56,54,0.68)] md:text-lg">
              Si ya has pagado, no repitas el pedido. Estamos intentando comprobar
              el pago con Stripe. Puedes volver a consultarlo en unos instantes.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
            <Button
              onClick={() => { setLoading(true); setRetry(value => value + 1) }}
              className="rounded-xl bg-[rgb(56,56,54)] text-white hover:bg-[rgba(56,56,54,0.92)]"
            >
              Volver a comprobar el pago
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

  if (!order) return null

  return <OrderConfirmation order={order} verificationError={verificationError} onRetry={() => setRetry(value => value + 1)} />
}

export default function ConfirmationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[rgb(56,56,54)]">
      <Header />
      <main className="flex-1 px-4 pb-16 pt-40">
        <div className="container mx-auto">
          <ConfirmationContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}
