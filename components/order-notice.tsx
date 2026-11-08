import { Clock3 } from 'lucide-react'

export function OrderNotice() {
  return (
    <section aria-label="Tartas por encargo" className="order-notice relative flex min-h-28 items-center overflow-hidden border-y border-white/10 bg-[#383836] text-[#f6f2e9] md:min-h-32">
      <p className="sr-only">De nuestro obrador a tu paladar. Haz tu pedido con al menos 36 h de antelación.</p>

      <div className="order-notice-window min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]" aria-hidden="true">
        <div className="order-notice-track flex w-max">
          {[0, 1].map(group => (
            <div key={group} className="flex shrink-0">
              {[0, 1].map(copy => (
                <div key={copy} className="flex shrink-0 items-center gap-8 px-6 md:gap-12 md:px-10">
                  <span className="font-serif text-[26px] font-normal italic tracking-[-0.02em] md:text-[34px]">Lo bueno lleva su tiempo.</span>
                  <span className="h-px w-8 bg-[#f6f2e9]/25 md:w-12" />
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#f6f2e9]/70 md:text-xs">De nuestro obrador a tu paladar</span>
                  <span className="h-px w-8 bg-[#f6f2e9]/25 md:w-12" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="order-notice-static min-w-0 flex-1 px-5 py-5 text-center">
        <p className="font-serif text-xl italic md:text-3xl">De nuestro obrador a tu paladar.</p>
      </div>

      <div aria-hidden="true" className="shrink-0 border-l border-[#f6f2e9]/15 px-4 text-center md:px-9">
        <p className="font-bebas text-[44px] leading-none tracking-[0.02em] md:text-[56px]">36 <span className="text-[28px] md:text-[34px]">h</span></p>
        <p className="mt-1.5 text-[8px] uppercase tracking-[0.15em] text-[#f6f2e9]/65 md:text-[9px] md:tracking-[0.2em]">Antelación mínima</p>
      </div>
    </section>
  )
}

export function PickupNotice() {
  return (
    <aside aria-label="Antelación del pedido" className="rounded-[24px] border border-[#e5dfd3] bg-[#f4f0e7] px-5 py-5 text-center text-[#383836] md:px-8 md:py-6">
      <div className="flex items-center justify-center gap-3 text-[#797166]">
        <span className="h-px w-6 bg-[#b9af9b]/50 md:w-10" aria-hidden="true" />
        <Clock3 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-[9px] uppercase tracking-[0.18em] md:text-[10px]">Preparación por encargo</p>
        <span className="h-px w-6 bg-[#b9af9b]/50 md:w-10" aria-hidden="true" />
      </div>
      <p className="mx-auto mt-3 max-w-[29rem] text-sm leading-relaxed text-[#625c52] md:text-base">
        Selecciona tu recogida con <strong className="font-medium text-[#383836]">al menos 36 h de antelación.</strong>
      </p>
    </aside>
  )
}
