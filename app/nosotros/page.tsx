"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Heart, Leaf, Award, Clock, ChevronDown } from "lucide-react"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

function useInView<T extends HTMLElement>() {
    const ref = useRef<T | null>(null)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    return { ref, visible }
}

const features = [
    {
        icon: Heart,
        title: "Pasion Artesanal",
        description: "Cada tarta esta elaborada a mano con dedicacion y amor por nuestros maestros pasteleros.",
    },
    {
        icon: Leaf,
        title: "Ingredientes Premium",
        description: "Solo utilizamos queso crema de primera calidad, huevos de gallinas camperas y productos locales.",
    },
    {
        icon: Award,
        title: "Recetas Exclusivas",
        description: "Nuestras recetas han sido perfeccionadas durante anos para lograr el equilibrio perfecto.",
    },
    {
        icon: Clock,
        title: "Frescura Garantizada",
        description: "Horneamos cada dia para garantizar que siempre disfrutes de una tarta recien hecha.",
    },
]

interface FAQItem {
    question: string
    answer: string
}

const faqItems: FAQItem[] = [
    {
        question: "¿Hacéis tartas sin gluten?",
        answer:
            "Sí, elaboramos tartas sin gluten por encargo. Se preparan en el mismo obrador que productos con gluten, por lo que no podemos garantizar la ausencia total de trazas.",
    },
    {
        question: "¿Son aptas para embarazadas?",
        answer:
            "Sí. Nuestras tartas son aptas para embarazadas. Están elaboradas con ingredientes de alta calidad y totalmente pasteurizados.",
    },
    {
        question: "¿Cuánto tiempo duran y cómo las conservo?",
        answer:
            "Las tartas tienen un consumo preferente de 4 días en nevera. También es posible congelarlas. Duran hasta 3 meses congeladas. Descongelar 24 horas antes de consumir.",
    },
    {
        question: "¿Hacéis tartas sin azúcar?",
        answer:
            "Sí, consúltanos sin compromiso en nuestras tiendas. Las endulzamos con eritritol y las hacemos estilo la viña.",
    },
    {
        question: "¿Tenéis tartas completas en tienda y sin encargo?",
        answer:
            "Sí. A veces tenemos tartas disponibles. Pregúntanos sin compromiso.",
    },
    {
        question: "¿Qué alérgenos contienen las tartas?",
        answer:
            "Leche y derivados. Huevo y derivados. Cereales que contengan gluten. Sulfitos. Trazas de soja. Pueden contener trazas de cacahuete, avellanas, pistacho y otros frutos secos. Pueden contener trazas de otros frutos de cáscara.",
    },
    {
        question: "¿Puedo llevarme la tarta de viaje?",
        answer:
            "Sí, puedes llevarlas de viaje sin problema. Al llegar a tu destino refrigérala 3-4 horas y estará en su punto ideal para disfrutar.",
    },
    {
        question: "¿Trabajáis con restaurantes o eventos?",
        answer:
            "Sí. Nos encanta formar parte de restaurantes y eventos. Ponte en contacto con nosotros.",
    },
    {
        question: "¿Con cuánta antelación puedo hacer una reserva?",
        answer:
            "Con 36h de antelación puedes hacer tu reserva por la web o en tienda física. Para festivos y fines de semana recomendamos hacer las reservas con más antelación para que podáis asegurar vuestro pedido.",
    },
    {
        question: "¿Aceptáis cambios o devoluciones?",
        answer:
            "Los cambios de fecha han de realizarse con al menos 48h de la fecha deseada a través de nuestro teléfono o correo happycheesemallorca@gmail.com indicando su número de pedido. Para anular un pedido también es necesario avisar con al menos 48h de antelación. No se aceptan cambios o devoluciones de pedidos no recogidos sin previo aviso dentro de ese plazo.",
    },
    {
        question: "¿Disponéis de servicio de entrega a domicilio?",
        answer:
            "Sí, a través de Glovo o Uber Eats puedes hacer un pedido de porciones, tarta pequeña y formatos lux. Las tartas medianas y grandes solo están disponibles para recogidas en tienda.",
    },
]

