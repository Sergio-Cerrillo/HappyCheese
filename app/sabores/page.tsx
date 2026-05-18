"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { MapPin, ChevronDown } from "lucide-react"
import { Header } from "@/components/header"
import type { Flavor } from "@/lib/types"
import { Footer } from "@/components/footer"


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

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState as useLocalState } from "react"

function FlavorCard({ flavor, index }: { flavor: Flavor; index: number }) {
    const { ref, visible } = useInView<HTMLElement>()
    const [showMore, setShowMore] = useLocalState(false)
    const MAX_DESC = 90
    const isLong = flavor.description.length > MAX_DESC
    const descToShow = showMore ? flavor.description : flavor.description.slice(0, MAX_DESC)

    return (
        <article
            ref={ref}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible
                    ? "translateY(0px) scale(1)"
                    : "translateY(72px) scale(0.965)",
                filter: visible ? "blur(0px)" : "blur(8px)",
                transition: `
                    opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.06}s,
                    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.06}s,
                    filter 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.06}s
                `,
                willChange: "transform, opacity, filter",
            }}
            className="
                group relative overflow-hidden rounded-[26px]
                border border-[rgba(56,56,54,0.08)]
                bg-white/60 backdrop-blur-xl
                shadow-[0_10px_30px_rgba(0,0,0,0.05)]
                transition-all duration-300
                hover:-translate-y-1
                hover:shadow-[0_16px_42px_rgba(0,0,0,0.08)]
                flex flex-col h-full
            "
        >
            <div className="relative h-64 overflow-hidden">
                <Image
                    src={flavor.image}
                    alt={flavor.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />

                <div className="absolute inset-0 bg-linear-to-t from-[rgba(0,0,0,0.42)] via-[rgba(0,0,0,0.10)] to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_42%,rgba(56,56,54,0.05))]" />

                <div className="absolute top-4 left-4">
                    <Badge
                        className={
                            flavor.active
                                ? "border-0 bg-white/90 text-[rgb(56,56,54)] shadow-none"
                                : "border-0 bg-[rgba(56,56,54,0.82)] text-white shadow-none"
                        }
                    >
                        {flavor.active ? "Disponible" : "No disponible"}
                    </Badge>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
                <div className="space-y-3 flex-1">
                    <h3 className="text-xl font-semibold tracking-tight text-[rgb(56,56,54)]">
                        {flavor.name}
                    </h3>

                    <div className="relative min-h-14">
                        <p className="text-sm leading-7 text-[rgba(56,56,54,0.72)]">
                            {descToShow}
                            {isLong && !showMore && <span>...</span>}
                        </p>
                        {isLong && (
                            <button
                                className="mt-1 text-xs text-caramel underline hover:text-caramel-light transition-colors"
                                onClick={() => setShowMore((v) => !v)}
                                type="button"
                            >
                                {showMore ? "Mostrar menos" : "Mostrar más"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-5 border-t border-[rgba(56,56,54,0.08)] pt-4 flex flex-col gap-3">
                    <div>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[rgba(56,56,54,0.48)]">
                            Desde
                        </p>
                        <p className="text-2xl font-semibold text-[rgb(56,56,54)]">
                            {(() => {
                                // Obtener todos los precios disponibles mayores a 0
                                const allPrices = Object.values(flavor.prices).filter(price => price > 0)
                                // Buscar precios personalizados por tienda
                                flavor.availability.forEach(avail => {
                                    if (avail.prices) {
                                        Object.values(avail.prices).forEach(price => {
                                            if (price > 0) allPrices.push(price)
                                        })
                                    }
                                })
                                // Obtener el precio más bajo
                                const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0
                                return minPrice.toFixed(2)
                            })()}€
                        </p>
                    </div>
                    <Link href="/pedido">
                        <Button
                            className="w-full mt-2 rounded-xl py-6 text-base bg-[rgb(56,56,54)] hover:bg-[rgba(56,56,54,0.88)] text-white shadow-[0_8px_20px_rgba(56,56,54,0.18)] transition-all duration-300"
                            size="lg"
                        >
                            Hacer pedido
                        </Button>
                    </Link>
                </div>
            </div>
        </article>
    )
}

function StoreBlock({
    title,
    address,
    flavors,
}: {
    title: string
    address: string
    flavors: Flavor[]
}) {
    const { ref, visible } = useInView<HTMLElement>()

    return (
        <section
            ref={ref}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0px)" : "translateY(56px)",
                filter: visible ? "blur(0px)" : "blur(6px)",
                transition:
                    "opacity 0.95s cubic-bezier(0.16, 1, 0.3, 1), transform 0.95s cubic-bezier(0.16, 1, 0.3, 1), filter 0.95s cubic-bezier(0.16, 1, 0.3, 1)",
                willChange: "transform, opacity, filter",
            }}
            className="space-y-8"
        >
            <div
                className="
                    rounded-[28px]
                    border border-[rgba(56,56,54,0.08)]
                    bg-white/55 backdrop-blur-xl
                    shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                    px-6 py-7 md:px-8
                "
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.52)]">
                            Tienda
                        </p>
                        <h2 className="font-bebas text-4xl md:text-5xl leading-none text-[rgb(56,56,54)]">
                            {title}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 text-[rgba(56,56,54,0.68)]">
                        <MapPin className="h-4 w-4 shrink-0 text-[rgb(56,56,54)]" />
                        <p className="text-sm md:text-base">{address}</p>
                    </div>
                </div>
            </div>

            <div
                className="
                    grid gap-8
                    sm:grid-cols-2
                    lg:grid-cols-3
                    xl:grid-cols-4
                "
            >
                {flavors.map((flavor, index) => (
                    <FlavorCard key={flavor.id} flavor={flavor} index={index} />
                ))}
            </div>
        </section>
    )
}

