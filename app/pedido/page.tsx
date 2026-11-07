import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { OrderForm } from '@/components/order/order-form'

export const metadata = {
  title: 'Hacer Pedido | HappyCheese',
  description:
    'Haz tu pedido de tartas de queso artesanales online y recogelo en nuestra tienda de Palma de Mallorca.',
}

export default function OrderPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[rgba(56,56,54,0.52)] pt-36 pb-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <OrderForm />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
