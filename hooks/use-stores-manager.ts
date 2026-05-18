import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Store } from '@/lib/types'

interface StoresManager {
  stores: Store[]
  setStores: React.Dispatch<React.SetStateAction<Store[]>>
  addStore: (store: Partial<Store>) => Promise<boolean>
  updateStore: (store: Store) => Promise<boolean>
  deleteStore: (id: string) => Promise<boolean>
}

/**
 * Hook para gestionar operaciones CRUD de tiendas
 * Principio Single Responsibility: Solo gestiona tiendas
 */
export function useStoresManager(initialStores: Store[] = []): StoresManager {
  const [stores, setStores] = useState<Store[]>(initialStores)

  const addStore = useCallback(async (store: Partial<Store>): Promise<boolean> => {
    if (!store.name || !store.address || !store.phone || !store.hours) {
      toast.error('Por favor, completa todos los campos')
      return false
    }

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store)
      })

      if (res.ok) {
        const newStore = await res.json()
        setStores(prev => [...prev, newStore])
        toast.success('Tienda añadida correctamente')
        return true
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al añadir tienda')
        return false
      }
    } catch (error) {
      console.error('Error adding store:', error)
      toast.error('Error de conexión')
      return false
    }
  }, [])

  const updateStore = useCallback(async (store: Store): Promise<boolean> => {
    try {
      const res = await fetch('/api/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store)
      })

      if (res.ok) {
        const updated = await res.json()
        setStores(prev => prev.map(s => s.id === updated.id ? updated : s))
        toast.success('Tienda actualizada')
        return true
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar tienda')
        return false
      }
    } catch (error) {
      console.error('Error updating store:', error)
      toast.error('Error de conexión')
      return false
    }
  }, [])

  const deleteStore = useCallback(async (id: string): Promise<boolean> => {
    if (!confirm('¿Seguro que deseas eliminar esta tienda?')) return false

    try {
      const res = await fetch(`/api/stores?id=${id}`, { method: 'DELETE' })

      if (res.ok) {
        setStores(prev => prev.filter(s => s.id !== id))
        toast.success('Tienda eliminada')
        return true
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al eliminar tienda')
        return false
      }
    } catch (error) {
      console.error('Error deleting store:', error)
      toast.error('Error de conexión')
      return false
    }
  }, [])

  return {
    stores,
    setStores,
    addStore,
    updateStore,
    deleteStore
  }
}