'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Search, Sparkles, Users, History, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ScoreBreakdown {
  text: number
  typo: number
  synonym: number
  popularity: number
  personalization: number
  itemBoost: number
  categoryBoost: number
}

export interface RankingExplanationProps {
  scoreBreakdown: ScoreBreakdown
  positionChange: number
  originalPosition: number
  newPosition: number
  signalStrength: 'strong' | 'medium' | 'weak' | 'none'
  explanations: string[]
}

/**
 * Компонент объяснения ранжирования для карточки товара
 * Показывает понятным языком, почему товар на этой позиции
 */
export function RankingExplanationCard({
  scoreBreakdown,
  positionChange,
  originalPosition,
  newPosition,
  signalStrength,
  explanations
}: RankingExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Определяем главный фактор
  const factors = [
    { key: 'text', label: 'Совпадение с запросом', value: scoreBreakdown.text, icon: Search, color: 'bg-blue-500' },
    { key: 'personalization', label: 'Ваши предпочтения', value: scoreBreakdown.personalization, icon: Sparkles, color: 'bg-purple-500' },
    { key: 'popularity', label: 'Популярность', value: scoreBreakdown.popularity, icon: Users, color: 'bg-green-500' },
    { key: 'synonym', label: 'Синонимы', value: scoreBreakdown.synonym, icon: Lightbulb, color: 'bg-amber-500' },
  ].filter(f => f.value > 0).sort((a, b) => b.value - a.value)
  
  const topFactor = factors[0]
  const totalScore = factors.reduce((sum, f) => sum + f.value, 0)
  
  // Иконка изменения позиции
  const PositionIcon = positionChange > 0 ? TrendingUp : positionChange < 0 ? TrendingDown : Minus
  const positionColor = positionChange > 0 ? 'text-green-600' : positionChange < 0 ? 'text-red-500' : 'text-gray-400'
  
  // Цвет силы сигнала
  const signalColors = {
    strong: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    weak: 'bg-amber-100 text-amber-800 border-amber-200',
    none: 'bg-gray-100 text-gray-600 border-gray-200'
  }
  
  const signalLabels = {
    strong: 'Сильная персонализация',
    medium: 'Персонализировано',
    weak: 'Базовая персонализация',
    none: 'Без персонализации'
  }
  
  // Если нет данных для отображения
  if (totalScore === 0 && positionChange === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded-lg border border-[#e0e0e0] bg-[#FAFAFA] p-3">
      {/* Заголовок с главным фактором */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {/* Иконка изменения позиции */}
          {positionChange !== 0 && (
            <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', positionColor)}>
              <PositionIcon className="h-3 w-3" />
              <span>{positionChange > 0 ? `+${positionChange}` : positionChange}</span>
            </div>
          )}
          
          {/* Бейдж силы сигнала */}
          {signalStrength !== 'none' && (
            <span className={cn('rounded-full border px-2 py-0.5 text-xs', signalColors[signalStrength])}>
              {signalLabels[signalStrength]}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-[#666666]">
          <span>Подробнее</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      
      {/* Краткое объяснение */}
      {topFactor && (
        <div className="mt-2 flex items-center gap-2 text-sm text-[#1a1a1a]">
          <topFactor.icon className="h-4 w-4 text-[#2D4A7C]" />
          <span>
            Главный фактор: <strong>{topFactor.label}</strong>
          </span>
        </div>
      )}
      
      {/* Развернутое объяснение */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Визуализация скоров */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#666666]">Разбор ранжирования:</div>
            {factors.map(factor => {
              const percentage = totalScore > 0 ? (factor.value / totalScore) * 100 : 0
              const FactorIcon = factor.icon
              
              return (
                <div key={factor.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <FactorIcon className="h-3.5 w-3.5 text-[#666666]" />
                      <span className="text-[#1a1a1a]">{factor.label}</span>
                    </div>
                    <span className="font-mono text-[#666666]">{factor.value} баллов</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e0e0e0]">
                    <div
                      className={cn('h-full rounded-full transition-all', factor.color)}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Детали персонализации */}
          {(scoreBreakdown.itemBoost > 0 || scoreBreakdown.categoryBoost > 0) && (
            <div className="rounded-md bg-[#EDF1F7] p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#2D4A7C]">
                <History className="h-3.5 w-3.5" />
                <span>Ваша история влияет на позицию:</span>
              </div>
              <ul className="space-y-1 text-xs text-[#1a1a1a]">
                {scoreBreakdown.itemBoost > 0 && (
                  <li className="flex items-center justify-between">
                    <span>Взаимодействия с товаром</span>
                    <span className="font-mono text-green-600">+{scoreBreakdown.itemBoost}</span>
                  </li>
                )}
                {scoreBreakdown.categoryBoost > 0 && (
                  <li className="flex items-center justify-between">
                    <span>Предпочтения по категории</span>
                    <span className="font-mono text-green-600">+{scoreBreakdown.categoryBoost}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
          
          {/* Текстовые объяснения */}
          {explanations.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-[#666666]">Почему этот товар здесь:</div>
              <ul className="space-y-1">
                {explanations.slice(0, 4).map((explanation, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#1a1a1a]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2D4A7C]" />
                    <span>{explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Изменение позиции */}
          {positionChange !== 0 && (
            <div className={cn(
              'flex items-center gap-2 rounded-md p-2 text-xs',
              positionChange > 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            )}>
              <PositionIcon className="h-4 w-4" />
              <span>
                {positionChange > 0 
                  ? `Поднялся с ${originalPosition}-го на ${newPosition}-е место благодаря вашему профилю`
                  : `Опустился с ${originalPosition}-го на ${newPosition}-е место`
                }
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
