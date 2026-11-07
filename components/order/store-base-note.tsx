import { Cookie } from 'lucide-react'

const crumble = {
  before: 'Elaboradas sobre nuestra base de ',
  highlight: 'crumble artesanal',
  after: ', de producción propia y textura crujiente',
}

const STORE_BASES: Record<string, { before: string; highlight: string; after: string }> = {
  happycheese: {
    before: 'Base de ',
    highlight: 'galleta María seleccionada',
    after: ' o base personalizada.',
  },
  'happycheese-lux': crumble,
  happycheese_lux: crumble,
}

export function StoreBaseNote({ storeId }: { storeId: string }) {
  const base = STORE_BASES[storeId]
  if (!base) return null

  return (
    <aside aria-label="La base de tu tarta" className="mt-3 flex items-start gap-3.5 rounded-[18px] border border-[#e2dbcd] bg-[linear-gradient(120deg,#f6f2e9_0%,#fbfaf6_100%)] px-4 py-4 md:gap-4 md:px-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dcd3c1] bg-white/60 text-[#8c7e63]">
        <Cookie className="h-[18px] w-[18px]" strokeWidth={1.25} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#8c7e63]">La base de tu tarta</p>
        <p className="text-xs leading-relaxed text-[#736c60] md:text-sm">
          {base.before}<strong className="font-medium text-[#383836]">{base.highlight}</strong>{base.after}
        </p>
      </div>
    </aside>
  )
}
