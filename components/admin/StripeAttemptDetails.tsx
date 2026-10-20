'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, RefreshCw } from 'lucide-react'
import type { StripeAttemptDetails as Attempt } from '@/lib/types'

const SESSION_LABELS: Record<string, string> = {
  open: 'Abierta', complete: 'Completada', expired: 'Caducada',
}
const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Pagado', unpaid: 'Sin pago confirmado', no_payment_required: 'No requiere pago',
}
const INTENT_LABELS: Record<string, string> = {
  canceled: 'Cancelado', processing: 'En proceso', succeeded: 'Pagado',
  requires_payment_method: 'Requiere un método de pago', requires_confirmation: 'Pendiente de confirmar',
  requires_action: 'Requiere una acción del cliente', requires_capture: 'Autorizado, pendiente de cobro',
}

export function StripeAttemptDetails({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const panelId = `stripe-attempt-${orderId}`

  async function consult() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/stripe`, { cache: 'no-store' })
      if (!response.ok) throw new Error('No se ha podido consultar Stripe. Vuelve a intentarlo.')
      const data: Attempt = await response.json()
      setAttempt(data)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se ha podido consultar Stripe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => { setOpen(!open); if (!open && !loading) consult() }}
        className="flex w-full items-center justify-between gap-2 rounded-sm text-left text-xs font-medium text-[#625c52] hover:text-[#383836] focus-visible:outline-offset-4"
      >
        Detalles del intento
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} className="mt-3 min-w-0 space-y-3 text-xs leading-relaxed text-[#716c63]" aria-busy={loading}>
          {loading && <p className="flex items-center gap-2" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Consultando Stripe…</p>}
          {error && <p className="text-amber-800" role="alert">{error}</p>}
          {!loading && !error && attempt && (
            <>
              <p>{attempt.summary}</p>
              {attempt.found && (
                <>
                  <dl className="space-y-2">
                    <div><dt className="text-[#797166]">Sesión de pago</dt><dd className="font-medium text-[#383836]">{SESSION_LABELS[attempt.sessionStatus || ''] || attempt.sessionStatus || 'Sin estado disponible'}</dd></div>
                    <div><dt className="text-[#797166]">Pago en Stripe</dt><dd className="font-medium text-[#383836]">{PAYMENT_LABELS[attempt.paymentStatus || ''] || 'Sin estado disponible'}</dd></div>
                    {attempt.paymentIntentStatus && <div><dt className="text-[#797166]">Intento de cobro</dt><dd className="font-medium text-[#383836]">{INTENT_LABELS[attempt.paymentIntentStatus] || attempt.paymentIntentStatus}</dd></div>}
                    {!!attempt.refundedAmount && <div><dt className="text-[#797166]">Importe reembolsado</dt><dd className="font-medium text-[#383836]">{attempt.refundedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</dd></div>}
                  </dl>
                  {attempt.lastPaymentError ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900">
                      <p className="font-medium">Último error registrado</p>
                      {attempt.lastPaymentError.message && <p className="mt-1 break-words">{attempt.lastPaymentError.message}</p>}
                      {attempt.lastPaymentError.code && <p className="mt-1 break-all font-mono">{attempt.lastPaymentError.code}</p>}
                      {attempt.lastPaymentError.declineCode && <p className="mt-1 break-all">Motivo: {attempt.lastPaymentError.declineCode}</p>}
                    </div>
                  ) : <p>No se devuelve un motivo de error. Un abandono o una caducidad no equivalen a un rechazo bancario.</p>}
                  <details className="border-t border-[#e7e3dc] pt-2">
                    <summary className="cursor-pointer font-medium">Referencias de Stripe</summary>
                    <p className="mt-2 break-all font-mono text-[10px]">{attempt.sessionId}</p>
                    {attempt.paymentIntentId && <p className="mt-1 break-all font-mono text-[10px]">{attempt.paymentIntentId}</p>}
                  </details>
                </>
              )}
              <p className="text-[10px] text-[#797166]">Consultado: {new Date(attempt.checkedAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
            </>
          )}
          {!loading && <button type="button" onClick={consult} className="inline-flex items-center gap-1.5 rounded-sm font-medium hover:text-[#383836] focus-visible:outline-offset-4"><RefreshCw className="h-3 w-3" aria-hidden="true" /> Volver a consultar</button>}
        </div>
      )}
    </div>
  )
}
