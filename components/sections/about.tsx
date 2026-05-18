"use client"

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Heart, Leaf, Award, Clock } from 'lucide-react'

const features = [
  {
    icon: Heart,
    title: 'Pasion Artesanal',
    description: 'Cada tarta esta elaborada a mano con dedicacion y amor por nuestros maestros pasteleros.'
  },
  {
    icon: Leaf,
    title: 'Ingredientes Premium',
    description: 'Solo utilizamos queso crema de primera calidad, huevos de gallinas camperas y productos locales.'
  },
  {
    icon: Award,
    title: 'Recetas Exclusivas',
    description: 'Nuestras recetas han sido perfeccionadas durante anos para lograr el equilibrio perfecto.'
  },
  {
    icon: Clock,
    title: 'Frescura Garantizada',
    description: 'Horneamos cada dia para garantizar que siempre disfrutes de una tarta recien hecha.'
  }
]

export function AboutSection() {
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

  return (
    <section id="nosotros" ref={sectionRef} className="py-24 bg-card relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-white " />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div
            className="relative"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(60px)',
              transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div
              className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.95)',
                transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
              }}
            >
              <Image
                src="/us.jpeg"
                alt="Interior de la pasteleria HappyCheese"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
            </div>

            {/* Floating Card */}
            <div
              className="absolute -bottom-8 -right-8 bg-card p-6 rounded-2xl shadow-xl max-w-xs"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) translateX(0)' : 'translateY(40px) translateX(-20px)',
                transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
              }}
            >
              <p className="font-bebas text-4xl font-medium text-center text-[rgb(56, 56, 54)]">+15 sabores</p>
              <p className="text-muted-foreground text-center">
                El sabor auténtico del cheesecake artesanal.
              </p>
            </div>
          </div>

          <div
            className="space-y-8"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(60px)',
              transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s'
            }}
          >
            <div className="space-y-4">
              <p className="text-[rgb(56, 56, 54)] font-medium uppercase tracking-wider">NUESTRA ESENCIA</p>
              <h1
                className={`font-bebas text-1xl md:text-9xl lg:text-[3rem] leading-[0.85] tracking-tight font-bold"
                  }`}
                style={{
                  letterSpacing: '-0.00em'
                }}
              >
                Un clásico reinventado.
              </h1>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s'
                }}
              >
                Cada cheesecake nace de una idea simple: convertir un clásico en algo extraordinario. La elaboración se basa en el respeto por los ingredientes, la precisión en cada detalle y el equilibrio perfecto entre textura y sabor.
              </p>
              <p
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
                }}
              >
                Junto a las versiones más tradicionales, convive una colección de creaciones donde nuevos sabores, combinaciones inesperadas y matices cuidadosamente trabajados dan forma a una propuesta única. Cada tarta mantiene la esencia cremosa que define a un buen cheesecake, pero con personalidad propia.
              </p>
              <p
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s'
                }}
              >
                El resultado es una experiencia que va más allá de un simple postre: una selección de cheesecakes pensada para descubrir, disfrutar y volver a sorprender en cada bocado.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-24">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="
        group relative overflow-hidden
        rounded-2xl p-7
        border border-[rgba(56,56,54,0.08)]
        bg-white/60 backdrop-blur-xl
        shadow-[0_8px_30px_rgba(0,0,0,0.05)]
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_14px_40px_rgba(0,0,0,0.08)]
      "
            >
              {/* brillo glass */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-[rgba(56,56,54,0.03)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="
          mb-5 flex h-11 w-11 items-center justify-center
          rounded-xl
          bg-[rgba(56,56,54,0.06)]
          border border-[rgba(56,56,54,0.08)]
          transition-colors duration-300
          group-hover:bg-[rgba(56,56,54,0.09)]
        ">
                  <feature.icon className="h-5 w-5 text-[rgb(56,56,54)]" />
                </div>

                <h3 className="mb-3 text-xl font-semibold text-[rgb(56,56,54)]">
                  {feature.title}
                </h3>

                <p className="text-sm leading-relaxed text-[rgba(56,56,54,0.72)]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
