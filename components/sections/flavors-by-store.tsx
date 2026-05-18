"use client"

import { useEffect, useState, useRef } from 'react'
import { FlavorCarousel } from './flavor-carousel'
import { MapPin } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Flavor } from '@/lib/types'

/**
 * Sección de sabores por tienda
 * 
 * Muestra carruseles de sabores con tabs para seleccionar la tienda:
 * - Santa Catalina
 * - Centro Histórico
 * 
 * Las tiendas están hardcodeadas (no dinámicas) según requerimiento.
 * Cada carrusel es independiente y muestra solo los sabores disponibles en esa tienda.
 * 
 * Features:
 * - Tabs minimalistas para selección de tienda
 * - Animación al scroll
 * - Diseño responsive y profesional
 */
export function FlavorsByStore() {
    const [flavors, setFlavors] = useState<Flavor[]>([])
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        fetchFlavors()
    }, [])

    const fetchFlavors = async () => {
        try {
            const response = await fetch('/api/flavors')
            if (response.ok) {
                const data = await response.json()
                setFlavors(data)
            }
        } catch (error) {
            console.error('Error fetching flavors:', error)
        }
    }

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
        <section id="sabores" ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div
                    className="container mx-auto px-4 mb-12"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
                        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                >
                    <div className="text-center">
                        <p className="text-[rgb(56, 56, 54)] font-medium uppercase tracking-wider mb-4">Nuestros sabores</p>
                        <h2 className="font-bebas text-4xl md:text-5xl font-ligth text-foreground mb-4 text-balance">
                            ¿Ya conoces nuestros sabores?
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Disponemos de distintos sabores en cada una de nuestras tiendas.
                            ¡Descubre cuál es tu favorito!
                        </p>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-8">
                            Pulsa en cada tienda para descubrirlos.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s'
                    }}
                >
                    <Tabs defaultValue="happycheese" className="w-full">
                        {/* Tabs List */}
                        <div className="container mx-auto px-4 mb-8">
                            <TabsList
                                className="
      grid w-full max-w-md mx-auto grid-cols-2 h-auto p-1.5
      rounded-2xl
      border border-[rgba(56,56,54,0.08)]
      bg-white/55 backdrop-blur-xl
      shadow-[0_8px_24px_rgba(0,0,0,0.05)]
    "
                            >
                                <TabsTrigger
                                    value="happycheese"
                                    className="
        flex items-center justify-center rounded-xl
        py-3 px-6 text-sm font-medium
        text-[rgba(56,56,54,0.68)]
        transition-all duration-300
        hover:text-[rgb(56,56,54)]
        hover:bg-[rgba(56,56,54,0.04)]
        data-[state=active]:bg-white/85
        data-[state=active]:text-[rgb(56,56,54)]
        data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.06)]
        data-[state=active]:border
        data-[state=active]:border-[rgba(56,56,54,0.08)]
      "
                                >
                                    <MapPin className="w-4 h-4 mr-2" />
                                    HappyCheese
                                </TabsTrigger>

                                <TabsTrigger
                                    value="happycheese-lux"
                                    className="
        flex items-center justify-center rounded-xl
        py-3 px-6 text-sm font-medium
        text-[rgba(56,56,54,0.68)]
        transition-all duration-300
        hover:text-[rgb(56,56,54)]
        hover:bg-[rgba(56,56,54,0.04)]
        data-[state=active]:bg-white/85
        data-[state=active]:text-[rgb(56,56,54)]
        data-[state=active]:shadow-[0_4px_18px_rgba(0,0,0,0.06)]
        data-[state=active]:border
        data-[state=active]:border-[rgba(56,56,54,0.08)]
      "
                                >
                                    <MapPin className="w-4 h-4 mr-2" />
                                    HappyCheese LUX
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Tab Contents */}
                        <TabsContent value="happycheese" className="mt-0">
                            <div className="space-y-4">
                                <div className="container mx-auto px-4">
                                    <p className="text-center text-muted-foreground text-sm">
                                        Carrer de Joan Alcover 27, 07006, Palma
                                    </p>
                                </div>
                                <FlavorCarousel
                                    flavors={flavors}
                                    storeName="HappyCheese"
                                    storeId="happycheese"
                                    reversed={false}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="happycheese-lux" className="mt-0">
                            <div className="space-y-4">
                                <div className="container mx-auto px-4">
                                    <p className="text-center text-muted-foreground text-sm">
                                        Carrer Can Brondo 5, 07001, Palma
                                    </p>
                                </div>
                                <FlavorCarousel
                                    flavors={flavors}
                                    storeName="HappyCheese LUX"
                                    storeId="happycheese-lux"
                                    reversed={false}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </section>
    )
}
