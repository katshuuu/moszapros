"use client"

import { Search, Sparkles, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { type TypoCorrection, type SynonymExpansion } from '@/lib/search-engine'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  typoCorrection?: TypoCorrection
  synonymExpansion?: SynonymExpansion
}

export function SearchInput({ value, onChange, typoCorrection, synonymExpansion }: SearchInputProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666666]" />
        <Input
          type="text"
          placeholder="Введите название товара, например: бумага офисная А4..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 rounded-xl border-2 border-[#e0e0e0] bg-white pl-12 pr-4 text-lg shadow-sm transition-colors focus:border-[#2D4A7C] focus:ring-[#2D4A7C]"
        />
      </div>

      {/* Показываем исправление опечаток */}
      {typoCorrection?.wasChanged && (
        <div className="flex items-center gap-2 rounded-lg bg-[#FFF3CD] p-3 text-sm">
          <Sparkles className="h-4 w-4 text-[#856404]" />
          <span className="text-[#856404]">
            Исправлено: <s className="text-[#856404]/60">{typoCorrection.original}</s>
          </span>
          <ArrowRight className="h-4 w-4 text-[#856404]" />
          <button
            onClick={() => onChange(typoCorrection.corrected)}
            className="font-medium text-[#856404] hover:underline"
          >
            {typoCorrection.corrected}
          </button>
        </div>
      )}

      {/* Показываем использованные синонимы */}
      {synonymExpansion && synonymExpansion.synonymsUsed && synonymExpansion.synonymsUsed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#D1ECF1] p-3 text-sm">
          <span className="text-[#0C5460]">Морфологический поиск учёл синонимы:</span>
          {synonymExpansion.synonymsUsed.map((syn, idx) => (
            <Badge 
              key={idx} 
              variant="secondary"
              className="bg-[#0C5460]/10 text-[#0C5460]"
            >
              {syn}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
