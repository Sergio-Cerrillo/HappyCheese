import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Vista previa del correo | Happycheese',
  robots: { index: false, follow: false },
}

export default async function EmailPreviewPage({ searchParams }: {
  searchParams: Promise<{ tienda?: string }>
}) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const { tienda } = await searchParams
  const lux = tienda === 'lux'
  const storeName = lux ? 'Happycheese Lux' : 'Happycheese Joan Alcover'

  return <main className="min-h-screen bg-[#f7f7f6] px-3 py-6 md:px-6">
    <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-black/10 bg-white p-5 md:p-6">
      <Link href="/pedido/vista-previa" className="text-xs text-muted-foreground underline underline-offset-4">Ver la confirmación de prueba</Link>
      <h1 className="mt-4 font-bebas text-3xl text-[#383836]">Correo de confirmación</h1>
      <p className="mt-2 text-sm text-muted-foreground">Vista previa del HTML que recibe el cliente, con datos ficticios. No se envía ningún email ni se realiza un cobro.</p>
      <nav aria-label="Tienda del correo de prueba" className="mt-5 flex flex-wrap gap-3">
        {[
          { id: 'joan', label: 'Joan Alcover', active: !lux },
          { id: 'lux', label: 'Lux', active: lux },
        ].map(store => <Link key={store.id} href={`/pedido/vista-previa-email?tienda=${store.id}`} aria-current={store.active ? 'page' : undefined} className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${store.active ? 'border-[#383836] bg-[#383836] text-white' : 'border-black/10 text-[#383836] hover:bg-black/5'}`}>
          {store.label}
        </Link>)}
      </nav>
      <a href={`/pedido/vista-previa-email/contenido?tienda=${lux ? 'lux' : 'joan'}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs text-muted-foreground underline underline-offset-4">Abrir solo el correo en una pestaña nueva</a>
    </div>
    <iframe
      key={lux ? 'lux' : 'joan'}
      title={`Correo de confirmación de ${storeName}`}
      src={`/pedido/vista-previa-email/contenido?tienda=${lux ? 'lux' : 'joan'}`}
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      className="mx-auto block h-[1900px] w-full max-w-3xl border-0 bg-[#f7f7f6]"
    />
  </main>
}
