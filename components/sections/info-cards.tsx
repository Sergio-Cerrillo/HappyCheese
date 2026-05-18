"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, Leaf, Award, Clock } from "lucide-react"

const features = [
    {
        icon: Heart,
        title: "Pasión Artesanal",
        description:
            "Cada tarta está elaborada a mano con dedicación y amor por nuestros maestros pasteleros.",
    },
    {
        icon: Leaf,
        title: "Ingredientes Premium",
        description:
            "Solo utilizamos queso crema de primera calidad, huevos de gallinas camperas y productos locales.",
    },
    {
        icon: Award,
        title: "Recetas Exclusivas",
        description:
            "Nuestras recetas han sido perfeccionadas durante años para lograr el equilibrio perfecto.",
    },
    {
        icon: Clock,
        title: "Frescura Garantizada",
        description:
            "Horneamos cada día para garantizar que siempre disfrutes de una tarta recién hecha.",
    },
]

function useInView<T extends HTMLElement>() {
    const ref = useRef<T | null>(null)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setVisible(entry.isIntersecting)
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -8% 0px",
            }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    return { ref, visible }
}

function FeatureCard({
    feature,
    index,
}: {
    feature: (typeof features)[number]
    index: number
}) {
    const { ref, visible } = useInView<HTMLDivElement>()
    const Icon = feature.icon

    return (
        <div
            ref={ref}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible
                    ? "translateY(0px) scale(1)"
                    : "translateY(56px) scale(0.97)",
                filter: visible ? "blur(0px)" : "blur(6px)",
                transition: `
          opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s,
          transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s,
          filter 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s
        `,
                willChange: "transform, opacity, filter",
            }}
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
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-[rgba(56,56,54,0.03)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10">
                <div
                    className="
            mb-5 flex h-11 w-11 items-center justify-center
            rounded-xl
            border border-[rgba(56,56,54,0.08)]
            bg-[rgba(56,56,54,0.06)]
            transition-colors duration-300
            group-hover:bg-[rgba(56,56,54,0.09)]
          "
                >
                    <Icon className="h-5 w-5 text-[rgb(56,56,54)]" />
                </div>

                <h3 className="mb-3 text-xl font-semibold text-[rgb(56,56,54)]">
                    {feature.title}
                </h3>

                <p className="text-sm leading-relaxed text-[rgba(56,56,54,0.72)]">
                    {feature.description}
                </p>
            </div>
        </div>
    )
}

export function FeaturesCardsOnly() {
    return (
        <section className="relative overflow-hidden bg-white py-24 -mt-30">
            <div className="container mx-auto px-4">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={feature.title}
                            feature={feature}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}