function HeroAbout() {
    const [mounted, setMounted] = useState(false)
    const [scrollY, setScrollY] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        setMounted(true)
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY)
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const maxScroll = 350
    const progress = Math.min(scrollY / maxScroll, 1)

    return (
        <section className="relative flex h-screen items-center justify-center overflow-hidden">
            <div className="absolute inset-0 -mt-40">
                <Image
                    src={isMobile ? "/bg.png" : "/bg1.png"}
                    alt=""
                    fill
                    priority
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/55" />
            </div>

            <div
                className="relative z-10 text-center max-w-4xl px-4 mt-20"
                style={{
                    opacity: 1 - progress,
                    transform: `translateY(${-progress * 200}px) scale(${1 - progress * 0.15})`,
                    filter: `blur(${progress * 8}px)`
                }}
            >
                <p className={`mb-6 text-sm uppercase tracking-[0.3em] text-white/70 transition-all duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}>
                    Nuestra esencia
                </p>

                <h1 className={`font-bebas text-7xl md:text-9xl lg:text-[8rem] text-white transition-all duration-1000 delay-200 ${mounted ? "opacity-100" : "opacity-0"}`}>
                    ¿QUÉ ES HAPPYCHEESE?
                </h1>

                <p className={`mt-8 text-lg text-white/80 transition-all duration-1000 delay-400 ${mounted ? "opacity-100" : "opacity-0"}`}>
                    Tradición, técnica y creatividad en cada cheesecake.
                </p>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
                <ChevronDown className="text-white animate-bounce" />
            </div>
        </section>
    )
}

export default function AboutSection() {
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => entry.isIntersecting && setIsVisible(true),
            { threshold: 0.1 }
        )

        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    return (
        <>
            <Header />
            <HeroAbout />

            <section ref={sectionRef} className="py-24 bg-card">
                <div className="container mx-auto px-4">

                    {/* BLOQUE ORIGINAL */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                                <Image src="/us.jpeg" alt="" fill className="object-cover" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <p className="uppercase tracking-wider">
                                    NUESTRA ESENCIA
                                </p>
                                <h1 className="font-bebas text-4xl">
                                    Un clásico reinventado.
                                </h1>
                            </div>

                            {/* TEXTOS ORIGINALES */}
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>
                                    Cada cheesecake nace de una idea simple: convertir un clásico en algo extraordinario. La elaboración se basa en el respeto por los ingredientes, la precisión en cada detalle y el equilibrio perfecto entre textura y sabor.
                                </p>
                                <p>
                                    Junto a las versiones más tradicionales, convive una colección de creaciones donde nuevos sabores, combinaciones inesperadas y matices cuidadosamente trabajados dan forma a una propuesta única. Cada tarta mantiene la esencia cremosa que define a un buen cheesecake, pero con personalidad propia.
                                </p>
                                <p>
                                    El resultado es una experiencia que va más allá de un simple postre: una selección de cheesecakes pensada para descubrir, disfrutar y volver a sorprender en cada bocado.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FEATURES */}
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

                    {/* 🔥 NUEVAS CARDS */}
                    <div className="grid md:grid-cols-3 gap-8 mt-28">
                        {[
                            { title: "Base", desc: "Partiendo del éxito.", img: "/hc/14.jpeg" },
                            { title: "Toque", desc: "Diferencia maestra.", img: "/hc/3.jpeg" },
                            { title: "Elaboración", desc: "Acabado perfecto.", img: "/hc/4.jpeg" }
                        ].map((c, i) => (
                            <div key={i} className="group relative h-[420px] rounded-3xl overflow-hidden">
                                <Image src={c.img} alt="" fill className="object-cover group-hover:scale-105 transition" />
                                <div className="absolute inset-0 bg-black/40" />
                                <div className="absolute bottom-0 p-6 text-white">
                                    <h3 className="text-2xl">{c.title}</h3>
                                    <p>{c.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-24 bg-card">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Glass Card Container */}
                        <div className="
                            relative overflow-hidden
                            rounded-3xl p-8 md:p-12 lg:p-16
                            border border-[rgba(56,56,54,0.08)]
                            bg-white/60 backdrop-blur-xl
                            shadow-[0_8px_30px_rgba(0,0,0,0.05)]
                        ">
                            {/* Subtle gradient overlay */}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-[rgba(56,56,54,0.02)]" />

                            {/* Content */}
                            <div className="relative z-10">
                                {/* Header */}
                                <div className="mb-10 md:mb-14 text-center">
                                    <p className="uppercase tracking-wider text-sm text-[rgba(56,56,54,0.6)] mb-3">
                                        PREGUNTAS FRECUENTES
                                    </p>
                                    <h2 className="font-bebas text-4xl md:text-5xl text-[rgb(56,56,54)]">
                                        Todo lo que necesitas saber
                                    </h2>
                                    <p className="mt-4 text-[rgba(56,56,54,0.72)] max-w-2xl mx-auto">
                                        Respuestas claras a las dudas más comunes sobre nuestros cheesecakes artesanales
                                    </p>
                                </div>

                                {/* Accordion */}
                                <Accordion type="single" collapsible className="w-full space-y-3">
                                    {faqItems.map((item, index) => (
                                        <AccordionItem
                                            key={index}
                                            value={`item-${index}`}
                                            className="
                                                border border-[rgba(56,56,54,0.08)]
                                                rounded-xl
                                                bg-white/40
                                                px-6
                                                transition-all duration-300
                                                hover:bg-white/60
                                                hover:shadow-md
                                                data-[state=open]:bg-white/70
                                                data-[state=open]:shadow-lg
                                            "
                                        >
                                            <AccordionTrigger className="
                                                text-left
                                                text-[rgb(56,56,54)]
                                                hover:no-underline
                                                py-5
                                                text-base md:text-lg
                                                font-medium
                                                [&[data-state=open]]:text-[rgb(56,56,54)]
                                            ">
                                                {item.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="
                                                text-[rgba(56,56,54,0.72)]
                                                leading-relaxed
                                                pb-5
                                                pt-2
                                                text-sm md:text-base
                                            ">
                                                {item.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>


                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    )
}