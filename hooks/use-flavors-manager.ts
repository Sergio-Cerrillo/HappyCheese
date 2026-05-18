import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Flavor } from '@/lib/types'

interface FlavorsManager {
  flavors: Flavor[]
  setFlavors: React.Dispatch<React.SetStateAction<Flavor[]>>
  addFlavor: (flavor: Partial<Flavor>) => Promise<boolean>
  updateFlavor: (flavor: Flavor) => Promise<boolean>
  deleteFlavor: (id: string) => Promise<boolean>
}

/**
 * Hook para gestionar operaciones CRUD de sabores
 * Principio Single Responsibility: Solo gestiona sabores
 */
export function useFlavorsManager(initialFlavors: Flavor[] = []): FlavorsManager {
  const [flavors, setFlavors] = useState<Flavor[]>(initialFlavors)

  const addFlavor = useCallback(async (flavor: Partial<Flavor>): Promise<boolean> => {
    if (!flavor.name || !flavor.description || !flavor.prices) {
      toast.error('Por favor, completa todos los campos obligatorios')
      return false
    }

    try {
      const res = await fetch('/api/flavors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flavor)
      })

      if (res.ok) {
        const newFlavor = await res.json()
        setFlavors(prev => [...prev, newFlavor])
        toast.success('Sabor añadido correctamente')
        return true
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al añadir sabor')
        return false
      }
    } catch (error) {
      console.error('Error adding flavor:', error)
      toast.error('Error de conexión')
      return false
    }
  }, [])

  const updateFlavor = useCallback(async (flavor: Flavor): Promise<boolean> => {
    try {
      const res = await fetch('/api/flavors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flavor)
      })

      if (res.ok) {
        const updated = await res.json()
        setFlavors(prev => prev.map(f => f.id === updated.id ? updated : f))
        toast.success('Sabor actualizado')
        return true
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar sabor')
        return false
      }
    } catch (error) {
      console.error('Error updating flavor:', error)
      toast.error('Error de conexión')
      return false
    }
  }, [])

  const deleteFlavor = useCallback(async (id: string): Promise<boolean> => {
    if (!confirm('¿Seguro que deseas eliminar este sabor?')) return false

    try {
      const res = await fetch(`/api/flavors?id=${id}`, { method: 'DELETE' })

      if (res.ok) {
        setFlavors(prev => prev.filter(f => f.id !== id))
        toast.success('Sabor eliminado')
        return true
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al eliminar sabor')
        return false
      }
    } catch (error) {
      console.error('Error deleting flavor:', error)
      toast.error('Error de conexión')
      return false
    }
  }, [])

  return {
    flavors,
    setFlavors,
    addFlavor,
    updateFlavor,
    deleteFlavor
  }
}
