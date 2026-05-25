import Link from 'next/link'
import { ChefHat, Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="text-white" style={{ backgroundColor: 'rgb(56, 56, 54)' }}>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link
              href="/"
              className="font-bebas uppercase text-5xl tracking-tight text-white transition-colors duration-300 hover:text-white/80"
            >
              HappyCheese
            </Link>
            <p className="text-white/70 leading-relaxed">
              Tartas de queso artesanales elaboradas con pasion y los mejores ingredientes en el corazon de Palma de Mallorca.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="https://instagram.com/happycheese"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/happycheese"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-arial uppercase text-xl font-medium text-white">Enlaces</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/nosotros" className="text-white/70 hover:text-white transition-colors">
                Nosotros
              </Link>
              <Link href="/sabores" className="text-white/70 hover:text-white transition-colors">
                Sabores
              </Link>
              <Link href="/#tiendas" className="text-white/70 hover:text-white transition-colors">
                Tiendas
              </Link>
              <Link href="/pedido" className="text-white/70 hover:text-white transition-colors">
                Hacer Pedido
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-arial uppercase text-xl font-semibold text-white">Happycheese</h3>
            <div className="space-y-3 text-white/70">
              <p className="flex items-start gap-2">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                Carrer de Joan Alcover 27, 07006, Palma
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-5 w-5 flex-shrink-0" />
                +34 613 808 858
              </p>
              <p className="text-sm">L-D: 10:00 - 20:00</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-arial uppercase text-xl font-semibold text-white">Happycheese LUX</h3>
            <div className="space-y-3 text-white/70">
              <p className="flex items-start gap-2">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                Carrer de Can Brondo 5, 07001, Palma
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-5 w-5 flex-shrink-0" />
                +34 613 808 858
              </p>
              <p className="text-sm">L-D: 11:00 - 19:00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            {new Date().getFullYear()} Happycheese & Happycheese LUX. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-white/60">
            <Link href="/privacidad" className="hover:text-white transition-colors">
              Politica de Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-white transition-colors">
              Terminos y Condiciones
            </Link>
          </div>
        </div>
        <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-col  items-center gap-4">
          <p className="text-white/60 text-sm">
            Desarrollado por:
          </p>
          <div className="flex gap-6 text-sm text-white/60">
            <Link href="https://scwebstudio.tech" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
              <img src="/logo-full-w.png" alt="SCWebStudio" className="h-20 w-auto hover:scale-105 transition-transform" />
            </Link>

          </div>
        </div>
      </div>
    </footer>
  )
}
