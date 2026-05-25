"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles } from "lucide-react"

interface FlavorVariant {
    id: string
    name: string
    title: string
    description: string
    price: string
    originalPrice?: string
    mainImage: string
    features: string[]
}

interface FeaturedFlavorsProps {
    flavors?: FlavorVariant[]
}

const defaultFlavors: FlavorVariant[] = [
    {
        id: "pistacho",
        name: "Pistacho Ibérico & Chocolate Blanco",
        title: "Cookie Pizza Pistacho Ibérico & Chocolate Blanco",
        description: "Elaborada con pistacho 100% puro nacional, seleccionado por su intensidad aromática. La base, ligeramente crujiente por fuera y cremosa en el interior, con chocolate blanco de alta calidad, aportando notas lácteas y vainilladas que equilibran el carácter del pistacho.",
        price: "35,00€",
        originalPrice: "42,00€",
        mainImage: "/pizza-main.JPG",
        features: ["Receta Exclusiva", "100% Natural", "Sabor Intenso"]
    },
    {
        id: "avellana",
        name: "Avellana & Chocolate Belga",
        title: "Cookie Pizza Avellana & Chocolate Belga",
        description: "La base rica en avellana 100% pura, cuidadosamente tostada para potenciar su sabor y textura. El resultado es una masa densa, jugosa y con un perfil aromático avellanado. Se combina con chocolate con leche belga que aporta cremosidad y notas suaves de cacao y caramelo.",
        price: "35,00€",
        originalPrice: "42,00€",
        mainImage: "/pizza-main2.JPG",
        features: ["Receta Exclusiva", "100% Natural", "Sabor Intenso"]
    },
]

