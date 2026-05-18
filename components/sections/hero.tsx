"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.innerWidth < 1024)

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Calcular transformaciones basadas en scroll
  // scroll 0-350px: fade out rápido y mover hacia arriba
  const maxScroll = 350
  const scrollProgress = Math.min(scrollY / maxScroll, 1)

  // Efectos más agresivos y visuales
  // Fade out: 1 -> 0
  const contentOpacity = 1 - scrollProgress
  // Mover hacia arriba: 0 -> -200px
  const contentTranslateY = -(scrollProgress * 200)
  // Scale down: 1 -> 0.85
  const contentScale = 1 - (scrollProgress * 0.15)
  // Blur: 0 -> 8px
  const contentBlur = scrollProgress * 8
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with low opacity */}
      <div className="absolute inset-0 -mt-40">
        <Image
          src={isMobile ? "/bg2-mobile.jpeg" : "/bg2.png"}
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black opacity-55" />
      </div>

      {/* Content */}
      <div
        className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20 "
        style={{
          opacity: contentOpacity,
          transform: `translateY(${contentTranslateY}px) scale(${contentScale})`,
          filter: `blur(${contentBlur}px)`,
          transition: 'none',
          willChange: 'transform, opacity, filter'
        }}
      >
        <p
          className={`text-sm tracking-[0.3em] uppercase text-white/70 mb-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          Palma de Mallorca
        </p>

        <h1
          className={`font-bebas uppercase text-7xl md:text-9xl lg:text-[11rem] leading-[0.85] tracking-tight text-white font-normal transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          style={{
            letterSpacing: '-0.02em'
          }}
        >
          HAPPYCHEESE
        </h1>

        <p
          className={`mt-8 text-lg md:text-xl text-white/80 font-light transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          The Art of the Cheesecake.
        </p>

        <div
          className={`mt-12 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-sm tracking-widest uppercase px-10 py-6 border-white/20 hover:bg-white hover:text-black transition-all duration-300 bg-transparent text-white"
          >
            <Link href="/pedido">
              Hacer pedido
            </Link>
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={() => {
          document.getElementById('historia')?.scrollIntoView({ behavior: 'smooth' })
        }}
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 cursor-pointer group transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'
          }`}
        aria-label="Scroll para descubrir mas"
      >
        <span className="text-xs tracking-[0.2em] uppercase text-white/70 group-hover:text-white transition-colors">
          Descubrir
        </span>
        <ChevronDown className="h-5 w-5 text-white/70 animate-bounce group-hover:text-white transition-colors" />
      </button>
    </section>
  )
}
