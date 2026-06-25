import { addDays, addHours, isAfter, isBefore, isEqual } from 'date-fns'
import type { Store, StorePickupSettings } from './types'

export const DEFAULT_PICKUP_SETTINGS: Required<StorePickupSettings> = {
  minNoticeHours: 34,
  maxAdvanceDays: 365,
  pickupStart: '10:00',
  pickupEnd: '20:00',
  timeSlotIntervalMinutes: 30,
  closedDates: [],
}

const LUX_PICKUP_SETTINGS: Required<StorePickupSettings> = {
  ...DEFAULT_PICKUP_SETTINGS,
  pickupStart: '11:00',
  pickupEnd: '21:00',
}

type PickupStoreInput = Store | StorePickupSettings | string | null | undefined

function isStore(input: PickupStoreInput): input is Store {
  return Boolean(input && typeof input === 'object' && 'id' in input)
}

function isSettings(input: PickupStoreInput): input is StorePickupSettings {
  return Boolean(input && typeof input === 'object' && !('id' in input))
}

function getFallbackSettings(store?: PickupStoreInput): Required<StorePickupSettings> {
  const storeText =
    typeof store === 'string'
      ? store
      : isStore(store)
        ? `${store.id} ${store.name}`
        : ''

  return storeText.toLowerCase().includes('lux')
    ? LUX_PICKUP_SETTINGS
    : DEFAULT_PICKUP_SETTINGS
}

export function getPickupSettings(store?: PickupStoreInput): Required<StorePickupSettings> {
  const fallback = getFallbackSettings(store)
  const settings = isStore(store) ? store.pickupSettings : isSettings(store) ? store : undefined

  return {
    ...fallback,
    ...settings,
    minNoticeHours: Math.max(0, Number(settings?.minNoticeHours ?? fallback.minNoticeHours)),
    maxAdvanceDays: Math.max(1, Number(settings?.maxAdvanceDays ?? fallback.maxAdvanceDays)),
    timeSlotIntervalMinutes: Math.max(
      15,
      Number(settings?.timeSlotIntervalMinutes ?? fallback.timeSlotIntervalMinutes)
    ),
    closedDates: Array.isArray(settings?.closedDates) ? settings.closedDates : fallback.closedDates,
  }
}

export function getMinPickupDate(store?: PickupStoreInput): Date {
  return addHours(new Date(), getPickupSettings(store).minNoticeHours)
}

export function getMaxPickupDate(store?: PickupStoreInput): Date {
  return addDays(new Date(), getPickupSettings(store).maxAdvanceDays)
}

function parsePickupDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function isClosedPickupDate(date: string, store?: PickupStoreInput): boolean {
  return getPickupSettings(store).closedDates.includes(date)
}

export function getPickupTimeOptions(store?: PickupStoreInput, date?: string): string[] {
  const settings = getPickupSettings(store)
  const start = timeToMinutes(settings.pickupStart)
  const end = timeToMinutes(settings.pickupEnd)
  const interval = settings.timeSlotIntervalMinutes

  if (start > end) return []

  const minDate = getMinPickupDate(store)
  const options: string[] = []

  for (let current = start; current <= end; current += interval) {
    const time = minutesToTime(current)
    if (date) {
      const pickupDateTime = parsePickupDateTime(date, time)
      if (isBefore(pickupDateTime, minDate) || isEqual(pickupDateTime, minDate)) {
        continue
      }
    }
    options.push(time)
  }

  return options
}

export function isValidPickupDate(
  date: string,
  time: string,
  store?: PickupStoreInput
): boolean {
  try {
    if (!date || !time || isClosedPickupDate(date, store)) return false

    const pickupDateTime = parsePickupDateTime(date, time)
    const minDate = getMinPickupDate(store)
    const maxDate = getMaxPickupDate(store)

    if (!(isAfter(pickupDateTime, minDate) && isBefore(pickupDateTime, maxDate))) {
      return false
    }

    return getPickupTimeOptions(store, date).includes(time)
  } catch {
    return false
  }
}

export function getPickupValidationMessage(
  date: string,
  time: string,
  store?: PickupStoreInput
): string {
  const settings = getPickupSettings(store)

  if (isClosedPickupDate(date, store)) {
    return 'La tienda no acepta recogidas ese dia.'
  }

  if (!isValidPickupDate(date, time, store)) {
    return `La recogida debe ser entre ${settings.minNoticeHours} horas y ${settings.maxAdvanceDays} dias desde ahora, dentro del horario ${settings.pickupStart}-${settings.pickupEnd}.`
  }

  return ''
}

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
