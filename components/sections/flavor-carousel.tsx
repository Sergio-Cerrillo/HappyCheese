"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Flavor } from '@/lib/types'
import useEmblaCarousel from 'embla-carousel-react'
import { EmblaCarouselType, EmblaEventType } from 'embla-carousel'

interface FlavorCarouselProps {
  flavors: Flavor[]
  storeName: string
  storeId: string
  reversed?: boolean
  className?: string
}

const TWEEN_FACTOR_BASE = 0.2

/**
 * Componente de carrusel de sabores con fondo dinámico
 * 
 * Features:
 * - Navegación con botones izquierda/derecha
 * - Background dinámico full-width con la imagen del sabor activo
 * - Carrusel Embla con efecto parallax
 * - Animaciones direccionales del texto (izq→centro o der→centro)
 * - Layout reversible (carrusel a derecha o izquierda)
 * - Responsive y totalmente animado
 */
export function FlavorCarousel({ flavors, storeName, storeId, reversed = false, className }: FlavorCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayedIndex, setDisplayedIndex] = useState(0) // Índice visible en el background
  const [isTransitioning, setIsTransitioning] = useState(false)
  const tweenFactor = useRef(0)
  const tweenNodes = useRef<HTMLElement[]>([])

  // Filtrar sabores disponibles en esta tienda
  const availableFlavors = flavors.filter(
    (flavor) =>
      flavor.active &&
      flavor.availability.some(
        (a) => a.storeId === storeId && a.portions.length > 0
      )
  )

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false
  })

  // Funciones de parallax de Embla
  const setTweenNodes = useCallback((emblaApi: EmblaCarouselType): void => {
    tweenNodes.current = emblaApi.slideNodes().map((slideNode) => {
      return slideNode.querySelector('.embla__parallax__layer') as HTMLElement
    })
  }, [])

  const setTweenFactor = useCallback((emblaApi: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length
  }, [])

  const tweenParallax = useCallback(
    (emblaApi: EmblaCarouselType, eventName?: EmblaEventType) => {
      const engine = emblaApi.internalEngine()
      const scrollProgress = emblaApi.scrollProgress()
      const slidesInView = emblaApi.slidesInView()
      const isScrollEvent = eventName === 'scroll'

      emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
        let diffToTarget = scrollSnap - scrollProgress
        const slidesInSnap = engine.slideRegistry[snapIndex]

        slidesInSnap.forEach((slideIndex) => {
          if (isScrollEvent && !slidesInView.includes(slideIndex)) return

          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((loopItem) => {
              const target = loopItem.target()

              if (slideIndex === loopItem.index && target !== 0) {
                const sign = Math.sign(target)

                if (sign === -1) {
                  diffToTarget = scrollSnap - (1 + scrollProgress)
                }
                if (sign === 1) {
                  diffToTarget = scrollSnap + (1 - scrollProgress)
                }
              }
            })
          }

          const translate = diffToTarget * (-1 * tweenFactor.current) * 100
          const tweenNode = tweenNodes.current[slideIndex]
          if (tweenNode) {
            tweenNode.style.transform = `translateX(${translate}%)`
          }
        })
      })
    },
    []
  )

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    const newIndex = emblaApi.selectedScrollSnap()
    setCurrentIndex(newIndex)
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    setTweenNodes(emblaApi)
    setTweenFactor(emblaApi)
    tweenParallax(emblaApi)

    emblaApi
      .on('reInit', setTweenNodes)
      .on('reInit', setTweenFactor)
      .on('reInit', tweenParallax)
      .on('scroll', tweenParallax)
      .on('slideFocus', tweenParallax)
      .on('select', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, tweenParallax, onSelect, setTweenNodes, setTweenFactor])

  // Trigger animation on index change - Crossfade entre imágenes
  useEffect(() => {
    if (currentIndex === displayedIndex) return

    // Iniciar crossfade
    setIsTransitioning(true)

    // Actualizar displayedIndex y terminar transición juntos (React hace batching)
    const timer = setTimeout(() => {
      // React agrupa estos cambios de estado en un solo re-render
      setDisplayedIndex(currentIndex)
      setIsTransitioning(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [currentIndex, displayedIndex])

  if (availableFlavors.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>No hay sabores disponibles en {storeName}</p>
      </div>
    )
  }

  const handlePrevious = () => {
    if (!emblaApi || isTransitioning) return
    emblaApi.scrollPrev()
  }

  const handleNext = () => {
    if (!emblaApi || isTransitioning) return
    emblaApi.scrollNext()
  }

  // Sabores para el crossfade
  const displayedFlavor = availableFlavors[displayedIndex] || availableFlavors[0]
  const targetFlavor = availableFlavors[currentIndex] || availableFlavors[0]

  return (
    <div className={cn('relative overflow-hidden w-full', className)}>
      {/* Background Image con Overlay - Crossfade entre imágenes */}
      <div className="absolute inset-0 z-0">
        {/* Renderizar TODAS las imágenes, mostrar solo la necesaria con opacity */}
        {availableFlavors.map((flavor, index) => {
          const isDisplayed = index === displayedIndex
          const isTarget = index === currentIndex
          const shouldBeVisible = isTransitioning ? isTarget : isDisplayed

          return (
            <div
              key={`bg-${flavor.id}`}
              className="absolute inset-0"
              style={{
                opacity: shouldBeVisible ? 1 : 0,
                transition: 'opacity 800ms ease-in-out',
                zIndex: isTarget ? 2 : 1,
                pointerEvents: 'none'
              }}
            >
              <Image
                src={flavor.image || '/images/clasica.jpg'}
                alt=""
                fill
                className="object-cover blur-sm"
                priority={index === 0}
                quality={90}
              />
            </div>
          )
        })}

        <div
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"
          style={{ zIndex: 3 }}
        />

        {/* Degradado superior para integración suave con la sección */}
        <div
          className="absolute top-0 left-0 right-0 h-64 md:h-80"
          style={{
            zIndex: 4,
            background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.95) 15%, hsl(var(--background) / 0.7) 40%, hsl(var(--background) / 0.3) 70%, transparent 100%)'
          }}
        />
      </div>

      {/* Content con transiciones suaves - Mayor altura y padding superior reducido */}
      <div className="relative z-10 min-h-[900px] flex items-center pt-8">
        <div className="container mx-auto px-6 pb-20">
          <div className={cn(
            "flex flex-col lg:flex-row gap-12 items-center",
            reversed && "lg:flex-row-reverse"
          )}>
            {/* Info con animación DIRECCIONAL */}
            <div className="text-white space-y-6 lg:w-1/2">
              {/* Badge fijo (sin animación) */}
              <Badge className="bg-white/90 text-foreground backdrop-blur-sm font-semibold px-3 py-1 uppercase inline-block">
                {storeId === 'happycheese' ? 'Base de galleta María' : 'Base de galleta artesanal hecha por nosotros'}
              </Badge>

              {/* Title con animación CROSSFADE - altura mínima para evitar saltos */}
              <div className="relative font-arial text-5xl md:text-7xl font-medium text-balance leading-tight min-h-[120px] md:min-h-[160px]" style={{ isolation: 'isolate' }}>
                {/* Texto actual (fade out) */}
                <h2
                  className="transition-opacity duration-800 ease-in-out"
                  style={{
                    opacity: isTransitioning ? 0 : 1,
                    willChange: 'opacity'
                  }}
                >
                  {displayedFlavor.name}
                </h2>

                {/* Texto nuevo (fade in) - posicionado absolutamente sobre el anterior */}
                <h2
                  className="absolute top-0 left-0 w-full transition-opacity duration-800 ease-in-out"
                  style={{
                    opacity: isTransitioning ? 1 : 0,
                    pointerEvents: 'none',
                    willChange: 'opacity',
                    transform: 'translateZ(0)' // Force GPU acceleration
                  }}
                >
                  {targetFlavor.name}
                </h2>
              </div>

              {/* Description con animación CROSSFADE */}
              <div className="relative text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl" style={{ isolation: 'isolate' }}>
                {/* Descripción actual (fade out) */}
                <p
                  className="transition-opacity duration-800 ease-in-out"
                  style={{
                    opacity: isTransitioning ? 0 : 1,
                    transitionDelay: '100ms',
                    willChange: 'opacity'
                  }}
                >
                  {displayedFlavor.description}
                </p>

                {/* Descripción nueva (fade in) - posicionada absolutamente sobre la anterior */}
                <p
                  className="absolute top-0 left-0 w-full transition-opacity duration-800 ease-in-out"
                  style={{
                    opacity: isTransitioning ? 1 : 0,
                    transitionDelay: '100ms',
                    pointerEvents: 'none',
                    willChange: 'opacity',
                    transform: 'translateZ(0)' // Force GPU acceleration
                  }}
                >
                  {targetFlavor.description}
                </p>
              </div>
            </div>

            {/* Embla Carousel con efecto parallax */}
            <div className="relative lg:w-1/2 w-full">
              <div className="embla">
                <div className="embla__viewport" ref={emblaRef}>
                  <div className="embla__container">
                    {availableFlavors.map((flavor) => (
                      <div className="embla__slide" key={flavor.id}>
                        <div className="embla__parallax">
                          <div className="embla__parallax__layer">
                            <Image
                              className="embla__slide__img embla__parallax__img"
                              src={flavor.image || '/images/clasica.jpg'}
                              alt={flavor.name}
                              width={600}
                              height={400}
                              priority={flavor.id === targetFlavor.id}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls - Centrados horizontalmente con animaciones */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
        {/* Botones de navegación con animaciones mejoradas */}
        <div
          className="flex items-center gap-4"
          style={{
            opacity: isTransitioning ? 0.5 : 1,
            transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
            transition: 'all 700ms'
          }}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevious}
            disabled={isTransitioning}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-14 w-14 rounded-full backdrop-blur-sm transition-all duration-500 hover:scale-125 active:scale-95 hover:-rotate-12 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0"
          >
            <ChevronLeft className="h-7 w-7 transition-transform duration-300 group-hover:-translate-x-1" />
          </Button>
          <div
            className="text-white/90 text-base font-semibold min-w-[70px] text-center px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
            style={{
              transform: isTransitioning ? 'scale(0.9)' : 'scale(1)',
              filter: isTransitioning ? 'blur(2px)' : 'blur(0)',
              transition: 'all 700ms'
            }}
          >
            {currentIndex + 1} / {availableFlavors.length}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNext}
            disabled={isTransitioning}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-14 w-14 rounded-full backdrop-blur-sm transition-all duration-500 hover:scale-125 active:scale-95 hover:rotate-12 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0"
          >
            <ChevronRight className="h-7 w-7 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Dots Indicator con animaciones mejoradas */}
        <div
          className="flex gap-2 bg-black/20 backdrop-blur-sm px-5 py-3 rounded-full border border-white/10"
          style={{
            transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
            opacity: isTransitioning ? 0.7 : 1,
            transition: 'all 700ms'
          }}
        >
          {availableFlavors.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning && emblaApi) {
                  emblaApi.scrollTo(index)
                }
              }}
              disabled={isTransitioning}
              className={cn(
                'h-2.5 rounded-full transition-all duration-700 ease-out disabled:cursor-not-allowed',
                index === currentIndex
                  ? 'w-10 bg-white shadow-lg shadow-white/60 scale-110'
                  : 'w-2.5 bg-white/40 hover:bg-white/70 hover:w-6 hover:scale-110'
              )}
              aria-label={`Ir al sabor ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
