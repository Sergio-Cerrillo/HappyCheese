import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Nunca usar la clave pública para las escrituras del servidor: RLS puede
// responder sin error aunque no se haya actualizado ninguna fila.
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing server Supabase credentials (SUPABASE_SERVICE_ROLE_KEY)')
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'happycheese' }, auth: { persistSession: false, autoRefreshToken: false } },
)

export const db = supabaseAdmin.schema('happycheese')
export default supabaseAdmin
