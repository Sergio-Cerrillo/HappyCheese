'use client'

import { useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, Check, ChevronDown, Clock3, MapPin, X } from 'lucide-react'
import { Item as RadioItem } from '@radix-ui/react-radio-group'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { RadioGroup } from '@/components/ui/radio-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { formatDateForInput, getMaxPickupDate, getMinPickupDate, getPickupSettings, getPickupTimeOptions, isClosedPickupDate, isValidPickupDate } from '@/lib/date-utils'
import type { Store } from '@/lib/types'

function PickerPanel({ kind, open, onOpenChange, trigger, title, description, children }: {
  kind: 'date' | 'time'
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactElement
  title: string
  description: string
  children: ReactNode
}) {
  const mobile = useIsMobile()
  if (mobile) {
    return <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="border-[#e5e1d8] bg-[#faf9f6] data-[vaul-drawer-direction=bottom]:max-h-[90dvh] data-[vaul-drawer-direction=bottom]:rounded-t-[28px]">
        <DrawerHeader className="relative shrink-0 px-12 pb-5 pt-5">
          <DrawerTitle className="font-bebas text-3xl font-normal text-[#383836]">{title}</DrawerTitle>
          <DrawerDescription className="mt-1 text-xs leading-relaxed text-[#797166]">{description}</DrawerDescription>
          <DrawerClose asChild><button type="button" aria-label={`Cerrar ${kind === 'date' ? 'calendario' : 'horarios'}`} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-[#797166] hover:bg-[#eeebe4]"><X className="h-4 w-4" /></button></DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-5 pb-[max(24px,env(safe-area-inset-bottom))]" data-vaul-no-drag="">
          <div className="mx-auto max-w-sm">{children}</div>
        </div>
      </DrawerContent>
    </Drawer>
  }
  return <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
    <PopoverContent align="start" sideOffset={10} role="dialog" aria-labelledby={`pickup-${kind}-title`} aria-describedby={`pickup-${kind}-description`} className="max-h-[var(--radix-popover-content-available-height)] w-[360px] max-w-[calc(100vw-32px)] overflow-y-auto overscroll-contain rounded-[24px] border-[#e5e1d8] bg-[#faf9f6] p-6 text-[#383836] shadow-[0_18px_60px_rgba(56,56,54,0.16)]">
      <div className="mb-5">
        <h4 id={`pickup-${kind}-title`} className="font-bebas text-3xl font-normal">{title}</h4>
        <p id={`pickup-${kind}-description`} className="mt-1 text-xs leading-relaxed text-[#797166]">{description}</p>
      </div>
      {children}
    </PopoverContent>
  </Popover>
}

export function PickupScheduler({ store, date, time, onChange, pickupWindow }: {
  store?: Store
  date: string
  time: string
  onChange: (date: string, time: string) => void
  pickupWindow?: { startsOn: string | null; endsOn: string | null }
}) {
  const [dateOpen, setDateOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const settings = getPickupSettings(store)
  const storeMinDate = formatDateForInput(getMinPickupDate(store))
  const storeMaxDate = formatDateForInput(getMaxPickupDate(store))
  const minDate = pickupWindow?.startsOn && pickupWindow.startsOn > storeMinDate ? pickupWindow.startsOn : storeMinDate
  const maxDate = pickupWindow?.endsOn && pickupWindow.endsOn < storeMaxDate ? pickupWindow.endsOn : storeMaxDate
  const selectedDay = date ? parseISO(date) : undefined

  function availableTimes(value: string) {
    if (value < minDate || value > maxDate || isClosedPickupDate(value, store)) return []
    return getPickupTimeOptions(store, value).filter(option => isValidPickupDate(value, option, store))
  }

  const firstAvailableDay = useMemo(() => {
    for (let day = parseISO(minDate); formatDateForInput(day) <= maxDate; day = addDays(day, 1)) {
      const value = formatDateForInput(day)
      if (!isClosedPickupDate(value, store) && getPickupTimeOptions(store, value).some(option => isValidPickupDate(value, option, store))) return day
    }
    return undefined
  }, [store, minDate, maxDate])
  const times = date ? availableTimes(date) : []
  const validDate = times.length > 0
  const complete = validDate && times.includes(time)
  const periods = [
    { name: 'Mañana', options: times.filter(option => option < '14:00') },
    { name: 'Tarde', options: times.filter(option => option >= '14:00' && option < '20:00') },
    { name: 'Noche', options: times.filter(option => option >= '20:00') },
  ].filter(period => period.options.length)
  const triggerClass = 'group flex min-h-36 w-full flex-col justify-between rounded-[20px] border bg-white/85 p-4 text-left outline-none transition-all duration-200 hover:border-[#aaa18f] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#383836]/25 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-white/35 disabled:opacity-55 md:min-h-40 md:p-5'

  return <section aria-label="Fecha y hora de recogida" className="overflow-hidden rounded-[26px] border border-[#e5e1d8] bg-[#f8f6f1] p-4 md:p-7">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-bebas text-[28px] font-normal leading-none text-[#383836]">Tu recogida</h3>
        {store && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#797166]"><MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />{store.name}</p>}
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5dfd3] bg-[#f0ece3] px-2.5 py-1.5 text-[10px] text-[#797166]"><Clock3 className="h-3 w-3" aria-hidden="true" />Mínimo {settings.minNoticeHours} h de antelación</span>
    </div>

    {(pickupWindow?.startsOn || pickupWindow?.endsOn) && <div className="mb-4 rounded-xl border border-[#ded4c1] bg-[#f1ebdf] px-4 py-3 text-xs leading-relaxed text-[#79613f]">
      <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.14em]">Recogida de tu selección exclusiva</p>
      <p>{pickupWindow.startsOn && `Desde el ${format(parseISO(pickupWindow.startsOn), "d 'de' MMMM yyyy", { locale: es })}`}{pickupWindow.startsOn && pickupWindow.endsOn && ' hasta el '}{!pickupWindow.startsOn && pickupWindow.endsOn && 'Hasta el '}{pickupWindow.endsOn && format(parseISO(pickupWindow.endsOn), "d 'de' MMMM yyyy", { locale: es })}. El calendario muestra los días disponibles para todo tu pedido.</p>
    </div>}

    <div className="grid grid-cols-2 gap-3 md:gap-4">
      <PickerPanel kind="date" open={dateOpen} onOpenChange={setDateOpen} title="Elige el día" description="Solo puedes seleccionar días con recogidas disponibles." trigger={
        <button type="button" disabled={!firstAvailableDay} aria-label={`Fecha de recogida: ${selectedDay ? format(selectedDay, 'EEEE d MMMM yyyy', { locale: es }) : 'elige el día'}`} className={cn(triggerClass, validDate ? 'border-[#b8ae9b]' : 'border-[#e5e1d8]')}>
          <span className="flex w-full items-center justify-between gap-2 text-[#797166]"><span className="text-[10px] uppercase tracking-[0.16em]">01 / Fecha</span><CalendarDays className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /></span>
          <span className={cn('mt-5 block whitespace-nowrap font-bebas font-normal leading-none text-[#383836] md:text-[38px]', selectedDay ? 'text-[30px]' : 'text-[24px]')}>{selectedDay ? format(selectedDay, 'd MMM', { locale: es }) : 'Elegir día'}</span>
          <span className="mt-2 flex w-full items-center justify-between gap-1 text-[10px] text-[#797166] md:text-xs"><span className={selectedDay ? 'capitalize' : undefined}>{selectedDay ? format(selectedDay, 'EEEE · yyyy', { locale: es }) : 'Ver calendario'}</span><ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" /></span>
        </button>
      }>
        <Calendar mode="single" required autoFocus locale={es} selected={selectedDay} defaultMonth={(validDate && selectedDay) || firstAvailableDay || parseISO(minDate)} startMonth={parseISO(minDate)} endMonth={parseISO(maxDate < minDate ? minDate : maxDate)} showOutsideDays={false}
          disabled={day => availableTimes(formatDateForInput(day)).length === 0}
          onSelect={day => {
            if (!day) return
            const value = formatDateForInput(day)
            if (availableTimes(value).length === 0) return
            if (value !== date) onChange(value, '')
            setDateOpen(false)
          }}
          labels={{ labelPrevious: () => 'Mes anterior', labelNext: () => 'Mes siguiente', labelDayButton: (day, modifiers) => `${format(day, 'EEEE d MMMM yyyy', { locale: es })}${modifiers.disabled ? ', no disponible' : ''}` }}
          components={{ DayButton: props => <CalendarDayButton {...props} className="group-data-[focused=true]/day:border-[#383836]/20 group-data-[focused=true]/day:ring-[#383836]/15" /> }}
          className="w-full bg-transparent p-0 [--cell-size:2.5rem] [&_button]:rounded-xl [&_button]:border-[#383836]/25 [&_button]:shadow-none [&_button]:ring-[#383836]/20 [&_button[data-selected-single=true]]:bg-[#383836] [&_button[data-selected-single=true]]:text-white"
          classNames={{ root: 'w-full', caption_label: 'font-bebas text-2xl font-normal capitalize text-[#383836]', weekday: 'flex-1 text-center text-[10px] font-normal uppercase text-[#938b7c]', day: 'relative w-[calc(100%/7)] shrink-0 aspect-square p-0 text-center group/day select-none', today: 'font-semibold text-[#383836]', disabled: 'opacity-25' }}
        />
        <p className="mt-4 border-t border-[#e8e3d9] pt-3 text-center text-[10px] leading-relaxed text-[#797166]">Recogidas de {settings.pickupStart} a {settings.pickupEnd}</p>
      </PickerPanel>

      <PickerPanel kind="time" open={timeOpen} onOpenChange={setTimeOpen} title="Elige la hora" description={selectedDay ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es }) : 'Selecciona primero el día de recogida.'} trigger={
        <button type="button" disabled={!validDate} aria-label={`Hora de recogida: ${complete ? time : 'elige la hora'}`} className={cn(triggerClass, complete ? 'border-[#b8ae9b]' : 'border-[#e5e1d8]')}>
          <span className="flex w-full items-center justify-between gap-2 text-[#797166]"><span className="text-[10px] uppercase tracking-[0.16em]">02 / Hora</span><Clock3 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /></span>
          <span className={cn('mt-5 block whitespace-nowrap font-bebas font-normal leading-none text-[#383836] md:text-[38px]', complete ? 'text-[30px]' : 'text-[24px]')}>{complete ? time : 'Elegir hora'}</span>
          <span className="mt-2 flex w-full items-center justify-between gap-1 text-[10px] text-[#797166] md:text-xs"><span>{validDate ? 'Ver horarios' : 'Elige antes el día'}</span><ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" /></span>
        </button>
      }>
        <RadioGroup aria-label="Horas de recogida disponibles" value={time} onValueChange={value => onChange(date, value)} onKeyDownCapture={event => {
          if (event.key !== 'Enter') return
          const option = (event.target as HTMLElement).closest<HTMLButtonElement>('button[role="radio"]')?.value
          if (option) { event.preventDefault(); onChange(date, option); setTimeOpen(false) }
        }} className="max-h-[min(44dvh,320px)] gap-4 overflow-y-auto overscroll-contain pr-1" data-vaul-no-drag="">
          {periods.map(period => <div key={period.name} role="group" aria-label={period.name}>
            <p className="mb-2 px-3 text-[9px] uppercase tracking-[0.18em] text-[#938b7c]">{period.name}</p>
            <div className="space-y-1">
              {period.options.map(option => <RadioItem key={option} value={option} aria-label={`Recoger a las ${option}`} onClick={event => {
                // Radix simula clics al navegar con flechas; el panel sigue abierto hasta confirmar.
                if (event.nativeEvent.isTrusted) { onChange(date, option); setTimeOpen(false) }
              }} className={cn(
                'flex min-h-12 w-full cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#383836]/30 focus-visible:ring-offset-2',
                time === option ? 'bg-[#383836] text-white' : 'text-[#383836] hover:bg-[#eeebe4]'
              )}>
                <span className="font-bebas text-2xl font-normal tabular-nums">{option}<span className="ml-1.5 font-sans text-xs font-normal opacity-55">h</span></span>
                {time === option ? <span className="flex items-center gap-2 text-[10px]">Seleccionada <Check className="h-3.5 w-3.5" aria-hidden="true" /></span> : <span className="h-3.5 w-3.5 rounded-full border border-[#d8d0c1]" aria-hidden="true" />}
              </RadioItem>)}
            </div>
          </div>)}
        </RadioGroup>
      </PickerPanel>
    </div>

    <div className="mt-4 flex min-h-9 items-center justify-center gap-2 rounded-xl px-2 py-2 text-center text-[11px] leading-relaxed text-[#797166]" role="status" aria-live="polite">
      {complete ? <><Check className="h-3.5 w-3.5 shrink-0 text-[#383836]" aria-hidden="true" /><span className="text-[#383836]">{format(selectedDay!, "EEEE d 'de' MMMM", { locale: es })} · {time} h</span></> : <span>{!firstAvailableDay ? 'No hay recogidas disponibles en este periodo.' : date && !validDate ? 'Este día no tiene horarios disponibles. Elige otra fecha.' : validDate ? 'Ahora elige la hora de recogida.' : 'Elige un día para consultar sus horas disponibles.'}</span>}
    </div>
  </section>
}
