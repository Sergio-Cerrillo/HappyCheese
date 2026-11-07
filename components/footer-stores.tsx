'use client'

import Link from 'next/link'
import { MapPin, Phone } from 'lucide-react'
import { useStoreCatalog } from '@/hooks/use-store-catalog'

export function FooterStores() {
  const { stores, loading, error } = useStoreCatalog()

  if (loading) return <p className="min-h-40 text-sm text-white/60 md:col-span-2" role="status">Cargando tiendas…</p>
  if (!stores.length && error) return <Link href="/tiendas" className="text-sm text-white/70 hover:text-white md:col-span-2">Consultar nuestras tiendas</Link>

  return <>{stores.map(store => (
    <div key={store.id} className="space-y-4" aria-label={store.name}>
      <h3 className="font-arial text-xl font-semibold uppercase text-white">{store.name}</h3>
      <div className="space-y-3 text-white/70">
        <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />{store.address}</p>
        <a href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 transition-colors hover:text-white"><Phone className="h-5 w-5 shrink-0" aria-hidden="true" />{store.phone}</a>
        <p className="whitespace-pre-line text-sm">{store.hours}</p>
      </div>
    </div>
  ))}</>
}
