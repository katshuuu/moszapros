"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Dna, 
  Bot, 
  Network, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Clock
} from 'lucide-react'

interface MLOptimizationInfoProps {
  optimization: {
    enabled: boolean
    gaCategories: string[]
    gaFitness: number
    rlTotalReward: number
    optimizationTimeMs: number
    steps: string[]
  } | null
}

export function MLOptimizationInfo({ optimization }: MLOptimizationInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!optimization || !optimization.enabled) {
    return null
  }

  return (
    <Card className="mb-4 border-[#2D4A7C]/30 bg-gradient-to-r from-[#2D4A7C]/5 to-[#C93535]/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#2D4A7C]" />
            <CardTitle className="text-sm font-medium">
              ML-оптимизация поиска
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Активна
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Summary */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-[#666666]">
            <Dna className="h-4 w-4 text-[#2D4A7C]" />
            <span>ГА: {optimization.gaCategories.length} категорий</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#666666]">
            <Bot className="h-4 w-4 text-[#C93535]" />
            <span>RL: reward {optimization.rlTotalReward.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#666666]">
            <Network className="h-4 w-4 text-purple-600" />
            <span>LSTM ранжирование</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#666666]">
            <Clock className="h-4 w-4" />
            <span>{optimization.optimizationTimeMs}мс</span>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* GA Categories */}
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Dna className="h-4 w-4 text-[#2D4A7C]" />
                Генетический алгоритм: Оптимальный граф категорий
              </div>
              <div className="flex flex-wrap gap-1.5">
                {optimization.gaCategories.map((cat, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
              <p className="mt-1 text-xs text-[#666666]">
                Fitness: {optimization.gaFitness.toFixed(2)} — показатель качества подбора категорий
              </p>
            </div>

            {/* RL Info */}
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Bot className="h-4 w-4 text-[#C93535]" />
                Reinforcement Learning: Комбинирование товаров
              </div>
              <p className="text-xs text-[#666666]">
                Total Reward: {optimization.rlTotalReward.toFixed(2)} — накопленная награда за оптимальную комбинацию
              </p>
            </div>

            {/* LSTM Info */}
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Network className="h-4 w-4 text-purple-600" />
                LSTM: Финальное ранжирование
              </div>
              <p className="text-xs text-[#666666]">
                Учитывает временной контекст, историю взаимодействий и предпочтения пользователя
              </p>
            </div>

            {/* Steps */}
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-amber-500" />
                Этапы оптимизации
              </div>
              <ol className="list-inside list-decimal space-y-1 text-xs text-[#666666]">
                {optimization.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
