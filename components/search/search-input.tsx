"use client"

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  correction: string | null
  synonymsUsed: string[]
}

export function SearchInput({ value, onChange, correction, synonymsUsed }: SearchInputProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Введите название товара, код СТЕ или ключевые слова..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 pl-12 pr-4 text-lg border-border bg-background shadow-sm"
        />
      </div>
      
      {correction && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Возможно, вы имели в виду:</span>
          <button
            onClick={() => onChange(correction)}
            className="font-medium text-[#2D4A7C] hover:underline"
          >
            {correction}
          </button>
        </div>
      )}
      
      {synonymsUsed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Также искали по:</span>
          {synonymsUsed.map((synonym, index) => (
            <span
              key={index}
              className="rounded-full bg-[#EDF1F7] px-2 py-0.5 text-[#2D4A7C]"
            >
              {synonym}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
