import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { Store, Flavor, Order } from '@/lib/types'

interface AdminData {
  stores: Store[]
  flavors: Flavor[]
  orders: Order[]
  loading: boolean
  ordersRefreshing: boolean
  ordersSyncError: string | null
  refreshOrders: () => Promise<void>
  refetch: () => Promise<void>
}

export function useAdminData(): AdminData {
  const [stores, setStores] = useState<Store[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersRefreshing, setOrdersRefreshing] = useState(false)
  const [ordersSyncError, setOrdersSyncError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const active = useRef(true)

  const refreshOrders = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setOrdersRefreshing(true)
    try {
      const response = await fetch('/api/orders', { cache: 'no-store' })
      if (!response.ok) throw new Error('No se han podido actualizar los pedidos. Se muestran los últimos datos disponibles.')
      const updated: Order[] = await response.json()
      if (!active.current) return
      setOrders(updated)
      setOrdersSyncError(Number(response.headers.get('X-Order-Sync-Errors')) > 0
        ? 'Algunos pagos no han podido verificarse con Stripe. Están señalados en su pedido.' : null)
    } catch (error) {
      if (active.current) setOrdersSyncError(error instanceof Error ? error.message : 'No se han podido actualizar los pedidos.')
    } finally {
      inFlight.current = false
      if (active.current) setOrdersRefreshing(false)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [storesRes, flavorsRes] = await Promise.all([
        fetch('/api/stores', { cache: 'no-store' }),
        fetch('/api/flavors', { cache: 'no-store' }),
        refreshOrders(),
      ])
      if (!active.current) return
      if (storesRes.ok) setStores(await storesRes.json())
      if (flavorsRes.ok) setFlavors(await flavorsRes.json())
    } catch (error) {
      console.error('Error loading admin data:', error)
      if (active.current) toast.error('Error al cargar datos del panel')
    } finally {
      if (active.current) setLoading(false)
    }
  }, [refreshOrders])

  useEffect(() => {
    active.current = true
    loadData()
    const onFocus = () => {
      if (document.visibilityState === 'visible') refreshOrders()
    }
    const interval = setInterval(onFocus, 30_000)
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      active.current = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadData, refreshOrders])

  return { stores, flavors, orders, loading, ordersRefreshing, ordersSyncError, refreshOrders, refetch: loadData }
}
