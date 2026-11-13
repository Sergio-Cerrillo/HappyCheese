import 'server-only'
import supabase from '@/lib/supabase-admin'
import { findOrderSession, syncCheckoutSession } from '@/lib/order-payments'
import type { Order } from '@/lib/types'

let refreshing: Promise<boolean> | undefined
let lastRefresh = 0

// La hora solo determina cuándo consultar Stripe, nunca cuándo liberar stock.
// También recupera sesiones creadas antes de un fallo al guardar su identificador.
export async function refreshExpiredFlavorReservations(): Promise<boolean> {
  if (refreshing) return refreshing
  if (Date.now() - lastRefresh < 15_000) return false
  refreshing = (async () => {
    const { data, error } = await supabase.from('flavorReservations').select('orderId')
      .eq('state', 'reserved').lt('expiresAt', new Date().toISOString()).order('expiresAt').limit(12)
    if (error) throw error
    const ids = [...new Set<string>((data || []).map(row => row.orderId))]
    await Promise.all(ids.map(async id => {
      try {
        const { data: order, error: readError } = await supabase.from('orders').select('*').eq('id', id).single()
        if (readError || !order) throw readError || new Error('Pedido no encontrado')
        const sessionId = await findOrderSession(order as Order)
        if (sessionId) await syncCheckoutSession(sessionId, id)
        else if (['pending', 'failed'].includes(order.paymentStatus)) {
          const { error: updateError } = await supabase.from('orders').update({
            paymentStatus: 'expired', status: 'cancelado', updatedAt: new Date().toISOString(),
          }).eq('id', id).eq('updatedAt', order.updatedAt).in('paymentStatus', ['pending', 'failed'])
          if (updateError) throw updateError
        }
      } catch (error) {
        // Mantener la reserva ante un fallo de Stripe evita venderla dos veces.
        console.error('Error reconciling flavor reservation:', id, error)
      }
    }))
    return ids.length > 0
  })()
  try { return await refreshing }
  finally { refreshing = undefined; lastRefresh = Date.now() }
}