export function FeaturedFlavors({ flavors = defaultFlavors }: FeaturedFlavorsProps) {
    const [activeFlavor, setActiveFlavor] = useState(flavors[0].id)
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    const currentFlavor = flavors.find(f => f.id === activeFlavor) || flavors[0]

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
        <section
            ref={sectionRef}
            className="py-20 sm:py-24 lg:py-28 bg-white relative overflow-hidden -mt-40"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Dark Card Container with Background Image */}
                <div className="
                    relative
                    bg-gradient-to-br from-[rgb(40,40,38)] to-[rgb(30,30,28)]
                    rounded-3xl 
                    p-8 sm:p-10 lg:p-14
                    shadow-2xl
                    border border-white/5
                    overflow-hidden
                "
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                        transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                >
                    {/* Background Image with Dark Overlay */}
                    <div className="absolute inset-0">
                        <Image
                            src="/pizza-bg.JPG"
                            alt="Background"
                            fill
                            className="object-cover opacity-25"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                        />

                        <div className="absolute inset-0 bg-[rgb(25,25,23)]/10" />
                    </div>

                    {/* Content - Positioned above background */}
                    <div className="relative z-10">
                        {/* Badge - Animated */}
                        <div
                            className="flex items-center gap-3 mb-6 justify-center bg-white backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 w-max mx-auto"
                            style={{
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
                                transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
                            }}
                        >
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-primary dark:text-accent">NO TE PIERDAS...</span>
                        </div>

                        {/* Header - Animated */}
                        <div className="text-center mb-10 sm:mb-12">
                            <p
                                className="text-white/60 font-medium uppercase tracking-wider mb-3 text-sm"
                                style={{
                                    opacity: isVisible ? 1 : 0,
                                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                                    transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s'
                                }}
                            >
                                Solo en Happycheese LUX
                            </p>
                            <h2
                                className="font-bebas text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4"
                                style={{
                                    opacity: isVisible ? 1 : 0,
                                    transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                                    transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s'
                                }}
                            >
                                ¿Ya conoces nuestra nueva Cookie Pizza?
                            </h2>
                        </div>

                        {/* Tabs - Animated */}
                        <div
                            className="flex justify-center mb-8 sm:mb-10 px-4"
                            style={{
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                                filter: isVisible ? 'blur(0)' : 'blur(4px)',
                                transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
                            }}
                        >
                            <Tabs value={activeFlavor} onValueChange={setActiveFlavor} className="w-full max-w-md">
                                <TabsList className="bg-white/10 backdrop-blur-sm border border-white/10 h-auto p-1.5 rounded-xl grid grid-cols-2 gap-1.5">
                                    {flavors.map((flavor) => (
                                        <TabsTrigger
                                            key={flavor.id}
                                            value={flavor.id}
                                            className="
                                                data-[state=active]:bg-white 
                                                data-[state=active]:text-[rgb(56,56,54)] 
                                                data-[state=active]:shadow-lg
                                                text-white/70
                                                px-3 py-2
                                                text-xs sm:text-sm
                                                font-medium
                                                rounded-lg
                                                transition-all duration-300
                                                whitespace-normal
                                                text-center
                                                leading-tight
                                                min-h-[2.5rem]
                                                flex items-center justify-center
                                            "
                                        >
                                            {flavor.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Content Card */}
                        <div className="max-w-6xl mx-auto">
                            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                                {/* Image Card - Animated */}
                                <div
                                    className="
                                        bg-white
                                        rounded-2xl 
                                        overflow-hidden
                                        transition-all duration-500
                                        hover:shadow-2xl
                                        shadow-xl
                                    "
                                    style={{
                                        opacity: isVisible ? 1 : 0,
                                        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.95)',
                                        filter: isVisible ? 'blur(0)' : 'blur(6px)',
                                        transition: 'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.6s, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.6s, filter 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.6s'
                                    }}
                                >
                                    <div className="relative h-64 sm:h-80 lg:h-96">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(56,56,54)]/5 to-transparent z-10" />
                                        <Image
                                            src={currentFlavor.mainImage}
                                            alt={currentFlavor.title}
                                            fill
                                            className="object-cover transition-transform duration-700 hover:scale-105"
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            priority
                                        />
                                    </div>
                                </div>

                                {/* Content Section - Outside card */}
                                <div className="flex flex-col justify-center">
                                    {/* Badge - Animated */}
                                    <div
                                        className="inline-flex items-center gap-2 mb-5 w-fit"
                                        style={{
                                            opacity: isVisible ? 1 : 0,
                                            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                                            transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.7s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.7s'
                                        }}
                                    >
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                                            <Sparkles className="w-3.5 h-3.5 text-white" />
                                            <span className="text-xs font-semibold uppercase tracking-wider text-white">
                                                NOVEDAD
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title - Animated */}
                                    <h3
                                        className="font-bebas text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4 leading-tight"
                                        style={{
                                            opacity: isVisible ? 1 : 0,
                                            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                                            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s'
                                        }}
                                    >
                                        {currentFlavor.title}
                                    </h3>

                                    {/* Description - Animated */}
                                    <p
                                        className="text-white/80 text-base sm:text-lg leading-relaxed mb-6"
                                        style={{
                                            opacity: isVisible ? 1 : 0,
                                            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                                            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.9s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.9s'
                                        }}
                                    >
                                        {currentFlavor.description}
                                    </p>

                                    {/* Price Section - Animated */}
                                    <div
                                        className="flex flex-wrap items-center gap-4 mb-7"
                                        style={{
                                            opacity: isVisible ? 1 : 0,
                                            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                                            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.0s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.0s'
                                        }}
                                    >
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl sm:text-5xl font-bold text-white">
                                                {currentFlavor.price}
                                            </span>
                                            {currentFlavor.originalPrice && (
                                                <span className="text-lg text-white/50 line-through">
                                                    {currentFlavor.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* CTA Button - Animated */}
                                    <div
                                        className="mb-7"
                                        style={{
                                            opacity: isVisible ? 1 : 0,
                                            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                                            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.1s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.1s'
                                        }}
                                    >
                                        <Button
                                            size="lg"
                                            className="
                                                bg-white
                                                hover:bg-white/90
                                                text-[rgb(56,56,54)]
                                                px-8 py-6 
                                                text-base 
                                                font-semibold
                                                rounded-xl
                                                shadow-lg 
                                                shadow-white/20
                                                transition-all duration-300 
                                                hover:shadow-xl 
                                                hover:shadow-white/30
                                                hover:-translate-y-0.5
                                                w-full sm:w-auto
                                            "
                                        >
                                            Hacer pedido
                                        </Button>
                                    </div>

                                    {/* Features - Animated */}
                                    <div
                                        className="flex flex-wrap gap-4"
                                        style={{
                                            opacity: isVisible ? 1 : 0,
                                            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                                            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.2s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.2s'
                                        }}
                                    >
                                        {currentFlavor.features.map((feature, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 text-sm text-white/70"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* End relative z-10 content */}
                    </div>
                    {/* End Dark Card */}
                </div>
            </div>
            {/* End Container */}
        </section>
    )
}
