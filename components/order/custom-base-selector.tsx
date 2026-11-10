'use client'

import { Check } from 'lucide-react'
import { Item as RadioItem } from '@radix-ui/react-radio-group'
import { RadioGroup } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { CustomBaseOption } from '@/lib/types'

export function CustomBaseSelector({ options, value, onChange, portion, includedBaseName }: {
  options: CustomBaseOption[]
  value: string
  onChange: (value: string) => void
  portion: string
  includedBaseName: string
}) {
  const choices = [{ id: '', name: includedBaseName, surcharge: 0 }, ...options]
  const selectedId = options.some(option => option.id === value) ? value : ''

  return <fieldset className="space-y-2">
    <legend className="mb-2 text-[9px] uppercase tracking-[0.16em] text-[#8b8377]">Base de tu tarta</legend>
    <RadioGroup value={selectedId} onValueChange={onChange} aria-label={`Base para la tarta ${portion.toLowerCase()}`} className="grid grid-cols-2 gap-2">
      {choices.map(choice => {
        const selected = choice.id === selectedId
        return <RadioItem key={choice.id || 'original'} value={choice.id} aria-label={choice.id ? `${choice.name}, suplemento ${choice.surcharge.toFixed(2)} euros por tarta` : `${choice.name}, sin suplemento`} onFocus={() => { if (choice.id !== selectedId) onChange(choice.id) }} className={cn(
          'flex min-h-16 min-w-0 cursor-pointer items-center gap-2 rounded-[14px] border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#383836]/25',
          selected ? 'border-[#383836] bg-white text-[#383836]' : 'border-[#e5dfd3] bg-white/60 text-[#797166] hover:border-[#b8ae9b] hover:bg-white'
        )}>
          <span aria-hidden="true" className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', selected ? 'border-[#383836] bg-[#383836] text-white' : 'border-[#cfc7b8]')}>
            {selected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
          </span>
          <span className="min-w-0">
            <span className="block break-words text-xs font-medium leading-snug">{choice.name}</span>
            <span className="mt-1 block text-[10px] font-normal tabular-nums opacity-70">{choice.id ? `+${choice.surcharge.toFixed(2)} €` : 'Incluida'}</span>
          </span>
        </RadioItem>
      })}
    </RadioGroup>
  </fieldset>
}
