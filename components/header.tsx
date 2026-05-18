"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/nosotros", label: "Nosotros" },
  { href: "/sabores", label: "Sabores" },
  { href: "/#tiendas", label: "Tiendas" },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [mounted])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "mx-auto w-full transition-all duration-500",
          isScrolled ? "px-3 pt-3 md:px-6 md:pt-4" : "px-0 pt-0"
        )}
      >
        <div
          className={cn(
            "mx-auto transition-all duration-500",
            isScrolled ? "max-w-7xl rounded-2xl" : "max-w-full rounded-none"
          )}
        >
          <div
            className={cn(
              "transition-all duration-500",
              isScrolled
                ? "rounded-2xl border border-white/12 bg-[linear-gradient(135deg,rgba(56,56,54,0.52),rgba(56,56,54,0.34))] shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl"
                : "rounded-none border border-transparent bg-transparent shadow-none"
            )}
          >
            <div
              className={cn(
                "container mx-auto px-4 transition-all duration-500",
                isScrolled ? "h-[72px]" : "h-[88px]"
              )}
            >
              <div className="grid h-full grid-cols-3 items-center">
                {/* LEFT */}
                <div className="flex items-center justify-start">
                  <nav className="hidden md:flex items-center gap-8 lg:gap-10">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-[11px] uppercase tracking-[0.22em] text-white/78 transition-colors duration-300 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="h-11 w-11 md:hidden" />
                </div>

                {/* CENTER */}
                <div className="flex items-center justify-center">
                  <Link
                    href="/"
                    className="font-bebas text-[30px] leading-none tracking-[0.04em] text-white transition-opacity duration-300 hover:opacity-80 md:text-[36px]"
                  >
                    HappyCheese
                  </Link>
                </div>

                {/* RIGHT */}
                <div className="flex items-center justify-end gap-3 md:gap-4">
                  <div className="hidden md:flex items-center gap-4">
                    <Link
                      href="/login"
                      className="text-[11px] uppercase tracking-[0.22em] text-white/68 transition-colors duration-300 hover:text-white"
                    >
                      Admin
                    </Link>

                    <Link
                      href="/pedido"
                      className="
                        inline-flex items-center justify-center
                        rounded-xl border border-white/12 bg-white/10
                        px-5 py-3 text-[11px] uppercase tracking-[0.22em]
                        text-white backdrop-blur-md
                        transition-all duration-300
                        hover:scale-[1.03] hover:bg-white/16
                      "
                    >
                      Pedido
                    </Link>
                  </div>

                  {mounted && (
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                      <SheetTrigger asChild className="md:hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-11 w-11 rounded-xl border border-white/12 bg-white/10 text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:bg-white/14 hover:text-white",
                            !isScrolled && "border-white/10 bg-black/20"
                          )}
                        >
                          <Menu className="h-5 w-5" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </SheetTrigger>

                      <SheetContent
                        side="right"
                        hideCloseButton
                        className="
    w-full max-w-[340px]
    border-l border-white/10
    bg-[linear-gradient(180deg,rgba(56,56,54,0.96),rgba(46,46,44,0.94))]
    px-0 text-white
    backdrop-blur-2xl
  "
                      >
                        <SheetTitle className="sr-only">
                          Menú de navegación
                        </SheetTitle>

                        <div className="flex h-full flex-col">
                          {/* Top */}
                          <div
                            className="border-b border-white/10 px-6 pb-6 pt-6"
                            style={{
                              animation: isOpen ? 'slideInFromTop 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <Link
                                  href="/"
                                  className="inline-block font-bebas text-4xl leading-none tracking-wide text-white transition-opacity duration-300 hover:opacity-80"
                                  onClick={() => setIsOpen(false)}
                                >
                                  HappyCheese
                                </Link>
                                <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-white/65">
                                  Cheesecakes artesanales con carácter propio.
                                </p>
                              </div>

                              <SheetClose asChild>
                                <button
                                  className="
              inline-flex items-center justify-center
              rounded-xl border border-white/12 bg-white/10
              px-4 py-2 text-[11px] uppercase tracking-[0.18em]
              text-white transition-all duration-300
              hover:scale-[1.02] hover:bg-white/14
            "
                                  aria-label="Cerrar menú"
                                >
                                  Cerrar
                                </button>
                              </SheetClose>
                            </div>
                          </div>

                          {/* Nav */}
                          <nav className="flex flex-col px-6 py-8">
                            {navLinks.map((link, index) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="
            border-b border-white/8 py-4
            text-right text-base uppercase tracking-[0.18em]
            text-white/82 transition-all duration-300
            hover:translate-x-[-2px] hover:text-white
          "
                                style={{
                                  animation: isOpen ? `slideInFromRightSmall 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + index * 0.08}s both` : 'none'
                                }}
                                onClick={() => setIsOpen(false)}
                              >
                                {link.label}
                              </Link>
                            ))}

                            <Link
                              href="/pedido"
                              className="
          mt-6 inline-flex items-center justify-center
          rounded-xl bg-white px-5 py-4
          text-sm uppercase tracking-[0.18em]
          text-[rgb(56,56,54)]
          transition-all duration-300
          hover:scale-[1.02] hover:bg-white/90
        "
                              style={{
                                animation: isOpen ? `scaleIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + navLinks.length * 0.08 + 0.1}s both` : 'none'
                              }}
                              onClick={() => setIsOpen(false)}
                            >
                              Hacer pedido
                            </Link>
                          </nav>

                          {/* Footer */}
                          <div className="mt-auto  px-6 py-6">
                            <Link
                              href="/login"
                              className="
          mb-4 block text-sm uppercase tracking-[0.18em]
          text-white/50 transition-colors duration-300
          hover:text-white/80 text-center border-b border-white/10 pb-5
        "
                              onClick={() => setIsOpen(false)}
                            >
                              Admin
                            </Link>

                            <p className="text-center  text-[11px] uppercase tracking-[0.22em] text-white/55">
                              Palma de Mallorca
                            </p>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}