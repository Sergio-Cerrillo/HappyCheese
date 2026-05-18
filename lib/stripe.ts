import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

/**
 * Formatea el precio para Stripe (convierte euros a centimos)
 * @param amount - Cantidad en euros (ej: 25.50)
 * @returns Cantidad en centimos (ej: 2550)
 */
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Formatea el precio desde Stripe (convierte centimos a euros)
 * @param amount - Cantidad en centimos (ej: 2550)
 * @returns Cantidad en euros (ej: 25.50)
 */
export function formatAmountFromStripe(amount: number): number {
  return amount / 100
}
