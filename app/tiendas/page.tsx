import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { StoresSection } from '@/components/sections/stores'

export const metadata = {
    title: 'Tiendas | HappyCheese',
    description:
        'Descubre nuestras tiendas en Palma de Mallorca y encuentra la ubicación, horarios y contacto de HappyCheese.',
}

export default function StoresPage() {
    return (
        <>
            <Header />
            <main className="pt-24">
                <StoresSection />
            </main>
            <Footer />
        </>
    )
}
