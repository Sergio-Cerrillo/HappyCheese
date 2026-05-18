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

      <main className="min-h-screen bg-[rgba(56,56,54,0.52)] pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <div
              className="
                mb-10 rounded-[32px]
                border border-[rgba(56,56,54,0.08)]
                bg-white/58 px-6 py-10
                shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                backdrop-blur-xl
                md:px-10
              "
            >
              <div className="mx-auto max-w-3xl text-center">
                <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.52)]">
                  Pedido online
                </p>

                <h1 className="font-bebas text-4xl leading-none text-[rgb(56,56,54)] md:text-6xl">
                  Haz tu pedido
                </h1>

                <p className="mt-5 text-[rgba(56,56,54,0.68)] md:text-lg">
                  Selecciona la tienda donde quieres recoger, elige tus sabores
                  favoritos y completa tu pedido. Te esperamos con tu tarta lista.
                </p>
              </div>
            </div>

            <OrderForm />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}