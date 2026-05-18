"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  ChefHat,
  Plus,
  Pencil,
  Trash2,
  Store as StoreIcon,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Home,
  LogOut,
  Loader2,
  MapPin,
  Phone,
  Clock
} from 'lucide-react'
import type { Store, Flavor, Order, PortionType } from '@/lib/types'
import { ImageUpload } from '@/components/ui/image-upload'
import { AvailabilityDisplay, AvailabilityEditor } from '@/components/admin/availability-manager'

const PORTION_LABELS: Record<PortionType, string> = {
  individual: 'Individual',
  doble: 'Doble',
  mediana: 'Mediana',
  grande: 'Grande'
}

export default function AdminPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [isAddFlavorOpen, setIsAddFlavorOpen] = useState(false)
  const [isEditFlavorOpen, setIsEditFlavorOpen] = useState(false)
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false)
  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false)

  // Form states
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [newFlavor, setNewFlavor] = useState<Partial<Flavor>>({
    name: '',
    description: '',
    prices: { individual: 0, doble: 0, mediana: 0, grande: 0 },
    image: '/images/clasica.jpg',
    active: true,
    availability: []
  })
  const [newStore, setNewStore] = useState<Partial<Store>>({
    name: '',
    address: '',
    phone: '',
    hours: '',
    coordinates: { lat: 0, lng: 0 },
    active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
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
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Logout
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Stores
  async function handleAddStore() {
    if (!newStore.name || !newStore.address || !newStore.phone || !newStore.hours) {
      toast.error('Por favor, completa todos los campos')
      return
    }

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore)
      })

      if (res.ok) {
        const store = await res.json()
        setStores(prev => [...prev, store])
        setIsAddStoreOpen(false)
        setNewStore({ name: '', address: '', phone: '', hours: '', coordinates: { lat: 0, lng: 0 }, active: true })
        toast.success('Tienda añadida correctamente')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al añadir tienda')
      }
    } catch (error) {
      console.error('Error adding store:', error)
      toast.error('Error de conexión')
    }
  }

  async function handleEditStore() {
    if (!editingStore) return

    try {
      const res = await fetch('/api/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStore)
      })

      if (res.ok) {
        const updated = await res.json()
        setStores(prev => prev.map(s => s.id === updated.id ? updated : s))
        setIsEditStoreOpen(false)
        setEditingStore(null)
        toast.success('Tienda actualizada')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar tienda')
      }
    } catch (error) {
      console.error('Error updating store:', error)
      toast.error('Error de conexión')
    }
  }

  async function handleDeleteStore(id: string) {
    if (!confirm('¿Seguro que deseas eliminar esta tienda?')) return

    try {
      const res = await fetch(`/api/stores?id=${id}`, { method: 'DELETE' })

      if (res.ok) {
        setStores(prev => prev.filter(s => s.id !== id))
        toast.success('Tienda eliminada')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al eliminar tienda')
      }
    } catch (error) {
      console.error('Error deleting store:', error)
      toast.error('Error de conexión')
    }
  }

  // Flavors
  async function handleAddFlavor() {
    if (!newFlavor.name || !newFlavor.description || !newFlavor.prices) {
      toast.error('Por favor, completa todos los campos')
      return
    }

    try {
      const res = await fetch('/api/flavors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlavor)
      })

      if (res.ok) {
        const flavor = await res.json()
        setFlavors(prev => [...prev, flavor])
        setIsAddFlavorOpen(false)
        setNewFlavor({
          name: '',
          description: '',
          prices: { individual: 0, doble: 0, mediana: 0, grande: 0 },
          image: '/images/clasica.jpg',
          active: true,
          availability: []
        })
        toast.success('Sabor añadido correctamente')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al añadir sabor')
      }
    } catch (error) {
      console.error('Error adding flavor:', error)
      toast.error('Error de conexión')
    }
  }

  async function handleEditFlavor() {
    if (!editingFlavor) return

    try {
      const res = await fetch('/api/flavors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFlavor)
      })

      if (res.ok) {
        const updated = await res.json()
        setFlavors(prev => prev.map(f => f.id === updated.id ? updated : f))
        setIsEditFlavorOpen(false)
        setEditingFlavor(null)
        toast.success('Sabor actualizado')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar sabor')
      }
    } catch (error) {
      console.error('Error updating flavor:', error)
      toast.error('Error de conexión')
    }
  }

  async function handleDeleteFlavor(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este sabor?')) return

    try {
      const res = await fetch(`/api/flavors?id=${id}`, { method: 'DELETE' })

      if (res.ok) {
        setFlavors(prev => prev.filter(f => f.id !== id))
        toast.success('Sabor eliminado')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al eliminar sabor')
      }
    } catch (error) {
      console.error('Error deleting flavor:', error)
      toast.error('Error de conexión')
    }
  }

  async function updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status })
      })

      if (res.ok) {
        const updated = await res.json()
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
        toast.success('Estado actualizado')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar estado')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Error de conexión')
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const todayOrders = orders.filter(o => {
    const today = new Date().toDateString()
    return new Date(o.createdAt).toDateString() === today
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="font-serif text-2xl font-bold">
              Happy<span className="text-primary">Cheese</span>
            </span>
            <Badge variant="secondary" className="ml-2">Admin</Badge>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Ver tienda
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestiona tiendas, sabores y pedidos de HappyCheese
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tiendas</p>
                  <p className="text-3xl font-bold">{stores.filter(s => s.active).length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <StoreIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sabores Activos</p>
                  <p className="text-3xl font-bold">{flavors.filter(f => f.active).length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <ChefHat className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pedidos</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos</p>
                  <p className="text-3xl font-bold">{totalRevenue.toFixed(0)}€</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="flavors">Sabores</TabsTrigger>
            <TabsTrigger value="stores">Tiendas</TabsTrigger>
          </TabsList>

          {/* PEDIDOS TAB */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Pedidos</CardTitle>
                <CardDescription>
                  Gestiona y revisa todos los pedidos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay pedidos todavía
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                      <Card key={order.id} className="overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono font-bold text-primary">{order.id}</span>
                                <Badge variant={
                                  order.status === 'completado' ? 'default' :
                                  order.status === 'confirmado' ? 'secondary' :
                                  order.status === 'cancelado' ? 'destructive' : 'outline'
                                }>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleString('es-ES')}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="text-2xl font-bold">{order.total.toFixed(2)}€</p>
                              <Select
                                value={order.status}
                                onValueChange={(value) => updateOrderStatus(order.id, value as Order['status'])}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pendiente">Pendiente</SelectItem>
                                  <SelectItem value="confirmado">Confirmado</SelectItem>
                                  <SelectItem value="completado">Completado</SelectItem>
                                  <SelectItem value="cancelado">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Cliente</h4>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Recogida</h4>
                              <p className="font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {order.storeName}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {new Date(order.pickupDate + 'T' + order.pickupTime).toLocaleString('es-ES')}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Productos</h4>
                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span>
                                    {item.quantity}x {item.flavorName} ({PORTION_LABELS[item.portion]})
                                  </span>
                                  <span className="font-medium">{(item.price * item.quantity).toFixed(2)}€</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {order.notes && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="font-semibold mb-1 text-sm text-muted-foreground">Notas</h4>
                              <p className="text-sm">{order.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SABORES TAB */}
          <TabsContent value="flavors">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestionar Sabores</CardTitle>
                  <CardDescription>
                    Añade, edita y configura la disponibilidad de sabores por tienda y porción
                  </CardDescription>
                </div>
                <Dialog open={isAddFlavorOpen} onOpenChange={setIsAddFlavorOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Añadir Sabor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Añadir nuevo sabor</DialogTitle>
                      <DialogDescription>
                        Crea un nuevo sabor con precios por porción y disponibilidad por tienda
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-name">Nombre del sabor*</Label>
                        <Input
                          id="new-name"
                          value={newFlavor.name}
                          onChange={e => setNewFlavor(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ej: Mango Tropical"
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Imagen del sabor</Label>
                        <ImageUpload
                          value={newFlavor.image}
                          onChange={(url) => setNewFlavor(prev => ({ ...prev, image: url }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-description">Descripción*</Label>
                        <Textarea
                          id="new-description"
                          value={newFlavor.description}
                          onChange={e => setNewFlavor(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe el sabor..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Precios por Porción (EUR)*</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {(['individual', 'doble', 'mediana', 'grande'] as PortionType[]).map(portion => (
                            <div key={portion} className="space-y-1.5">
                              <Label htmlFor={`new-price-${portion}`} className="text-sm font-medium">
                                {PORTION_LABELS[portion]}
                              </Label>
                              <div className="relative">
                                <Input
                                  id={`new-price-${portion}`}
                                  type="number"
                                  step="0.10"
                                  min="0"
                                  value={newFlavor.prices?.[portion] || 0}
                                  onChange={e => setNewFlavor(prev => ({
                                    ...prev,
                                    prices: { ...prev.prices!, [portion]: parseFloat(e.target.value) || 0 }
                                  }))}
                                  className="pl-7"
                                />
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Disponibilidad por Tienda</Label>
                        <p className="text-sm text-muted-foreground">
                          Selecciona en qué tiendas y qué tamaños estarán disponibles
                        </p>
                        <AvailabilityEditor
                          availability={newFlavor.availability || []}
                          stores={stores}
                          onChange={(availability) => setNewFlavor(prev => ({ ...prev, availability }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                        <div>
                          <Label htmlFor="new-active" className="text-base font-medium cursor-pointer">
                            Estado del sabor
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {newFlavor.active ? 'Visible en la tienda' : 'Oculto para clientes'}
                          </p>
                        </div>
                        <Switch
                          id="new-active"
                          checked={newFlavor.active}
                          onCheckedChange={checked => setNewFlavor(prev => ({ ...prev, active: checked }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddFlavorOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddFlavor}>
                        Añadir sabor
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {flavors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay sabores registrados
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {flavors.map(flavor => (
                      <Card key={flavor.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row gap-4 p-6">
                            {/* Imagen */}
                            <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden shrink-0 bg-accent">
                              <Image
                                src={flavor.image || "/images/clasica.jpg"}
                                alt={flavor.name}
                                fill
                                className="object-cover"
                              />
                              {!flavor.active && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <Badge variant="secondary" className="bg-white/90">Inactivo</Badge>
                                </div>
                              )}
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <h3 className="font-bold text-xl">{flavor.name}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {flavor.description}
                                  </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9"
                                    onClick={() => {
                                      setEditingFlavor(flavor)
                                      setIsEditFlavorOpen(true)
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => handleDeleteFlavor(flavor.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Precios */}
                              <div className="flex flex-wrap gap-2">
                                {(['individual', 'doble', 'mediana', 'grande'] as PortionType[]).map(portion => (
                                  <Badge key={portion} variant="secondary" className="px-3 py-1">
                                    <span className="text-muted-foreground mr-1.5">{PORTION_LABELS[portion]}:</span>
                                    <span className="font-bold">{flavor.prices[portion].toFixed(2)}€</span>
                                  </Badge>
                                ))}
                              </div>

                              {/* Disponibilidad */}
                              <div className="space-y-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Disponibilidad
                                </span>
                                <AvailabilityDisplay availability={flavor.availability} stores={stores} />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Flavor Dialog */}
            {editingFlavor && (
              <Dialog open={isEditFlavorOpen} onOpenChange={setIsEditFlavorOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar sabor</DialogTitle>
                    <DialogDescription>
                      Actualiza los detalles del sabor {editingFlavor.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nombre del sabor*</Label>
                      <Input
                        id="edit-name"
                        value={editingFlavor.name}
                        onChange={e => setEditingFlavor(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Ej: Mango Tropical"
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Imagen del sabor</Label>
                      <ImageUpload
                        value={editingFlavor.image}
                        onChange={(url) => setEditingFlavor(prev => prev ? { ...prev, image: url } : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Descripción*</Label>
                      <Textarea
                        id="edit-description"
                        value={editingFlavor.description}
                        onChange={e => setEditingFlavor(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Describe el sabor..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Precios por Porción (EUR)*</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['individual', 'doble', 'mediana', 'grande'] as PortionType[]).map(portion => (
                          <div key={portion} className="space-y-1.5">
                            <Label htmlFor={`edit-price-${portion}`} className="text-sm font-medium">
                              {PORTION_LABELS[portion]}
                            </Label>
                            <div className="relative">
                              <Input
                                id={`edit-price-${portion}`}
                                type="number"
                                step="0.10"
                                min="0"
                                value={editingFlavor.prices[portion]}
                                onChange={e => setEditingFlavor(prev => prev ? {
                                  ...prev,
                                  prices: { ...prev.prices, [portion]: parseFloat(e.target.value) || 0 }
                                } : null)}
                                className="pl-7"
                              />
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Disponibilidad por Tienda</Label>
                      <p className="text-sm text-muted-foreground">
                        Selecciona en qué tiendas y qué tamaños estarán disponibles
                      </p>
                      <AvailabilityEditor
                        availability={editingFlavor.availability}
                        stores={stores}
                        onChange={(availability) => setEditingFlavor(prev => prev ? { ...prev, availability } : null)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                      <div>
                        <Label htmlFor="edit-active" className="text-base font-medium cursor-pointer">
                          Estado del sabor
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {editingFlavor.active ? 'Visible en la tienda' : 'Oculto para clientes'}
                        </p>
                      </div>
                      <Switch
                        id="edit-active"
                        checked={editingFlavor.active}
                        onCheckedChange={checked => setEditingFlavor(prev => prev ? { ...prev, active: checked } : null)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditFlavorOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleEditFlavor}>
                      Guardar cambios
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* TIENDAS TAB */}
          <TabsContent value="stores">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestionar Tiendas</CardTitle>
                  <CardDescription>
                    Añade, edita y configura las tiendas físicas
                  </CardDescription>
                </div>
                <Dialog open={isAddStoreOpen} onOpenChange={setIsAddStoreOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Añadir Tienda
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir nueva tienda</DialogTitle>
                      <DialogDescription>
                        Crea un nuevo punto de venta
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="store-name">Nombre*</Label>
                        <Input
                          id="store-name"
                          value={newStore.name}
                          onChange={e => setNewStore(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ej: Santa Catalina"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-address">Dirección*</Label>
                        <Input
                          id="store-address"
                          value={newStore.address}
                          onChange={e => setNewStore(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Ej: Carrer de Sant Magí, 45"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-phone">Teléfono*</Label>
                        <Input
                          id="store-phone"
                          value={newStore.phone}
                          onChange={e => setNewStore(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+34 871 234 567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="store-hours">Horario*</Label>
                        <Input
                          id="store-hours"
                          value={newStore.hours}
                          onChange={e => setNewStore(prev => ({ ...prev, hours: e.target.value }))}
                          placeholder="Lun-Sáb: 10:00 - 20:00"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="store-active"
                          checked={newStore.active}
                          onCheckedChange={checked => setNewStore(prev => ({ ...prev, active: checked }))}
                        />
                        <Label htmlFor="store-active">Tienda activa</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddStoreOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddStore}>
                        Añadir tienda
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {stores.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay tiendas registradas
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stores.map(store => (
                      <Card key={store.id} className="overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-lg">{store.name}</h3>
                                {!store.active && <Badge variant="secondary">Inactiva</Badge>}
                              </div>
                              <div className="space-y-1 text-sm">
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {store.address}
                                </p>
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  {store.phone}
                                </p>
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {store.hours}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                  setEditingStore(store)
                                  setIsEditStoreOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleDeleteStore(store.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Store Dialog */}
            {editingStore && (
              <Dialog open={isEditStoreOpen} onOpenChange={setIsEditStoreOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar tienda</DialogTitle>
                    <DialogDescription>
                      Actualiza los detalles de {editingStore.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-store-name">Nombre*</Label>
                      <Input
                        id="edit-store-name"
                        value={editingStore.name}
                        onChange={e => setEditingStore(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-store-address">Dirección*</Label>
                      <Input
                        id="edit-store-address"
                        value={editingStore.address}
                        onChange={e => setEditingStore(prev => prev ? { ...prev, address: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-store-phone">Teléfono*</Label>
                      <Input
                        id="edit-store-phone"
                        value={editingStore.phone}
                        onChange={e => setEditingStore(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-store-hours">Horario*</Label>
                      <Input
                        id="edit-store-hours"
                        value={editingStore.hours}
                        onChange={e => setEditingStore(prev => prev ? { ...prev, hours: e.target.value } : null)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-store-active"
                        checked={editingStore.active}
                        onCheckedChange={checked => setEditingStore(prev => prev ? { ...prev, active: checked } : null)}
                      />
                      <Label htmlFor="edit-store-active">Tienda activa</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditStoreOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleEditStore}>
                      Guardar cambios
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
