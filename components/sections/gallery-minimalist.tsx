"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

interface GalleryItem {
    id: string
    title: string
    description: string
    image: string
}

interface BusinessGalleryProps {
    items: GalleryItem[]

}
const businessAreas = [
    {
        id: "1",
        title: "La base de cada gran CheeseCake",
        description: "Seleccionamos cuidadosamente cada ingrediente para garantizar un sabor auténtico, una textura cremosa y una calidad que se percibe en cada bocado.",
        image: "/hc/12.jpeg",
    },
    {
        id: "2",
        title: "Elaboración artesanal",
        description: "Cada tarta se elabora siguiendo un proceso cuidado que respeta los tiempos, la técnica y el equilibrio perfecto entre textura y sabor.",
        image: "/hc/3.jpeg",
    },
    {
        id: "3",
        title: "Renovación de lo clásico",
        description: "Nuestra colección combina los sabores tradicionales con creaciones únicas que exploran nuevas combinaciones y matices.",
        image: "/hc/5.jpeg",
    },
    {
        id: "4",
        title: "Cremosidad perfecta",
        description: "Buscamos el equilibrio ideal entre suavidad, cremosidad y carácter para lograr una experiencia realmente especial.",
        image: "/hc/13.png",
    },
    {
        id: "5",
        title: "Carácter propio",
        description: "Cada sabor está pensado para ofrecer algo diferente, manteniendo siempre la esencia que hace único a un buen cheesecake.",
        image: "/hc/15.JPG",
    },
    {
        id: "6",
        title: "Cuidamos el detalle",
        description: "Desde la selección de ingredientes hasta la presentación final, todo se cuida para ofrecer una experiencia excepcional.",
        image: "/hc/14.jpeg",
    }
]


// Variante Principal: Cards con layout asimétrico 2/3 + 1/3 alternando
function StaggeredGallery({ items }: BusinessGalleryProps) {
    const [visibleMap, setVisibleMap] = useState<Record<number, boolean>>({})
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const elements = sectionRef.current?.querySelectorAll("[data-animate]")

        if (!elements) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const index = Number(entry.target.getAttribute("data-index"))

                    setVisibleMap((prev) => ({
                        ...prev,
                        [index]: entry.isIntersecting,
                    }))
                })
            },
            {
                threshold: 0.15,
                rootMargin: "0px 0px -10% 0px",
            }
        )

        elements.forEach((el) => observer.observe(el))

        return () => observer.disconnect()
    }, [])

    const rows: GalleryItem[][] = []
    for (let i = 0; i < items.length; i += 2) {
        rows.push(items.slice(i, i + 2))
    }

    return (
        <section ref={sectionRef} className="py-16 px-6 bg-white relative">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {rows.map((row, rowIndex) => {
                    const isEvenRow = rowIndex % 2 === 0

                    return (
                        <div key={rowIndex} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {row.map((item, itemIndex) => {
                                const isLarge = isEvenRow ? itemIndex === 0 : itemIndex === 1
                                const cardIndex = rowIndex * 2 + itemIndex
                                const isVisible = visibleMap[cardIndex]

                                return (
                                    <article
                                        key={item.id}
                                        data-animate
                                        data-index={cardIndex}
                                        style={{
                                            opacity: isVisible ? 1 : 0,
                                            transform: isVisible
                                                ? "translateY(0px) scale(1)"
                                                : "translateY(80px) scale(0.96)",
                                            filter: isVisible ? "blur(0px)" : "blur(8px)",
                                            transition: `
                                                opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${cardIndex * 0.08}s,
                                                transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${cardIndex * 0.08}s,
                                                filter 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${cardIndex * 0.08}s
                                            `,
                                            willChange: "transform, opacity, filter",
                                        }}
                                        className={`group relative overflow-hidden rounded-lg cursor-pointer ${isLarge ? "lg:col-span-2" : "lg:col-span-1"
                                            } ${!isEvenRow && itemIndex === 1 ? "lg:order-2" : ""
                                            } ${!isEvenRow && itemIndex === 0 ? "lg:order-1" : ""
                                            }`}
                                    >
                                        <div className={`relative ${isLarge ? "aspect-[16/9]" : "aspect-[4/5]"
                                            } lg:aspect-auto lg:h-[420px]`}>

                                            {/* Imagen */}
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />

                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                            {/* Contenido */}
                                            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
                                                <h3 className="text-2xl lg:text-3xl font-medium text-white">
                                                    {item.title}
                                                </h3>
                                                <p className="mt-3 text-white/80 leading-relaxed max-w-lg">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}

                            {row.length === 1 && (
                                <div className="hidden lg:block lg:col-span-1" />
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
export default function GalleryMinimalist() {
    return (
        <StaggeredGallery items={businessAreas} />
    )
}


