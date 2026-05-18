import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Store, Flavor, Order } from '@/lib/types'

interface AdminData {
  stores: Store[]
  flavors: Flavor[]
  orders: Order[]
  loading: boolean
  refetch: () => Promise<void>
}

/**
 * Hook para gestionar la carga de datos del admin
 * Principio Single Responsibility: Solo se encarga de cargar y mantener los datos
 */
export function useAdminData(): AdminData {
  const [stores, setStores] = useState<Store[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [storesRes, flavorsRes, ordersRes] = await Promise.all([
        fetch('/api/stores'),
        fetch('/api/flavors'),
        fetch('/api/orders')
      ])

      if (storesRes.ok) setStores(await storesRes.json())
      if (flavorsRes.ok) setFlavors(await flavorsRes.json())
      if (ordersRes.ok) setOrders(await ordersRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar datos del panel')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    stores,
    flavors,
    orders,
    loading,
    refetch: loadData
  }
}
