import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { OrderConfirmation } from '@/components/order/order-confirmation'
import type { Order } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Vista previa de pedido | Happycheese',
  robots: { index: false, follow: false },
}

// This route never reads or writes orders, calls Stripe, or sends email.
// It is unavailable in production, irrespective of URL parameters or cookies.
export default function OrderPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound()

  const now = new Date().toISOString()
  const order: Order = {
    id: 'DEMO-SIN-COBRO',
    storeId: 'happycheese',
    storeName: 'Happycheese Joan Alcover',
    customerName: 'Cliente de ejemplo',
    customerEmail: 'prueba@example.com',
    customerPhone: '600000000',
    items: [
      {
        flavorId: 'demo-pistacho', flavorName: 'Pistacho', portion: 'mediana', quantity: 1, price: 28.5,
        customBase: { id: 'demo-base', name: 'Galleta de pistacho', surcharge: 3.5 },
      },
      { flavorId: 'demo-clasica', flavorName: 'Clásica', portion: 'grande', quantity: 1, price: 40 },
    ],
    total: 68.5,
    status: 'confirmado',
    paymentStatus: 'paid',
    pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    pickupTime: '12:30',
    createdAt: now,
    updatedAt: now,
    customerConfirmationSentAt: now,
  }

  return <div className="flex min-h-screen flex-col bg-[rgb(56,56,54)]">
    <Header />
    <main className="flex-1 px-4 pb-16 pt-40">
      <div className="container mx-auto space-y-6">
        <div role="status" className="mx-auto max-w-4xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Vista previa local · Pedido ficticio.</strong> No se ha realizado ningún cobro, creado un pedido ni enviado un correo. Los estados de pago y envío que aparecen debajo son de ejemplo.
        </div>
        <OrderConfirmation order={order} />
      </div>
    </main>
    <Footer />
  </div>
}
