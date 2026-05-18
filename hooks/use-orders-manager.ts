import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Order } from '@/lib/types'

interface OrdersManager {
  orders: Order[]
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  updateOrderStatus: (id: string, status: Order['status']) => Promise<boolean>
}

/**
 * Hook para gestionar operaciones de pedidos
 * Principio Single Responsibility: Solo gestiona pedidos
 */
export function useOrdersManager(initialOrders: Order[] = []): OrdersManager {
  const [orders, setOrders] = useState<Order[]>(initialOrders)

  const updateOrderStatus = useCallback(async (id: string, status: Order['status']): Promise<boolean> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (res.ok) {
        const updated = await res.json()
        setOrders(prev => prev.map(o => o.id === id ? updated : o))
        toast.success(`Estado actualizado a: ${status}`)
        return true
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar estado')
        return false
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Error de conexión')
      return false
    }
  }, [])

  return {
    orders,
    setOrders,
    updateOrderStatus
  }
}
