import { db } from './supabase'
import type { Store, Flavor, Order, Admin, Session } from './types'

// Stores
export async function getStores(): Promise<Store[]> {
  const { data, error } = await db
    .from('stores')
    .select('*')
    .order('createdAt', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function getStoreById(id: string): Promise<Store | undefined> {
  const { data, error } = await db
    .from('stores')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return undefined
  return data
}

export async function createStore(store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store> {
  const newStore = {
    ...store,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const { data, error } = await db
    .from('stores')
    .insert([newStore])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateStore(id: string, updates: Partial<Store>): Promise<Store | null> {
  const { data, error } = await db
    .from('stores')
    .update({
      ...updates,
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) return null
  return data
}

export async function deleteStore(id: string): Promise<boolean> {
  const { error } = await db
    .from('stores')
    .delete()
    .eq('id', id)
  
  return !error
}

// Flavors
export async function getFlavors(): Promise<Flavor[]> {
  const { data, error } = await db
    .from('flavors')
    .select('*')
    .order('createdAt', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function getFlavorById(id: string): Promise<Flavor | undefined> {
  const { data, error } = await db
    .from('flavors')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return undefined
  return data
}

export async function createFlavor(flavor: Omit<Flavor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flavor> {
  const newFlavor = {
    ...flavor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const { data, error } = await db
    .from('flavors')
    .insert([newFlavor])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateFlavor(id: string, updates: Partial<Flavor>): Promise<Flavor | null> {
  const { data, error } = await db
    .from('flavors')
    .update({
      ...updates,
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) return null
  return data
}

export async function deleteFlavor(id: string): Promise<boolean> {
  const { error } = await db
    .from('flavors')
    .delete()
    .eq('id', id)
  
  return !error
}

// Orders
export async function getOrders(): Promise<Order[]> {
  const { data, error } = await db
    .from('orders')
    .select('*')
    .order('createdAt', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const { data, error } = await db
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return undefined
  return data
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const newOrder = {
    ...order,
    id: `HC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const { data, error } = await db
    .from('orders')
    .insert([newOrder])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const { data, error } = await db
    .from('orders')
    .update({
      ...updates,
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) return null
  return data
}

// Admins
export async function getAdmins(): Promise<Admin[]> {
  const { data, error } = await db
    .from('admins')
    .select('*')
    .order('createdAt', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function getAdminByUsername(username: string): Promise<Admin | undefined> {
  const { data, error } = await db
    .from('admins')
    .select('*')
    .eq('username', username)
    .single()
  
  if (error) return undefined
  return data
}

// Sessions
export async function getSessions(): Promise<Session[]> {
  const { data, error } = await db
    .from('sessions')
    .select('*')
    .order('expiresAt', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function createSession(adminId: string): Promise<Session> {
  const session = {
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    adminId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
  }
  
  const { data, error } = await db
    .from('sessions')
    .insert([session])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getSessionById(id: string): Promise<Session | undefined> {
  const { data, error } = await db
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return undefined
  
  // Verificar si la sesión ha expirado
  if (new Date(data.expiresAt) < new Date()) {
    await deleteSession(id)
    return undefined
  }
  
  return data
}

export async function deleteSession(id: string): Promise<boolean> {
  const { error } = await db
    .from('sessions')
    .delete()
    .eq('id', id)
  
  return !error
}

export async function cleanExpiredSessions(): Promise<void> {
  const now = new Date().toISOString()
  
  await db
    .from('sessions')
    .delete()
    .lt('expiresAt', now)
}
