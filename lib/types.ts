export type PortionType = 'individual' | 'doble' | 'mediana' | 'grande'

export interface PortionPrice {
  individual: number
  doble: number
  mediana: number
  grande: number
}

export interface Store {
  id: string
  name: string
  address: string
  phone: string
  hours: string
  coordinates: { lat: number; lng: number }
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface FlavorAvailability {
  storeId: string
  portions: PortionType[]
  prices?: PortionPrice // Precios específicos para esta tienda (opcional, si no está usa prices global)
}

export interface Flavor {
  id: string
  name: string
  description: string
  prices: PortionPrice // Precios por defecto (se usan si no hay precios específicos en availability)
  image: string
  active: boolean
  availability: FlavorAvailability[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  flavorId: string
  flavorName: string
  portion: PortionType
  quantity: number
  price: number
}

export interface Order {
  id: string
  items: OrderItem[]
  storeId: string
  storeName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes?: string
  total: number
  status: 'pendiente' | 'confirmado' | 'completado' | 'cancelado'
  pickupDate: string
  pickupTime: string
  createdAt: string
  updatedAt: string
  // Campos de pago con Stripe
  stripeSessionId?: string
  stripePaymentIntentId?: string
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  paidAt?: string
}

export interface Admin {
  id: string
  username: string
  passwordHash: string
  createdAt: string
}

export interface Session {
  id: string
  adminId: string
  expiresAt: string
}
