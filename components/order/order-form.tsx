"use client"

import { useState, useEffect, useRef } from 'react'
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
} from '@/components/ui/drawer'
import { toast } from 'sonner'
import {
  MapPin,
  ShoppingBag,
  User,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Loader2,
  Cookie,
} from 'lucide-react'
import type { Store, Flavor, OrderItem, PortionType } from '@/lib/types'
import {
  getPickupValidationMessage,
  isValidPickupDate,
} from '@/lib/date-utils'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getFlavorImageSrc } from '@/lib/image-utils'
import { getItemKey, getBaseDescription } from '@/lib/order-items'
import type { CustomBaseOption } from '@/lib/types'
import { OrderIntro } from './order-intro'
import { useFlavorCatalog } from '@/hooks/use-flavor-catalog'
import { sortFlavors } from '@/lib/flavor-catalog'
import { FlavorPickerContent } from './flavor-picker-content'
import { PickupScheduler } from './pickup-scheduler'
import { StoreBaseNote } from './store-base-note'

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
  const formTopRef = useRef<HTMLDivElement>(null)
  const navigationRef = useRef<HTMLDivElement>(null)
  const [navigationVisible, setNavigationVisible] = useState(false)
  const [step, setStep] = useState<Step>('store')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const [stores, setStores] = useState<Store[]>([])
  const { flavors, refreshFlavors } = useFlavorCatalog()
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

  useEffect(() => {
    if (step === 'flavors') {
      refreshFlavors().catch(() => toast.error('No se han podido actualizar los sabores. Inténtalo de nuevo.'))
    }
  }, [step, refreshFlavors])

  useEffect(() => {
    // Ejecutar el scroll cuando el nuevo paso ya está renderizado
    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }, [step])

  useEffect(() => {
    const navigation = navigationRef.current
    if (!navigation) return
    const observer = new IntersectionObserver(([entry]) => setNavigationVisible(entry.isIntersecting), { threshold: 0.5 })
    observer.observe(navigation)
    return () => observer.disconnect()
  }, [loading, step])

  async function loadData() {
    try {
      const [storesRes] = await Promise.all([
        fetch('/api/stores', { cache: 'no-store' }),
        refreshFlavors(),
      ])

      if (storesRes.ok) setStores(await storesRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const selectedStoreData = stores.find((s) => s.id === selectedStore)

  const availableFlavors = sortFlavors(flavors.filter((f) => {
    const availability = f.availability.find((a) => a.storeId === selectedStore)
    return f.active && availability && availability.portions.length > 0
  }), selectedStore)

  const addToCart = (flavor: Flavor, portion: PortionType, base?: CustomBaseOption) => {
    const price = Math.round((getFlavorPrice(flavor, portion, selectedStore) + (base?.surcharge || 0)) * 100) / 100
    const customBase = base ? { id: base.id, name: base.name, surcharge: base.surcharge } : undefined
    const key = getItemKey({ flavorId: flavor.id, portion, customBase })
    setCart(previous => {
      const existing = previous.find(item => getItemKey(item) === key)
      if (existing) return previous.map(item => getItemKey(item) === key ? { ...item, quantity: item.quantity + 1 } : item)
      return [...previous, { flavorId: flavor.id, flavorName: flavor.name, portion, quantity: 1, price, ...(customBase ? { customBase } : {}) }]
    })
    toast.success(`${flavor.name} (${PORTION_LABELS[portion]}) añadida al pedido`)
  }

  const updateQuantity = (flavorId: string, portion: PortionType, delta: number, customBase?: OrderItem['customBase']) => {
    const key = getItemKey({ flavorId, portion, customBase })
    setCart(previous => previous.map(item => getItemKey(item) === key ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0))
  }

  const removeFromCart = (target: OrderItem) => {
    setCart(previous => previous.filter(item => getItemKey(item) !== getItemKey(target)))
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
          customerInfo.pickupTime &&
          isValidPickupDate(
            customerInfo.pickupDate,
            customerInfo.pickupTime,
            selectedStoreData
          )
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
      if (!customerInfo.pickupDate || !customerInfo.pickupTime) {
        toast.error('Selecciona fecha y hora de recogida')
        return
      }
      if (!isValidPickupDate(customerInfo.pickupDate, customerInfo.pickupTime, selectedStoreData)) {
        toast.error(
          getPickupValidationMessage(
            customerInfo.pickupDate,
            customerInfo.pickupTime,
            selectedStoreData
          )
        )
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
    if (!customerInfo.pickupDate || !customerInfo.pickupTime) {
      toast.error('Selecciona fecha y hora de recogida')
      return
    }
    if (!isValidPickupDate(customerInfo.pickupDate, customerInfo.pickupTime, selectedStoreData)) {
      toast.error(
        getPickupValidationMessage(
          customerInfo.pickupDate,
          customerInfo.pickupTime,
          selectedStoreData
        )
      )
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

  if (loading) {
    return (
      <div className={`${shellCardClass} flex items-center justify-center py-16`}>
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(56,56,54)]" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', cart.length > 0 && step !== 'store' && 'pb-28')}>
      {step === 'store' && <OrderIntro />}
      <div ref={formTopRef} />
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
                onValueChange={storeId => {
                  if (storeId === selectedStore) return
                  setSelectedStore(storeId)
                  setCart([])
                  setCustomerInfo(previous => ({ ...previous, pickupDate: '', pickupTime: '' }))
                  if (cart.length) toast.info('Al cambiar de tienda, elige de nuevo tus tartas disponibles')
                }}
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
                <p className="mt-1 text-xs leading-relaxed text-[rgba(56,56,54,0.65)] md:text-sm">
                  Disponibles en {selectedStoreData?.name}
                </p>
                <StoreBaseNote storeId={selectedStore} />
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
                          aria-haspopup="dialog"
                          onClick={() => {
                            setSelectedFlavor(flavor)
                            setIsDrawerOpen(true)
                          }}
                          className={cn(
                            'group relative aspect-square min-w-0 cursor-pointer overflow-hidden rounded-2xl border bg-[#eeebe4] transition-colors duration-300 hover:border-[#b8ae9b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#383836]/30 focus-visible:ring-offset-2',
                            cartCount > 0 ? 'border-[#383836]' : 'border-transparent'
                          )}
                        >
                          <Image
                            src={getFlavorImageSrc(flavor, 'thumb')}
                            alt={flavor.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transform-none"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                            <h3 className="break-words text-balance text-sm font-medium text-white sm:text-base">{flavor.name}</h3>
                          </div>
                          {cartCount > 0 && <span aria-label={`${cartCount} en tu pedido`} className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full border border-white/80 bg-[#383836] px-1.5 text-xs font-semibold text-white shadow-sm">{cartCount}</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Drawer for portion selection */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerContent className="max-h-[90dvh] rounded-t-[28px] bg-[#f8f7f4] data-[vaul-drawer-direction=bottom]:max-h-[90dvh] data-[vaul-drawer-direction=bottom]:rounded-t-[28px]">
                {selectedFlavor && <FlavorPickerContent
                  key={`${selectedStore}:${selectedFlavor.id}`}
                  flavor={selectedFlavor}
                  storeId={selectedStore}
                  cart={cart}
                  total={total}
                  onAdd={(portion, base) => addToCart(selectedFlavor, portion, base)}
                  onQuantity={(portion, delta, base) => updateQuantity(selectedFlavor.id, portion, delta, base)}
                  onContinue={() => { setIsDrawerOpen(false); nextStep() }}
                />}
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
                        key={getItemKey(item)}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[rgb(56,56,54)]">
                            {item.flavorName}
                          </p>
                          <p className="text-xs text-[rgba(56,56,54,0.48)]">
                            {PORTION_LABELS[item.portion]} × {item.quantity}
                          </p>
                          {item.customBase && <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg border border-[#e5e1d8] bg-[#f5f3ed] px-2 py-1.5 text-[10px] leading-relaxed text-[#797166]"><Cookie className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />{getBaseDescription(item)}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[rgb(56,56,54)]">
                            {(item.price * item.quantity).toFixed(2)}€
                          </span>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full"
                            aria-label={`Eliminar ${item.flavorName}${item.customBase ? ` con base ${item.customBase.name}` : ''}`}
                            onClick={() =>
                              removeFromCart(item)
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

            <PickupScheduler
              store={selectedStoreData}
              date={customerInfo.pickupDate}
              time={customerInfo.pickupTime}
              onChange={(pickupDate, pickupTime) => setCustomerInfo(previous => ({ ...previous, pickupDate, pickupTime }))}
            />

            <div className="space-y-2">
              <Label htmlFor="notes">Alergias e información relevante(opcional)</Label>
              <Textarea
                id="notes"
                value={customerInfo.notes}
                onChange={(e) =>
                  setCustomerInfo((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Indica únicamente alergias u otras cuestiones importantes relacionadas con tu pedido."
                rows={6}
                className="min-h-36 rounded-xl border-[rgba(56,56,54,0.1)] bg-white/75"
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
                    key={getItemKey(item)}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="text-[rgba(56,56,54,0.72)]">
                      {item.quantity}x {item.flavorName} ({PORTION_LABELS[item.portion]})
                      {item.customBase && <span className="mt-1 block text-xs">{getBaseDescription(item)}</span>}
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
      <div ref={navigationRef} className="flex justify-between gap-4">
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
      {cart.length > 0 && step !== 'store' && !isDrawerOpen && <div className={cn('fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 md:px-6', navigationVisible && 'md:hidden')}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/95 px-4 py-3 text-foreground shadow-[0_-6px_35px_rgba(0,0,0,0.14)] backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-3" role="status" aria-live="polite">
            <ShoppingBag className="h-5 w-5 shrink-0" />
            <div><p className="text-xs text-muted-foreground">{cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'producto' : 'productos'}</p><p className="font-semibold tabular-nums">{total.toFixed(2)} €</p></div>
          </div>
          <Button onClick={step === 'confirm' ? handleSubmitOrder : nextStep} disabled={processing || !canProceed()} className="min-h-11 rounded-xl bg-[rgb(56,56,54)] px-5 text-white hover:bg-[rgba(56,56,54,0.88)]">
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 'confirm' ? 'Proceder al pago' : 'Continuar'}<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>}
    </div>
  )
}