function LoadingSkeleton() {
    return (
        <div
            className="
                grid gap-8
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
            "
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="
                        overflow-hidden rounded-[26px]
                        border border-[rgba(56,56,54,0.08)]
                        bg-white/60
                        shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                    "
                >
                    <div className="h-64 animate-pulse bg-[rgba(56,56,54,0.08)]" />
                    <div className="space-y-3 p-6">
                        <div className="h-6 w-2/3 animate-pulse rounded bg-[rgba(56,56,54,0.08)]" />
                        <div className="h-4 w-full animate-pulse rounded bg-[rgba(56,56,54,0.06)]" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-[rgba(56,56,54,0.06)]" />
                        <div className="mt-5 border-t border-[rgba(56,56,54,0.08)] pt-4">
                            <div className="h-3 w-16 animate-pulse rounded bg-[rgba(56,56,54,0.06)]" />
                            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-[rgba(56,56,54,0.08)]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function FlavorsPage() {
    const [flavorsHappyCheese, setFlavorsHappyCheese] = useState<Flavor[]>([])
    const [flavorsHappyCheeseLux, setFlavorsHappyCheeseLux] = useState<Flavor[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [scrollY, setScrollY] = useState(0)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        fetchFlavors()
    }, [])

    const fetchFlavors = async () => {
        try {
            const response = await fetch("/api/flavors")

            if (response.ok) {
                const data: Flavor[] = await response.json()

                const happyCheeseFlavors = data.filter((flavor) =>
                    flavor.availability.some(
                        (a) => a.storeId === "happycheese" && a.portions.length > 0
                    )
                )

                const happyCheeseLuxFlavors = data.filter((flavor) =>
                    flavor.availability.some(
                        (a) => a.storeId === "happycheese-lux" && a.portions.length > 0
                    )
                )

                setFlavorsHappyCheese(happyCheeseFlavors)
                setFlavorsHappyCheeseLux(happyCheeseLuxFlavors)
            }
        } catch (error) {
            console.error("Error fetching flavors:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const maxScroll = 350
    const scrollProgress = Math.min(scrollY / maxScroll, 1)
    const contentOpacity = 1 - scrollProgress
    const contentTranslateY = -(scrollProgress * 200)
    const contentScale = 1 - scrollProgress * 0.15
    const contentBlur = scrollProgress * 8

    return (
        <>
            <Header />
            <main className="bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f6_100%)]">
                <section className="relative flex h-screen items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 -mt-40">
                        <Image
                            src="/hc/12.jpeg"
                            alt="Sabores de cheesecake"
                            fill
                            priority
                            className="object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-black opacity-55" />
                    </div>

                    <div
                        className="relative z-10 mx-auto mt-20 max-w-4xl px-4 text-center"
                        style={{
                            opacity: contentOpacity,
                            transform: `translateY(${contentTranslateY}px) scale(${contentScale})`,
                            filter: `blur(${contentBlur}px)`,
                            transition: "none",
                            willChange: "transform, opacity, filter",
                        }}
                    >
                        <p
                            className={`mb-6 text-sm uppercase tracking-[0.3em] text-white/70 transition-all duration-1000 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                                }`}
                        >
                            Sabores
                        </p>

                        <h1
                            className={`font-bebas text-7xl font-normal uppercase leading-[0.85] tracking-tight text-white transition-all duration-1000 delay-200 md:text-9xl lg:text-[8rem] ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                                }`}
                            style={{
                                letterSpacing: "-0.02em",
                            }}
                        >
                            NUESTROS SABORES
                        </h1>

                        <p
                            className={`mt-8 text-lg font-light text-white/80 transition-all duration-1000 delay-400 md:text-xl ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                                }`}
                        >
                            Desde las recetas más clásicas hasta combinaciones sorprendentes.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            document
                                .getElementById("sabores-lista")
                                ?.scrollIntoView({ behavior: "smooth" })
                        }}
                        className={`group absolute bottom-12 left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-3 transition-all duration-1000 delay-700 ${mounted ? "opacity-100" : "opacity-0"
                            }`}
                        aria-label="Scroll para ver sabores"
                    >
                        <span className="text-xs uppercase tracking-[0.2em] text-white/70 transition-colors group-hover:text-white">
                            Descubrir
                        </span>
                        <ChevronDown className="h-5 w-5 animate-bounce text-white/70 transition-colors group-hover:text-white" />
                    </button>
                </section>

                <section id="sabores-lista" className="mt-20 pb-28">
                    <div className="container mx-auto px-4">
                        {isLoading ? (
                            <div className="space-y-12">
                                <div
                                    className="
                                        rounded-[28px]
                                        border border-[rgba(56,56,54,0.08)]
                                        bg-white/55
                                        px-8 py-8
                                        shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                                    "
                                >
                                    <div className="h-4 w-20 animate-pulse rounded bg-[rgba(56,56,54,0.06)]" />
                                    <div className="mt-4 h-10 w-56 animate-pulse rounded bg-[rgba(56,56,54,0.08)]" />
                                    <div className="mt-4 h-5 w-72 animate-pulse rounded bg-[rgba(56,56,54,0.06)]" />
                                </div>

                                <LoadingSkeleton />
                            </div>
                        ) : (
                            <div className="space-y-20">
                                {flavorsHappyCheese.length > 0 && (
                                    <StoreBlock
                                        title="HappyCheese"
                                        address="Carrer de Joan Alcover 27, 07006, Palma"
                                        flavors={flavorsHappyCheese}
                                    />
                                )}

                                {flavorsHappyCheeseLux.length > 0 && (
                                    <StoreBlock
                                        title="HappyCheese LUX"
                                        address="Carrer de Can Brondo 5, 07001, Palma"
                                        flavors={flavorsHappyCheeseLux}
                                    />
                                )}

                                {flavorsHappyCheese.length === 0 &&
                                    flavorsHappyCheeseLux.length === 0 && (
                                        <div
                                            className="
                                                mx-auto max-w-2xl rounded-[28px]
                                                border border-[rgba(56,56,54,0.08)]
                                                bg-white/55 px-8 py-12 text-center
                                                shadow-[0_10px_30px_rgba(0,0,0,0.04)]
                                            "
                                        >
                                            <p className="text-lg text-[rgba(56,56,54,0.72)]">
                                                Ahora mismo no hay sabores disponibles.
                                            </p>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
}