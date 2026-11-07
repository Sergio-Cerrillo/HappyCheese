import { Check, Cookie, Layers3 } from 'lucide-react'
import { Item as RadioItem } from '@radix-ui/react-radio-group'
import { RadioGroup } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { CustomBaseOption } from '@/lib/types'

export function CustomBaseSelector({ options, value, onChange, portion }: {
  options: CustomBaseOption[]
  value: string
  onChange: (value: string) => void
  portion: string
}) {
  const choices = [
    { id: '', name: 'Base original', surcharge: 0, original: true },
    ...options.map(base => ({ ...base, original: false })),
  ]

  return <fieldset className="space-y-3">
    <legend className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#79756d]">
      <Layers3 className="h-3.5 w-3.5" aria-hidden="true" /> Dale tu toque · Elige la base
    </legend>
    <RadioGroup value={value} onValueChange={onChange} aria-label={`Base para la tarta ${portion.toLowerCase()}`} className="gap-2.5">
      {choices.map(choice => {
        const selected = value === choice.id
        return <RadioItem key={choice.id || 'original'} value={choice.id} aria-label={choice.original ? 'Base original, sin suplemento' : `${choice.name}, suplemento ${choice.surcharge.toFixed(2)} euros por tarta`} className={cn(
          'flex min-h-20 cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#383836]/30',
          selected ? 'border-[#383836] bg-white shadow-[0_4px_16px_rgba(56,56,54,0.06)]' : 'border-[#e8e5df] bg-white/55 hover:border-[#b8b2a7] hover:bg-white'
        )}>
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', selected ? 'bg-[#383836] text-white' : 'bg-[#efede7] text-[#79756d]')}>
            <Cookie className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium leading-snug text-[#383836]">{choice.name}</span>
            <span className="mt-1 block text-xs text-[#79756d]">{choice.original ? 'Nuestra receta de siempre' : 'Una base diferente para tu tarta'}</span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-2">
            <span className="text-xs font-semibold tabular-nums text-[#383836]">{choice.original ? 'Incluida' : `+${choice.surcharge.toFixed(2)} €`}</span>
            <span aria-hidden="true" className={cn('flex h-4 w-4 items-center justify-center rounded-full border', selected ? 'border-[#383836] bg-[#383836] text-white' : 'border-[#cbc5ba]')}>
              {selected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
          </span>
        </RadioItem>
      })}
    </RadioGroup>
  </fieldset>
}
