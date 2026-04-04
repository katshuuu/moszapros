"use client"

import { X, Brain, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SearchExplanationProps {
  explanations: string[]
  onClose: () => void
}

export function SearchExplanation({ explanations, onClose }: SearchExplanationProps) {
  if (explanations.length === 0) return null

  return (
    <Card className="mb-6 border-[#2D4A7C]/30 bg-gradient-to-r from-[#2D4A7C]/5 to-[#2D4A7C]/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#2D4A7C]">
          <Brain className="h-5 w-5" />
          Персонализация выдачи
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-[#666666] hover:text-[#1a1a1a]"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="mb-3 text-sm text-[#666666]">
          Система адаптировала результаты на основе вашей истории и профиля:
        </p>
        <ul className="space-y-2">
          {explanations.map((explanation, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#2D4A7C]" />
              <span className="text-[#1a1a1a]">{explanation}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[#666666]">
          Ваши действия (просмотры, покупки, оценки) влияют на порядок выдачи в реальном времени.
        </p>
      </CardContent>
    </Card>
  )
}
