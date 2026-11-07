import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, GripVertical, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getFlavorImageSrc } from '@/lib/image-utils'
import { cn } from '@/lib/utils'
import type { Flavor } from '@/lib/types'

type DragPosition = { id: string; pointerId: number; x: number; y: number }

export function FlavorOrderEditor({ flavors, storeName, onSave, onCancel }: {
  flavors: Flavor[]
  storeName: string
  onSave: (ids: string[]) => Promise<boolean>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(flavors)
  const [saving, setSaving] = useState(false)
  const [drag, setDrag] = useState<DragPosition | null>(null)
  const active = useRef<DragPosition | null>(null)
  const grid = useRef<HTMLOListElement>(null)
  const scrollFrame = useRef<number | null>(null)
  const instructionsId = useId()
  const draggedFlavor = drag ? draft.find(flavor => flavor.id === drag.id) : undefined

  useEffect(() => () => {
    active.current = null
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current)
  }, [])

  function move(id: string, target: string | number) {
    setDraft(previous => {
      const from = previous.findIndex(flavor => flavor.id === id)
      const to = typeof target === 'number' ? target : previous.findIndex(flavor => flavor.id === target)
      if (from < 0 || to < 0 || to >= previous.length || from === to) return previous
      const next = [...previous]
      next.splice(to, 0, next.splice(from, 1)[0])
      return next
    })
  }

  function reorderAtPointer() {
    const current = active.current
    if (!current || !grid.current) return
    const target = document.elementFromPoint(current.x, current.y)?.closest<HTMLElement>('[data-order-id]')
    if (target && grid.current.contains(target) && target.dataset.orderPosition !== undefined) {
      // Use the visible slot, not the flavor ID: multiple pointer/scroll events
      // before React commits must not move the same card back again.
      move(current.id, Number(target.dataset.orderPosition))
    }
  }

  function scrollWhileDragging() {
    const current = active.current
    const bounds = grid.current?.getBoundingClientRect()
    if (!current || !bounds) return
    if (current.x >= bounds.left - 32 && current.x <= bounds.right + 32) {
      const headerBottom = document.querySelector('main > header')?.getBoundingClientRect().bottom || 0
      const topEdge = Math.min(window.innerHeight / 2, Math.max(80, headerBottom + 48))
      const bottomEdge = window.innerHeight - 96
      const speed = current.y < topEdge
        ? -Math.min(14, (topEdge - current.y) / 5)
        : current.y > bottomEdge ? Math.min(14, (current.y - bottomEdge) / 5) : 0
      if (speed) window.scrollBy(0, speed)
      reorderAtPointer()
    }
    scrollFrame.current = requestAnimationFrame(scrollWhileDragging)
  }

  function finishDrag() {
    const pointerId = active.current?.pointerId
    active.current = null
    setDrag(null)
    if (scrollFrame.current !== null) {
      cancelAnimationFrame(scrollFrame.current)
      scrollFrame.current = null
    }
    if (pointerId !== undefined && grid.current?.hasPointerCapture(pointerId)) grid.current.releasePointerCapture(pointerId)
  }

  return (
    <section aria-label={`Editar orden en ${storeName}`} className="space-y-5 rounded-[28px] border border-[#e5e1d8] bg-white/70 p-4 shadow-[0_8px_30px_rgba(56,56,54,0.04)] backdrop-blur-xl sm:p-6">
      <div className="text-center sm:text-left">
        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#938b7c]">{storeName}</p>
        <h3 className="font-bebas text-3xl font-normal text-[#383836]">Orden visual de sabores</h3>
        <p id={instructionsId} className="mt-2 max-w-2xl text-xs leading-relaxed text-[#797166] sm:text-sm">Arrastra desde el asa de cada tarjeta o usa las flechas. Así se mostrarán los sabores al hacer pedidos en esta tienda.</p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#938b7c]">Guarda o cancela antes de cambiar de tienda. Las demás tiendas conservan su propio orden.</p>
      </div>

      <ol ref={grid} aria-label={`Orden de sabores en ${storeName}`} className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" onPointerMove={event => {
        if (!active.current || active.current.pointerId !== event.pointerId) return
        const next = { ...active.current, x: event.clientX, y: event.clientY }
        active.current = next
        setDrag(next)
        reorderAtPointer()
      }} onPointerUp={event => { if (active.current?.pointerId === event.pointerId) finishDrag() }} onPointerCancel={event => { if (active.current?.pointerId === event.pointerId) finishDrag() }} onLostPointerCapture={event => { if (event.target === event.currentTarget && active.current?.pointerId === event.pointerId) finishDrag() }} onKeyDown={event => {
        if (event.key === 'Escape' && active.current) { event.preventDefault(); finishDrag() }
      }}>
        {draft.map((flavor, index) => (
          <li data-order-id={flavor.id} data-order-position={index} key={flavor.id} className={cn(
            'min-w-0 overflow-hidden rounded-[20px] border bg-white transition-[border-color,opacity,box-shadow] duration-150',
            drag?.id === flavor.id ? 'border-[#383836] opacity-35 ring-2 ring-[#383836]/15' : 'border-[#e5e1d8] shadow-[0_3px_14px_rgba(56,56,54,0.035)]'
          )}>
            <div className="relative aspect-[4/3] overflow-hidden bg-[#eeebe4]">
              <Image src={getFlavorImageSrc(flavor, 'thumb')} alt={flavor.name} fill draggable={false} sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 280px" className={cn('pointer-events-none select-none object-cover', !flavor.active && 'opacity-65')} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
              <span aria-label={`Posición ${index + 1}`} className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[11px] font-semibold text-[#383836] shadow-sm sm:h-8 sm:w-8">{index + 1}</span>
              <button type="button" disabled={saving} aria-label={`Arrastrar ${flavor.name}`} aria-describedby={instructionsId} className="absolute right-2 top-2 flex h-11 w-11 touch-none select-none items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#625c52] shadow-sm outline-none backdrop-blur-sm transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#383836]/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-grab active:cursor-grabbing" onPointerDown={event => {
                if (event.button !== 0 || saving || active.current || !grid.current) return
                event.preventDefault()
                event.currentTarget.focus({ preventScroll: true })
                // Capture on the grid so reordering cards cannot detach the captured handle.
                grid.current.setPointerCapture(event.pointerId)
                const start = { id: flavor.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY }
                active.current = start
                setDrag(start)
                scrollFrame.current = requestAnimationFrame(scrollWhileDragging)
              }} onKeyDown={event => {
                let target: number | undefined
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = index - 1
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = index + 1
                if (event.key === 'Home') target = 0
                if (event.key === 'End') target = draft.length - 1
                if (target !== undefined) {
                  event.preventDefault()
                  if (!saving && draft[target]) move(flavor.id, draft[target].id)
                }
              }}><GripVertical className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" /></button>
              {!flavor.active && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-[#383836]/85 px-2.5 py-1 text-[9px] text-white backdrop-blur-sm">Oculto en pedidos</span>}
            </div>
            <div className="p-3 sm:p-4">
              <p title={flavor.name} className="line-clamp-2 h-10 text-sm font-medium leading-5 text-[#383836]">{flavor.name}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#eeeae2] pt-2">
                <Button type="button" variant="ghost" aria-label={`Subir ${flavor.name}`} title="Mover antes" disabled={saving || !!drag || index === 0} onClick={() => move(flavor.id, draft[index - 1].id)} className="h-11 rounded-xl border border-[#e8e3d9] bg-[#faf9f6] text-[#797166] shadow-none hover:bg-[#eeebe4] disabled:opacity-30"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>
                <Button type="button" variant="ghost" aria-label={`Bajar ${flavor.name}`} title="Mover después" disabled={saving || !!drag || index === draft.length - 1} onClick={() => move(flavor.id, draft[index + 1].id)} className="h-11 rounded-xl border border-[#e8e3d9] bg-[#faf9f6] text-[#797166] shadow-none hover:bg-[#eeebe4] disabled:opacity-30"><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p role="status" aria-live="polite" className="sr-only">{draggedFlavor ? `${draggedFlavor.name}, posición ${draft.findIndex(flavor => flavor.id === draggedFlavor.id) + 1} de ${draft.length}` : draft.map((flavor, index) => `${index + 1}. ${flavor.name}`).join(', ')}</p>
      <div className="sticky bottom-3 z-20 flex flex-col items-center justify-between gap-3 rounded-[20px] border border-[#e5e1d8] bg-white/95 p-3 shadow-[0_4px_24px_rgba(56,56,54,0.08)] backdrop-blur-xl sm:flex-row sm:px-5">
        <p className="text-[11px] text-[#938b7c]">{draft.length} sabores · Orden de esta tienda</p>
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
          <Button type="button" variant="outline" disabled={saving || !!drag} onClick={onCancel} className="h-11 min-w-0 rounded-xl border-[#ded9cf] bg-white px-2 text-xs text-[#625c52] sm:px-5 sm:text-sm">Cancelar</Button>
          <Button type="button" disabled={saving || !!drag} onClick={async () => {
            setSaving(true)
            try { if (await onSave(draft.map(flavor => flavor.id))) onCancel() } finally { setSaving(false) }
          }} className="h-11 min-w-0 gap-2 rounded-xl bg-[#383836] px-2 text-xs text-white hover:bg-[#4a4a46] sm:px-5 sm:text-sm">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}{saving ? 'Guardando…' : 'Guardar orden'}</Button>
        </div>
      </div>

      {drag && draggedFlavor && createPortal(
        <div aria-hidden="true" className="pointer-events-none fixed z-[70] w-40 rotate-2 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_16px_40px_rgba(56,56,54,0.25)]" style={{ left: drag.x - 80, top: drag.y - 40 }}>
          <div className="relative aspect-[4/3]"><Image src={getFlavorImageSrc(draggedFlavor, 'thumb')} alt="" fill sizes="160px" draggable={false} className="object-cover" /></div>
          <p className="truncate px-3 py-2 text-xs font-medium text-[#383836]">{draggedFlavor.name}</p>
        </div>, document.body
      )}
    </section>
  )
}
