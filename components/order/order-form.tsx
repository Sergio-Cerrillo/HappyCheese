"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { toast } from 'sonner'
import {
  MapPin,
  ShoppingBag,
  User,
  ArrowRight,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  Check,
  Users,
} from 'lucide-react'
import type { Store, Flavor, OrderItem, PortionType } from '@/lib/types'
import {
  getMinPickupDate,
  getMaxPickupDate,
  formatDateForInput,
} from '@/lib/date-utils'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type Step = 'store' | 'flavors' | 'details' | 'confirm'

const PORTION_LABELS: Record<PortionType, string> = {
  individual: 'Individual',
  doble: 'Doble',
  mediana: 'Mediana',
  grande: 'Grande',
}

/**
 * Obtiene el precio de una porción para un sabor en una tienda específica.
 * Si la tienda tiene precios personalizados, los usa; si no, usa los precios por defecto.
 */
const getFlavorPrice = (
  flavor: Flavor,
  portion: PortionType,
  storeId: string
): number => {
  const storeAvailability = flavor.availability.find((a) => a.storeId === storeId)
  
  // Si hay precios personalizados para esta tienda, usarlos
  if (storeAvailability?.prices) {
    return storeAvailability.prices[portion]
  }
  
  // Si no, usar los precios por defecto del sabor
  return flavor.prices[portion]
}

const STEP_LABELS: Record<Step, string> = {
  store: 'Tienda',
  flavors: 'Sabores',
  details: 'Datos',
  confirm: 'Confirmar',
}

const STEPS: Step[] = ['store', 'flavors', 'details', 'confirm']

const shellCardClass =
  'rounded-[28px] border border-[rgba(56,56,54,0.08)] bg-white/58 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)]'

const sectionTitleClass =
  'flex items-center gap-2 text-[rgb(56,56,54)] text-xl md:text-2xl font-semibold tracking-tight'

