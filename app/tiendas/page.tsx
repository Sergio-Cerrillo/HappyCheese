import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { StoresSection } from '@/components/sections/stores'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

export const metadata = {
    title: 'Tiendas | HappyCheese',
    description:
        'Descubre nuestras tiendas en Palma de Mallorca y encuentra la ubicación, horarios y contacto de HappyCheese.',
}

export default function StoresPage() {
    return (
        <>
            <Header />
            <main>
                <section className="relative flex min-h-[90svh] items-center justify-center overflow-hidden bg-[rgb(56,56,54)] md:h-screen">
                    <div className="absolute inset-0">
                        <Image
                            src="/hc/14.jpeg"
                            alt="Tiendas HappyCheese"
                            fill
                            priority
                            className="object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-black/52" />
                    </div>

                    <div className="relative z-10 container mx-auto mt-20 px-4 text-center">
                        <p className="mb-6 text-sm uppercase tracking-[0.3em] text-white/70">
                            Tiendas
                        </p>

                        <h1
                            className="font-bebas text-7xl font-normal uppercase leading-[0.85] tracking-tight text-white md:text-9xl lg:text-[8rem]"
                            style={{ letterSpacing: "-0.02em" }}
                        >
                            VEN A VISITARNOS
                        </h1>

                        <p className="mx-auto mt-8 max-w-2xl text-lg font-light text-white/80 md:text-xl">
                            Encuentra nuestras ubicaciones en Palma y recoge tu pedido en la tienda que prefieras.
                        </p>
                    </div>

                    <a
                        href="#tiendas"
                        className="group absolute bottom-12 left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-3"
                        aria-label="Scroll para ver tiendas"
                    >
                        <span className="text-xs uppercase tracking-[0.2em] text-white/70 transition-colors group-hover:text-white">
                            Descubrir
                        </span>
                        <ChevronDown className="h-5 w-5 animate-bounce text-white/70 transition-colors group-hover:text-white" />
                    </a>
                </section>

                <StoresSection forceVisible compactTop />
            </main>
            <Footer />
        </>
    )
}
