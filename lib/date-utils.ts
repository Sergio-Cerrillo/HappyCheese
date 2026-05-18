import { addHours, addYears, isAfter, isBefore } from 'date-fns'

export function getMinPickupDate(): Date {
  // Mínimo 34 horas desde ahora
  return addHours(new Date(), 34)
}

export function getMaxPickupDate(): Date {
  // Máximo 1 año desde ahora
  return addYears(new Date(), 1)
}

/**
 * Valida la fecha y hora de recogida según la tienda.
 * @param date - Fecha en formato YYYY-MM-DD
 * @param time - Hora en formato HH:mm
 * @param storeIdOrName - ID o nombre de la tienda (opcional, si no se pasa, solo valida rango general)
 */
export function isValidPickupDate(date: string, time: string, storeIdOrName?: string): boolean {
  try {
    const [year, month, day] = date.split('-').map(Number)
    const [hours, minutes] = time.split(':').map(Number)
    const pickupDateTime = new Date(year, month - 1, day, hours, minutes)
    const minDate = getMinPickupDate()
    const maxDate = getMaxPickupDate()
    if (!(isAfter(pickupDateTime, minDate) && isBefore(pickupDateTime, maxDate))) {
      return false
    }
    // Validación de rango horario según tienda
    if (storeIdOrName) {
      const store = storeIdOrName.toLowerCase()
      if (store.includes('lux')) {
        // happycheese lux: 11:00 - 19:00
        if (hours < 11 || hours > 19 || (hours === 19 && minutes > 0)) return false
      } else {
        // happycheese: 10:00 - 20:00
        if (hours < 10 || hours > 20 || (hours === 20 && minutes > 0)) return false
      }
    }
    return true
  } catch {
    return false
  }
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
