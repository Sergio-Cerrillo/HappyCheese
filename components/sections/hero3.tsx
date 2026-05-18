"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"

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
                threshold: 0.2,
                rootMargin: "0px 0px -10% 0px",
            }
        )

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    return { ref, visible }
}

export function HeroSection3() {
    const { ref, visible } = useInView<HTMLElement>()

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        setIsMobile(window.innerWidth < 1024)

        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024)
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const isVisible = visible ?? true

    return (
        <section
            ref={ref}
            className="relative min-h-[40vh] flex items-center justify-center overflow-hidden"
        >
            {/* Background */}
            <div className="absolute inset-0">
                <Image
                    src={isMobile ? "/hero3-mobile.jpeg" : "/hero3.png"}
                    alt=""
                    fill
                    className="object-cover object-center"
                    priority
                />
                <div className="absolute inset-0 bg-black opacity-65" />
            </div>

            <div className="pointer-events-none absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-black to-transparent"></div>

            {/* Content */}
            <div
                className="relative z-10 text-center px-4 max-w-5xl mx-auto"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                        ? "translateY(0px) scale(1)"
                        : "translateY(60px) scale(0.96)",
                    filter: isVisible ? "blur(0px)" : "blur(8px)",
                    transition:
                        "opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1), filter 1s cubic-bezier(0.16, 1, 0.3, 1)",
                    willChange: "transform, opacity, filter",
                }}
            >
                {/* Title */}
                <h1
                    className="font-sans italic uppercase text-xl md:text-6xl lg:text-[3rem] tracking-tight text-white font-bold"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible
                            ? "translateY(0px)"
                            : "translateY(40px)",
                        filter: isVisible ? "blur(0px)" : "blur(6px)",
                        transition:
                            "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, filter 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
                    }}
                >
                    "Una buena tarta de queso detiene el mundo por un instante."
                </h1>

                {/* Author */}
                <p
                    className="block text-sm mt-6 tracking-[0.3em] uppercase text-white/70"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible
                            ? "translateY(0px)"
                            : "translateY(30px)",
                        filter: isVisible ? "blur(0px)" : "blur(4px)",
                        transition:
                            "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s",
                    }}
                >
                    — Alejandro Caballero
                </p>
            </div>
        </section>
    )
}