"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Cake } from "lucide-react"

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="
        py-28 relative overflow-hidden
        bg-[url('/hc/8.jpeg')]
        bg-cover bg-center bg-no-repeat
      "
    >
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgb(56,56,54)_100%)]"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">

          {/* glass card */}
          <div
            className="
              relative
              rounded-[32px]
              border border-white/20
              backdrop-blur-sm
              shadow-[0_20px_60px_rgba(0,0,0,0.25)]
              px-10 py-14
              text-center
            "
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.95)',
              transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >

            {/* brillo glass */}
            <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[linear-gradient(135deg,rgba(255,255,255,0.25),transparent_45%,rgba(255,255,255,0.08))]" />

            <div className="relative z-10 space-y-8">

              {/* icono */}
              <div
                className="
                  inline-flex items-center justify-center
                  w-16 h-16
                  rounded-2xl
                  border border-white/25
                  bg-white/10
                "
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                  transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
                }}
              >
                <Cake className="h-8 w-8 text-white" />
              </div>

              <h2
                className="font-serif text-4xl md:text-5xl font-semibold text-white leading-tight"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s'
                }}
              >
                Antójate de la mejor
                <br />
                tarta de queso de Mallorca
              </h2>

              <p
                className="text-white/80 text-lg max-w-xl mx-auto leading-relaxed"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s'
                }}
              >
                Haz tu pedido online, elige tu sabor favorito y recógelo
                recién hecho en la tienda que prefieras.
              </p>

              <div
                className="pt-2"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
                }}
              >
                <Button
                  asChild
                  size="lg"
                  className="
                    text-lg px-10 py-6 gap-3
                    rounded-xl
                    bg-white text-[rgb(56,56,54)]
                    transition-all duration-300
                    hover:bg-white/90
                    hover:scale-[1.04]
                    active:scale-[0.97]
                  "
                >
                  <Link href="/pedido" className="flex items-center gap-3 group">
                    Hacer mi pedido
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  )
}