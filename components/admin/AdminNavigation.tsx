import { BarChart3, CalendarDays, Cookie, ShoppingBag, Store } from 'lucide-react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'

const sections = [
  { value: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { value: 'flavors', label: 'Sabores', icon: Cookie },
  { value: 'stores', label: 'Tiendas', icon: Store },
  { value: 'analytics', label: 'Análisis', icon: BarChart3 },
  { value: 'calendar', label: 'Agenda', accessibleLabel: 'Calendario de pedidos', icon: CalendarDays },
]

export function AdminNavigation() {
  return (
    <div className="min-w-0 rounded-[24px] border border-[#383836]/8 bg-white/65 p-2 shadow-[0_6px_24px_rgba(56,56,54,0.035)] backdrop-blur-xl sm:rounded-[28px] sm:p-3">
      <TabsList aria-label="Secciones del panel" className="mx-auto grid h-auto w-full max-w-5xl grid-cols-5 gap-1 rounded-[18px] border border-[#383836]/5 bg-[#f4f3ef] p-1 sm:gap-1.5 sm:p-1.5">
        {sections.map(({ value, label, accessibleLabel, icon: Icon }) => (
          <TabsTrigger key={value} value={value} aria-label={accessibleLabel || label} className="min-h-16 min-w-0 flex-col gap-2 rounded-[14px] px-0.5 py-3 text-[10px] font-medium text-[#79756d] shadow-none transition-colors hover:bg-white/65 hover:text-[#383836] data-[state=active]:border-[#383836] data-[state=active]:bg-[#383836] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(56,56,54,0.12)] min-[360px]:text-[11px] sm:px-3 sm:text-sm lg:min-h-12 lg:flex-row lg:gap-2.5">
            <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            <span>{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  )
}