export function OrderForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('store')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const [stores, setStores] = useState<Store[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [selectedStore, setSelectedStore] = useState<string>('')
  const [cart, setCart] = useState<OrderItem[]>([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    pickupDate: '',
    pickupTime: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [storesRes, flavorsRes] = await Promise.all([
        fetch('/api/stores'),
        fetch('/api/flavors'),
      ])

      if (storesRes.ok) setStores(await storesRes.json())
      if (flavorsRes.ok) setFlavors(await flavorsRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const selectedStoreData = stores.find((s) => s.id === selectedStore)

  const availableFlavors = flavors.filter((f) => {
    const availability = f.availability.find((a) => a.storeId === selectedStore)
    return f.active && availability && availability.portions.length > 0
  })

  const addToCart = (flavor: Flavor, portion: PortionType) => {
    const price = getFlavorPrice(flavor, portion, selectedStore)
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.flavorId === flavor.id && item.portion === portion
      )
      if (existing) {
        return prev.map((item) =>
          item.flavorId === flavor.id && item.portion === portion
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          flavorId: flavor.id,
          flavorName: flavor.name,
          portion,
          quantity: 1,
          price,
        },
      ]
    })
    toast.success(`${flavor.name} (${PORTION_LABELS[portion]}) añadida al pedido`)
  }

  const updateQuantity = (
    flavorId: string,
    portion: PortionType,
    delta: number
  ) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.flavorId === flavorId && item.portion === portion) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    })
  }

  const removeFromCart = (flavorId: string, portion: PortionType) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.flavorId === flavorId && item.portion === portion)
      )
    )
    toast.info('Producto eliminado del pedido')
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function isValidEmail(email: string): boolean {
    // Simple regex for email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function isValidPhone(phone: string): boolean {
    // Solo dígitos, 9 números
    return /^\d{9}$/.test(phone)
  }

  const canProceed = () => {
    switch (step) {
      case 'store':
        return selectedStore !== ''
      case 'flavors':
        return cart.length > 0
      case 'details': {
        const validEmail = isValidEmail(customerInfo.email)
        const validPhone = isValidPhone(customerInfo.phone)
        return (
          customerInfo.name &&
          validEmail &&
          validPhone &&
          customerInfo.pickupDate &&
          customerInfo.pickupTime
        )
      }
      default:
        return true
    }
  }

  const nextStep = () => {
    if (step === 'details') {
      if (!isValidEmail(customerInfo.email)) {
        toast.error('Introduce un email válido')
        return
      }
      if (!isValidPhone(customerInfo.phone)) {
        toast.error('Introduce un teléfono válido (9 dígitos)')
        return
      }
    }
    if (!canProceed()) {
      toast.error('Por favor, completa todos los campos requeridos')
      return
    }
    if (step === 'store') setStep('flavors')
    else if (step === 'flavors') setStep('details')
    else if (step === 'details') setStep('confirm')
  }

  const prevStep = () => {
    if (step === 'flavors') setStep('store')
    else if (step === 'details') setStep('flavors')
    else if (step === 'confirm') setStep('details')
  }

  const handleSubmitOrder = async () => {
    if (!isValidEmail(customerInfo.email)) {
      toast.error('Introduce un email válido')
      return
    }
    if (!isValidPhone(customerInfo.phone)) {
      toast.error('Introduce un teléfono válido (9 dígitos)')
      return
    }
    if (!canProceed()) {
      toast.error('Por favor, completa todos los campos requeridos')
      return
    }

    setProcessing(true)

    try {
      // Añadir +34 automáticamente si no está
      let phoneToSend = customerInfo.phone
      if (!phoneToSend.startsWith('+34')) {
        phoneToSend = '+34' + phoneToSend
      }
      // Crear sesión de pago con Stripe
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          storeId: selectedStore,
          storeName: selectedStoreData?.name || '',
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: phoneToSend,
          notes: customerInfo.notes,
          total,
          pickupDate: customerInfo.pickupDate,
          pickupTime: customerInfo.pickupTime,
        }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirigir a Stripe Checkout
        toast.success('Redirigiendo al pago seguro...')
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Error al procesar el pedido')
        setProcessing(false)
      }
    } catch (error) {
      console.error('Order error:', error)
      toast.error('Error de conexión')
      setProcessing(false)
    }
  }

  const minDate = formatDateForInput(getMinPickupDate())
  const maxDate = formatDateForInput(getMaxPickupDate())

  if (loading) {
    return (
      <div className={`${shellCardClass} flex items-center justify-center py-16`}>
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(56,56,54)]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className={`${shellCardClass} px-5 py-6 md:px-8`}>
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                  step === s
                    ? 'bg-[rgb(56,56,54)] text-white shadow-[0_8px_20px_rgba(56,56,54,0.18)]'
                    : STEPS.indexOf(step) > i
                      ? 'bg-[rgba(56,56,54,0.12)] text-[rgb(56,56,54)]'
                      : 'bg-[rgba(56,56,54,0.06)] text-[rgba(56,56,54,0.55)]'
                )}
              >
                {i + 1}
              </div>

              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-1 h-[2px] w-8 rounded-full md:mx-2 md:w-16',
                    STEPS.indexOf(step) > i
                      ? 'bg-[rgba(56,56,54,0.18)]'
                      : 'bg-[rgba(56,56,54,0.08)]'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-center gap-4 text-xs uppercase tracking-[0.14em] md:text-sm">
          {STEPS.map((s) => (
            <span
              key={s}
              className={cn(
                'transition-colors',
                step === s
                  ? 'text-[rgb(56,56,54)] font-medium'
                  : 'text-[rgba(56,56,54,0.45)]'
              )}
            >
              {STEP_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 'store' && (
        <Card className={shellCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className={sectionTitleClass}>
              <MapPin className="h-5 w-5 text-[rgb(56,56,54)]" />
              Selecciona dónde recoger tu pedido
            </CardTitle>
          </CardHeader>

          <CardContent>
            {stores.length === 0 ? (
              <div
                className="
                  rounded-[24px] border border-dashed border-[rgba(56,56,54,0.15)]
                  bg-[rgba(56,56,54,0.02)] py-10 text-center text-[rgba(56,56,54,0.55)]
                "
              >
                No hay tiendas disponibles en este momento
              </div>
            ) : (
              <RadioGroup
                value={selectedStore}
                onValueChange={setSelectedStore}
                className="grid gap-4 md:grid-cols-2"
              >
                {stores.map((store) => (
                  <Label
                    key={store.id}
                    htmlFor={store.id}
                    className={cn(
                      'cursor-pointer rounded-[24px] border p-6 transition-all duration-300',
                      'bg-white/60 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)]',
                      selectedStore === store.id
                        ? 'border-[rgba(56,56,54,0.25)] bg-black text-white'
                        : 'border-[rgba(56,56,54,0.08)] text-[rgb(56,56,54)] hover:border-[rgba(56,56,54,0.18)] hover:-translate-y-[2px]'
                    )}
                  >
                    <RadioGroupItem
                      value={store.id}
                      id={store.id}
                      className="sr-only"
                    />


                    <div className="flex flex-col text-center justify-center w-full">
                      <span className="mb-2 mr-2block font-bebas text-2xl leading-none ">
                        {store.name}
                      </span>
                      <span className="flex items-center justify-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        {store.address}
                      </span>
                      <span className="text-sm ">
                        {store.hours}
                      </span>
                    </div>

                  </Label>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'flavors' && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className={shellCardClass}>
              <CardHeader className="pb-2">
                <CardTitle className={sectionTitleClass}>
                  <ShoppingBag className="h-5 w-5 text-[rgb(56,56,54)]" />
                  Elige tus tartas favoritas
                </CardTitle>
                <p className="text-sm text-[rgba(56,56,54,0.55)]">
                  Disponibles en {selectedStoreData?.name}
                </p>
              </CardHeader>

              <CardContent>
                {availableFlavors.length === 0 ? (
                  <div
                    className="
                rounded-[24px] border border-dashed border-[rgba(56,56,54,0.15)]
                bg-[rgba(56,56,54,0.02)] py-10 text-center text-[rgba(56,56,54,0.55)]
              "
                  >
                    No hay sabores disponibles en esta tienda
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
                    {availableFlavors.map((flavor) => {
                      const cartCount = cart
                        .filter((item) => item.flavorId === flavor.id)
                        .reduce((sum, item) => sum + item.quantity, 0)

                      return (
                        <button
                          key={flavor.id}
                          type="button"
                          onClick={() => {
                            setSelectedFlavor(flavor)
                            setIsDrawerOpen(true)
                          }}
                          className="group relative aspect-square overflow-hidden rounded-2xl bg-muted/30 transition-all duration-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                        >
                          {/* Image */}
                          <Image
                            src={flavor.image || '/images/clasica.jpg'}
                            alt={flavor.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                          {/* Content */}
                          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                            <h3 className="text-sm font-medium text-white sm:text-base text-balance">
                              {flavor.name}
                            </h3>
                          </div>

                          {/* Cart badge */}
                          {cartCount > 0 && (
                            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background sm:h-7 sm:w-7">
                              {cartCount}
                            </div>
                          )}

                          {/* Hover indicator */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur-sm">
                              <Plus className="h-5 w-5" />
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Drawer for portion selection */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerContent className="max-h-[85vh]">
                {selectedFlavor && (() => {
                  const storeAvailability = selectedFlavor.availability.find(
                    (a) => a.storeId === selectedStore
                  )
                  const availablePortions = storeAvailability?.portions || []

                  return (
                    <>
                      <DrawerHeader className="pb-0">
                        <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-2xl sm:h-40 sm:w-40">
                          <Image
                            src={selectedFlavor.image || '/images/clasica.jpg'}
                            alt={selectedFlavor.name}
                            width={160}
                            height={160}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <DrawerTitle className="text-xl">{selectedFlavor.name}</DrawerTitle>
                        <DrawerDescription className="text-balance">
                          {selectedFlavor.description}
                        </DrawerDescription>
                      </DrawerHeader>

                      <div className="flex-1 overflow-auto px-4 py-6">
                        <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
                          Selecciona tamaño y cantidad
                        </p>
                        <div className="space-y-3">
                          {availablePortions.map((portion) => {
                            const inCart = cart.find(
                              (item) =>
                                item.flavorId === selectedFlavor.id &&
                                item.portion === portion
                            )
                            const price = getFlavorPrice(selectedFlavor, portion, selectedStore)

                            return (
                              <div
                                key={portion}
                                className={cn(
                                  'flex items-center justify-between rounded-xl border-2 p-4 transition-all duration-200',
                                  inCart
                                    ? 'border-foreground bg-foreground/5'
                                    : 'border-border hover:border-foreground/30'
                                )}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">
                                      {PORTION_LABELS[portion]}
                                    </span>
                                    {portion === 'mediana' && (
                                      <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-[rgba(56,56,54,0.08)] text-[rgb(56,56,54)] hover:bg-[rgba(56,56,54,0.12)]">
                                        <Users className="h-3 w-3" />
                                        8 personas
                                      </Badge>
                                    )}
                                    {portion === 'grande' && (
                                      <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-[rgba(56,56,54,0.08)] text-[rgb(56,56,54)] hover:bg-[rgba(56,56,54,0.12)]">
                                        <Users className="h-3 w-3" />
                                        14 personas
                                      </Badge>
                                    )}
                                    {inCart && (
                                      <Check className="h-4 w-4 text-foreground" />
                                    )}
                                  </div>
                                  <span className="text-lg font-semibold">
                                    {price.toFixed(2)}€
                                  </span>
                                </div>

                                {inCart ? (
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(selectedFlavor.id, portion, -1)
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-6 text-center font-semibold">
                                      {inCart.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(selectedFlavor.id, portion, 1)
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    onClick={() => addToCart(selectedFlavor, portion)}
                                    variant="outline"
                                    className="rounded-full px-5"
                                  >
                                    Añadir
                                  </Button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <DrawerFooter className="border-t border-border pt-4">
                        <DrawerClose asChild>
                          <Button className="w-full rounded-xl py-6 text-base bg-[rgb(56,56,54)] hover:bg-[rgba(56,56,54,0.88)] text-white shadow-[0_8px_20px_rgba(56,56,54,0.18)] transition-all duration-300">
                            Listo
                          </Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </>
                  )
                })()}
              </DrawerContent>
            </Drawer>
          </div>

          <div>
            <Card className={`${shellCardClass} sticky top-28`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-[rgb(56,56,54)]">
                  Tu pedido
                </CardTitle>
              </CardHeader>

              <CardContent>
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[rgba(56,56,54,0.55)]">
                    Aún no has añadido productos
                  </p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={`${item.flavorId}-${item.portion}`}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[rgb(56,56,54)]">
                            {item.flavorName}
                          </p>
                          <p className="text-xs text-[rgba(56,56,54,0.48)]">
                            {PORTION_LABELS[item.portion]} × {item.quantity}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[rgb(56,56,54)]">
                            {(item.price * item.quantity).toFixed(2)}€
                          </span>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full"
                            onClick={() =>
                              removeFromCart(item.flavorId, item.portion)
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-[rgba(56,56,54,0.08)] pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[rgb(56,56,54)]">
                          Total
                        </span>
                        <span className="text-2xl font-bold text-[rgb(56,56,54)]">
                          {total.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 'details' && (
        <Card className={shellCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className={sectionTitleClass}>
              <User className="h-5 w-5 text-[rgb(56,56,54)]" />
              Datos del pedido
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo*</Label>
                <Input
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Juan Pérez"
                  required
                  className="rounded-xl border-[rgba(56,56,54,0.1)] bg-white/75"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono*</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="612 345 678"
                  required
                  className="rounded-xl border-[rgba(56,56,54,0.1)] bg-white/75"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) =>
                  setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="tu@email.com"
                required
                className="rounded-xl border-[rgba(56,56,54,0.1)] bg-white/75"
              />
            </div>

            <div className="space-y-4 rounded-[22px] border border-[rgba(56,56,54,0.08)] bg-[rgba(56,56,54,0.03)] p-5">
              <div className="flex items-center gap-2 text-sm text-[rgba(56,56,54,0.58)]">
                <Calendar className="h-4 w-4" />
                <span>Recogida (mínimo 48 horas, máximo 1 año)</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pickupDate">Fecha de recogida*</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    min={minDate}
                    max={maxDate}
                    value={customerInfo.pickupDate}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        pickupDate: e.target.value,
                      }))
                    }
                    required
                    className="rounded-xl border-[rgba(56,56,54,0.1)] bg-white/80"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hora de recogida*</Label>
                  <div className="grid grid-cols-4 gap-2 md:grid-cols-5 lg:grid-cols-6">
                    {(() => {
                      // Determinar rango de horas según tienda
                      let start = 10, end = 20
                      if (selectedStoreData?.id === 'lux' || selectedStoreData?.name?.toLowerCase().includes('lux')) {
                        start = 11; end = 19
                      }
                      const hours = []
                      for (let h = start; h <= end; h++) {
                        hours.push(h)
                      }
                      return hours.map((h) => {
                        const value = `${h.toString().padStart(2, '0')}:00`
                        const selected = customerInfo.pickupTime === value
                        return (
                          <button
                            key={value}
                            type="button"
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                              selected
                                ? 'bg-[rgb(56,56,54)] text-white border-[rgb(56,56,54)] shadow'
                                : 'bg-white/80 text-[rgb(56,56,54)] border-[rgba(56,56,54,0.12)] hover:bg-[rgba(56,56,54,0.08)]'
                            )}
                            onClick={() =>
                              setCustomerInfo((prev) => ({ ...prev, pickupTime: value }))
                            }
                          >
                            {value}
                          </button>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                value={customerInfo.notes}
                onChange={(e) =>
                  setCustomerInfo((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Alergias, dedicatorias, o cualquier petición especial..."
                rows={4}
                className="rounded-xl border-[rgba(56,56,54,0.1)] bg-white/75"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card className={shellCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-[rgb(56,56,54)]">
              Confirma tu pedido
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-[22px] border border-[rgba(56,56,54,0.08)] bg-white/62 p-5">
              <h3 className="mb-2 font-semibold text-[rgb(56,56,54)]">
                Tienda de recogida
              </h3>
              <p className="text-sm">
                <span className="font-medium text-[rgb(56,56,54)]">
                  {selectedStoreData?.name}
                </span>
                <br />
                <span className="text-[rgba(56,56,54,0.58)]">
                  {selectedStoreData?.address}
                </span>
              </p>
            </div>

            <div className="rounded-[22px] border border-[rgba(56,56,54,0.08)] bg-white/62 p-5">
              <h3 className="mb-2 font-semibold text-[rgb(56,56,54)]">
                Fecha y hora de recogida
              </h3>
              <p className="text-sm text-[rgba(56,56,54,0.72)]">
                {new Date(
                  customerInfo.pickupDate + 'T' + customerInfo.pickupTime
                ).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                a las {customerInfo.pickupTime}
              </p>
            </div>

            <div className="rounded-[22px] border border-[rgba(56,56,54,0.08)] bg-white/62 p-5">
              <h3 className="mb-3 font-semibold text-[rgb(56,56,54)]">
                Productos
              </h3>

              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={`${item.flavorId}-${item.portion}`}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="text-[rgba(56,56,54,0.72)]">
                      {item.quantity}x {item.flavorName} ({PORTION_LABELS[item.portion]})
                    </span>
                    <span className="font-semibold text-[rgb(56,56,54)]">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[rgba(56,56,54,0.08)] pt-4">
                <span className="text-lg font-bold text-[rgb(56,56,54)]">
                  Total
                </span>
                <span className="text-2xl font-bold text-[rgb(56,56,54)]">
                  {total.toFixed(2)}€
                </span>
              </div>
            </div>

            <div className="rounded-[22px] border border-[rgba(56,56,54,0.08)] bg-white/62 p-5">
              <h3 className="mb-2 font-semibold text-[rgb(56,56,54)]">
                Datos de contacto
              </h3>
              <p className="text-sm">
                <span className="font-medium text-[rgb(56,56,54)]">
                  {customerInfo.name}
                </span>
                <br />
                <span className="text-[rgba(56,56,54,0.58)]">
                  {customerInfo.email}
                </span>
                <br />
                <span className="text-[rgba(56,56,54,0.58)]">
                  {customerInfo.phone}
                </span>
              </p>
            </div>

            {customerInfo.notes && (
              <div className="rounded-[22px] border border-[rgba(56,56,54,0.08)] bg-white/62 p-5">
                <h3 className="mb-2 font-semibold text-[rgb(56,56,54)]">Notas</h3>
                <p className="text-sm text-[rgba(56,56,54,0.62)]">
                  {customerInfo.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        {step !== 'store' ? (
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={processing}
            className="
              rounded-xl border-[rgba(56,56,54,0.14)] bg-white/70
              text-[rgb(56,56,54)] hover:bg-white
            "
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
        ) : (
          <div />
        )}

        <div className="ml-auto">
          {step !== 'confirm' ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="
                rounded-xl bg-[rgb(56,56,54)] text-white
                transition-all duration-300
                hover:scale-[1.02] hover:bg-[rgba(56,56,54,0.92)]
                active:scale-[0.98]
              "
            >
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitOrder}
              disabled={processing}
              size="lg"
              className="
                min-w-[220px] rounded-xl bg-[rgb(56,56,54)] text-white
                transition-all duration-300 hover:bg-[rgba(56,56,54,0.92)]
              "
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirigiendo...
                </>
              ) : (
                <>
                  Proceder al pago
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}