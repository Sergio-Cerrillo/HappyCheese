"use client"

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Phone, Navigation } from 'lucide-react'
import type { Store } from '@/lib/types'

export function StoresSection() {
  const [stores, setStores] = useState<Store[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data.filter((s: Store) => s.active))
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  return (
    <section id="tiendas" ref={sectionRef} className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div
          className="text-center max-w-2xl mx-auto mb-16"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
            transition:
              'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <p className="text-[rgb(56,56,54)] font-medium uppercase tracking-[0.18em] mb-4">
            Visítanos
          </p>

          <h2 className="font-bebas text-4xl md:text-5xl font-bold text-[rgb(56,56,54)] mb-4 text-balance">
            Nuestras tiendas en Palma
          </h2>

          <p className="text-[rgba(56,56,54,0.72)] text-lg leading-relaxed">
            Ven a visitarnos y descubre el aroma irresistible de nuestras tartas
            recién horneadas. Te esperamos con una sonrisa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div
            key="happycheese"
            className="
              group overflow-hidden rounded-[28px]
              border border-[rgba(56,56,54,0.08)]
              bg-white/60 backdrop-blur-xl
              shadow-[0_8px_30px_rgba(0,0,0,0.06)]
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-[0_14px_40px_rgba(0,0,0,0.08)]
            "
          >
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/alcover.jpg"
                alt="Tienda HappyCheese"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />

              {/* degradado principal: ahora sí visible */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />

              {/* brillo sutil superior, sin matar el degradado */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_32%)]" />

              <div className="absolute bottom-5 left-5">
                <h3 className="font-bebas text-2xl font-semibold text-white">
                  HAPPYCHEESE
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(56,56,54,0.08)] bg-[rgba(56,56,54,0.05)]">
                  <MapPin className="h-4 w-4 text-[rgb(56,56,54)]" />
                </div>
                <p className="text-[rgb(56,56,54)] leading-relaxed">
                  Carrer de Joan Alcover 27, 07006, Palma
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(56,56,54,0.08)] bg-[rgba(56,56,54,0.05)]">
                  <Clock className="h-4 w-4 text-[rgb(56,56,54)]" />
                </div>
                <p className="text-[rgba(56,56,54,0.72)] leading-relaxed">
                  L-D: 10:00 - 20:00
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(56,56,54,0.08)] bg-[rgba(56,56,54,0.05)]">
                  <Phone className="h-4 w-4 text-[rgb(56,56,54)]" />
                </div>
                <a
                  href="tel:+34613808858"
                  className="text-[rgb(56,56,54)] transition-colors duration-200 hover:text-[rgba(56,56,54,0.72)]"
                >
                  +34 613 808 858
                </a>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  asChild
                  className="
                    flex-1 gap-2 rounded-xl
                    bg-[rgb(56,56,54)] text-white
                    shadow-none transition-all duration-300
                    hover:scale-[1.03]
                    hover:bg-[rgba(56,56,54,0.92)]
                  "
                >
                  <Link href="/pedido">Hacer pedido</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="
                    gap-2 rounded-xl border-[rgba(56,56,54,0.12)]
                    bg-white/50 text-[rgb(56,56,54)]
                    backdrop-blur-md transition-all duration-300
                    hover:scale-[1.03]
                    hover:bg-[rgba(56,56,54,0.05)]
                    hover:text-[rgb(56,56,54)]
                  "
                >
                  <a
                    href="https://maps.app.goo.gl/zGUDwuuKKDrUw8dY9"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-4 w-4" />
                    Mapa
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div
            key="happycheeselux"
            className="
              group overflow-hidden rounded-[28px]
              border border-[rgba(56,56,54,0.08)]
              bg-white/60 backdrop-blur-xl
              shadow-[0_8px_30px_rgba(0,0,0,0.06)]
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-[0_14px_40px_rgba(0,0,0,0.08)]
            "
          >
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/brondo.JPG"
                alt="Tienda HappyCheese LUX"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />

              {/* degradado principal: ahora sí visible */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />

              {/* brillo sutil superior */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_32%)]" />

              <div className="absolute bottom-5 left-5">
                <h3 className="font-bebas text-2xl font-semibold text-white">
                  HAPPYCHEESE LUX
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(56,56,54,0.08)] bg-[rgba(56,56,54,0.05)]">
                  <MapPin className="h-4 w-4 text-[rgb(56,56,54)]" />
                </div>
                <p className="text-[rgb(56,56,54)] leading-relaxed">
                  Carrer de Can Brondo 5, 07001, Palma
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(56,56,54,0.08)] bg-[rgba(56,56,54,0.05)]">
                  <Clock className="h-4 w-4 text-[rgb(56,56,54)]" />
                </div>
                <p className="text-[rgba(56,56,54,0.72)] leading-relaxed">
                  L-D: 11:00 - 19:00
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[rgba(56,56,54,0.08)] bg-[rgba(56,56,54,0.05)]">
                  <Phone className="h-4 w-4 text-[rgb(56,56,54)]" />
                </div>
                <a
                  href="tel:+34613808858"
                  className="text-[rgb(56,56,54)] transition-colors duration-200 hover:text-[rgba(56,56,54,0.72)]"
                >
                  +34 613 808 858
                </a>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  asChild
                  className="
                    flex-1 gap-2 rounded-xl
                    bg-[rgb(56,56,54)] text-white
                    shadow-none transition-all duration-300
                    hover:scale-[1.03]
                    hover:bg-[rgba(56,56,54,0.92)]
                  "
                >
                  <Link href="/pedido">Hacer pedido</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="
                    gap-2 rounded-xl border-[rgba(56,56,54,0.12)]
                    bg-white/50 text-[rgb(56,56,54)]
                    backdrop-blur-md transition-all duration-300
                    hover:scale-[1.03]
                    hover:bg-[rgba(56,56,54,0.05)]
                    hover:text-[rgb(56,56,54)]
                  "
                >
                  <a
                    href="https://maps.app.goo.gl/9iJDqgEckS2GaEcp7"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-4 w-4" />
                    Mapa
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}