import type { Order } from './types'

export const PAYMENT_LABELS = {
  pending: 'Pendiente de pago',
  paid: 'Pagado',
  failed: 'Pago fallido',
  expired: 'Pago caducado',
  refunded: 'Reembolsado',
  partially_refunded: 'Reembolso parcial',
}

export function getPaymentLabel(order: Order): string {
  return order.paymentStatus ? PAYMENT_LABELS[order.paymentStatus] || 'Pago sin verificar' : 'Pago sin verificar'
}

export function isPaidOrder(order: Order): boolean {
  return order.paymentStatus === 'paid' || order.paymentStatus === 'partially_refunded'
}

export function getOrderRevenue(order: Order): number {
  return isPaidOrder(order) ? Math.max(0, order.total - (order.refundedAmount || 0)) : 0
}

export function canConfirmOrder(order: Order): boolean {
  return order.paymentStatus === 'paid' || order.paymentStatus === 'partially_refunded'
}
