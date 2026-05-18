"use client"

import { useEffect, useRef, useState } from "react"
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

export function HeroSection2() {
    const { ref, visible } = useInView<HTMLElement>()
    const isVisible = visible ?? true

    return (
        <section
            ref={ref}
            className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        >
            {/* Background */}
            <div className="absolute inset-0 -mt-40">
                <Image
                    src="/hc/10.jpeg"
                    alt=""
                    fill
                    className="object-cover object-center"
                    priority
                />
                <div className="absolute inset-0 bg-black opacity-65" />
            </div>

            {/* fades */}
            <div className="pointer-events-none absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-white to-transparent"></div>
            <div className="pointer-events-none absolute bottom-0 left-0 w-full h-72 bg-gradient-to-t from-white to-transparent"></div>

            {/* Content */}
            <div
                className="relative z-10 text-center px-4 max-w-4xl mx-auto"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                        ? "translateY(0px) scale(1)"
                        : "translateY(70px) scale(0.96)",
                    filter: isVisible ? "blur(0px)" : "blur(10px)",
                    transition:
                        "opacity 1.1s cubic-bezier(0.16, 1, 0.3, 1), transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), filter 1.1s cubic-bezier(0.16, 1, 0.3, 1)",
                    willChange: "transform, opacity, filter",
                }}
            >
                {/* Subtitle */}
                <p
                    className="text-sm tracking-[0.3em] uppercase text-white/70 mb-6"
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
                    Cremoso. Suave. Perfecto
                </p>

                {/* Title */}
                <h1
                    className="font-sans uppercase text-1xl md:text-9xl lg:text-[3rem] leading-[0.85] tracking-tight text-white font-bold"
                    style={{
                        letterSpacing: "-0.00em",
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible
                            ? "translateY(0px)"
                            : "translateY(50px)",
                        filter: isVisible ? "blur(0px)" : "blur(8px)",
                        transition:
                            "opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s, filter 1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s",
                    }}
                >
                    La textura que hace suspirar.
                </h1>
            </div>
        </section>
    )
}