import { z } from 'zod'

const baseSurchargeSchema = z.number().finite().min(0).max(1000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, 'Usa como máximo dos decimales')
const basePortionSchema = z.object({ enabled: z.boolean(), surcharge: baseSurchargeSchema }).strict()

export const customBasesSchema = z.array(z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  surcharge: baseSurchargeSchema.default(0),
  storeIds: z.array(z.string().min(1)).min(1),
  portionSettings: z.object({
    individual: basePortionSchema.optional(),
    doble: basePortionSchema.optional(),
    mediana: basePortionSchema.optional(),
    grande: basePortionSchema.optional(),
  }).strict().optional(),
})).max(20).refine(bases => new Set(bases.map(base => base.id)).size === bases.length, 'Las bases deben tener identificadores distintos')

export function isGoogleReviewUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && (
      ['g.page', 'maps.app.goo.gl', 'search.google.com', 'maps.google.com', 'www.google.com', 'google.com', 'www.google.es', 'google.es'].includes(url.hostname)
    )
  } catch { return false }
}
