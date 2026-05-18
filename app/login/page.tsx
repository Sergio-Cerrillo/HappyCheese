"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, LockKeyhole, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Sesión iniciada correctamente")
        router.push("/admin")
        router.refresh()
      } else {
        toast.error(data.error || "Error al iniciar sesión")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f6_100%)]">
      {/* halos decorativos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(56,56,54,0.05)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[rgba(56,56,54,0.04)] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* branding superior */}
          <div className="mb-10 text-center">
            <Link href="/" className="inline-block transition-opacity duration-300 hover:opacity-80">
              <h1
                className="font-bebas text-5xl leading-none tracking-[0.04em] text-[rgb(56,56,54)] md:text-6xl"
                style={{ letterSpacing: "-0.02em" }}
              >
                HAPPYCHEESE
              </h1>
            </Link>

            <p className="mt-4 text-sm uppercase tracking-[0.22em] text-[rgba(56,56,54,0.58)]">
              Acceso administrativo
            </p>
          </div>

          {/* card login */}
          <section
            className="
              relative overflow-hidden rounded-[30px]
              border border-[rgba(56,56,54,0.08)]
              bg-white/65 backdrop-blur-xl
              shadow-[0_14px_40px_rgba(0,0,0,0.06)]
            "
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.42),transparent_45%,rgba(56,56,54,0.04))]" />

            <div className="relative z-10 px-7 py-8 md:px-8 md:py-9">
              <div className="mb-8 text-center">
                <div
                  className="
                    mx-auto mb-5 flex h-14 w-14 items-center justify-center
                    rounded-2xl border border-[rgba(56,56,54,0.08)]
                    bg-[rgba(56,56,54,0.05)]
                  "
                >
                  <LockKeyhole className="h-6 w-6 text-[rgb(56,56,54)]" />
                </div>

                <h2 className="font-bebas text-3xl font-semibold text-[rgb(56,56,54)]">
                  Iniciar sesión
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-[rgba(56,56,54,0.68)]">
                  Introduce tus credenciales para acceder al panel de administración.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.62)]"
                  >
                    Usuario
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tu usuario"
                    required
                    disabled={isLoading}
                    className="
                      h-12 rounded-xl border-[rgba(56,56,54,0.10)]
                      bg-white/70 text-[rgb(56,56,54)]
                      placeholder:text-[rgba(56,56,54,0.38)]
                      shadow-none
                      transition-all duration-300
                      focus:border-[rgba(56,56,54,0.22)]
                      focus:ring-0
                    "
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-[11px] uppercase tracking-[0.18em] text-[rgba(56,56,54,0.62)]"
                  >
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="
                      h-12 rounded-xl border-[rgba(56,56,54,0.10)]
                      bg-white/70 text-[rgb(56,56,54)]
                      placeholder:text-[rgba(56,56,54,0.38)]
                      shadow-none
                      transition-all duration-300
                      focus:border-[rgba(56,56,54,0.22)]
                      focus:ring-0
                    "
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="
                    mt-2 h-12 w-full rounded-xl
                    bg-[rgb(56,56,54)] text-white
                    transition-all duration-300
                    hover:scale-[1.02] hover:bg-[rgba(56,56,54,0.92)]
                    active:scale-[0.98]
                  "
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Entrar al panel"
                  )}
                </Button>
              </form>

              <div className="mt-8 flex items-center justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-[rgba(56,56,54,0.62)] transition-colors duration-300 hover:text-[rgb(56,56,54)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </Link>
              </div>

              <div
                className="
                  mt-8 rounded-2xl border border-[rgba(56,56,54,0.08)]
                  bg-[rgba(56,56,54,0.04)] px-4 py-4
                "
              >
                <p className="text-center text-xs leading-relaxed text-[rgba(56,56,54,0.62)]">
                  <span className="font-medium text-[rgb(56,56,54)]">
                    Credenciales de prueba:
                  </span>
                  <br />
                  Usuario: admin · Contraseña: admin123
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}