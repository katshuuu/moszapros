"use client"

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Brain, 
  Dna, 
  Lightbulb, 
  TrendingUp, 
  History, 
  Users, 
  ShoppingCart,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState } from 'react'

export interface MLFactors {
  // Генетический алгоритм
  ga?: {
    categoryMatch: boolean
    fitness: number
    reason: string
  }
  // Reinforcement Learning
  rl?: {
    qValue: number
    reward: number
    reason: string
  }
  // LSTM
  lstm?: {
    score: number
    temporalBoost: number
    reason: string
  }
  // Общие факторы персонализации
  personalization?: {
    historyBoost: number
    categoryBoost: number
    purchaseBoost: number
    roleBoost: number
    explanations: string[]
  }
}

interface MLFactorsCardProps {
  factors: MLFactors
  position: number
  totalItems: number
  compact?: boolean
}

// Переводим технические термины на понятный язык
const factorDescriptions = {
  ga: {
    title: 'Подбор категорий',
    icon: Dna,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Система подобрала товар из категории, которая подходит вам'
  },
  rl: {
    title: 'Умное ранжирование',
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Система обучилась на ваших действиях и подняла товар'
  },
  lstm: {
    title: 'Анализ последовательности',
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'Система учла порядок ваших действий'
  }
}

export function MLFactorsCard({ factors, position, compact = false }: MLFactorsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Собираем все активные факторы
  const activeFactors: { key: string; value: number; label: string; icon: typeof Brain }[] = []
  
  if (factors.personalization) {
    if (factors.personalization.purchaseBoost > 0) {
      activeFactors.push({
        key: 'purchase',
        value: factors.personalization.purchaseBoost,
        label: 'Вы ранее покупали похожие товары',
        icon: ShoppingCart
      })
    }
    if (factors.personalization.historyBoost > 0) {
      activeFactors.push({
        key: 'history',
        value: factors.personalization.historyBoost,
        label: 'Основано на истории просмотров',
        icon: History
      })
    }
    if (factors.personalization.categoryBoost > 0) {
      activeFactors.push({
        key: 'category',
        value: factors.personalization.categoryBoost,
        label: 'Популярная категория для вас',
        icon: Target
      })
    }
    if (factors.personalization.roleBoost > 0) {
      activeFactors.push({
        key: 'role',
        value: factors.personalization.roleBoost,
        label: 'Подходит для вашей организации',
        icon: Users
      })
    }
  }
  
  if (factors.ga?.categoryMatch) {
    activeFactors.push({
      key: 'ga',
      value: factors.ga.fitness * 100,
      label: factors.ga.reason || 'Оптимальная категория',
      icon: Dna
    })
  }
  
  if (factors.rl && factors.rl.qValue > 0) {
    activeFactors.push({
      key: 'rl',
      value: factors.rl.qValue * 100,
      label: factors.rl.reason || 'Система обучилась на ваших предпочтениях',
      icon: Brain
    })
  }
  
  if (factors.lstm && factors.lstm.score > 0.5) {
    activeFactors.push({
      key: 'lstm',
      value: factors.lstm.score * 100,
      label: factors.lstm.reason || 'Учтён контекст сессии',
      icon: Lightbulb
    })
  }

  // Если нет факторов - не показываем компонент
  if (activeFactors.length === 0) {
    return null
  }

  // Сортируем по значению
  activeFactors.sort((a, b) => b.value - a.value)

  // Компактный режим - только иконки
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5 rounded-full bg-[#2D4A7C]/10 px-2 py-1">
              <Sparkles className="h-3 w-3 text-[#2D4A7C]" />
              <span className="text-xs font-medium text-[#2D4A7C]">ИИ</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">Почему товар на позиции #{position}:</p>
            <ul className="mt-1 space-y-1 text-sm">
              {activeFactors.slice(0, 3).map((f, i) => (
                <li key={i} className="flex items-center gap-1">
                  <f.icon className="h-3 w-3" />
                  {f.label}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#2D4A7C]/20 bg-gradient-to-r from-[#2D4A7C]/5 to-transparent p-3">
      {/* Заголовок */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2D4A7C]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-[#2D4A7C]">
            Почему этот товар на позиции #{position}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-[#666666]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#666666]" />
        )}
      </button>

      {/* Краткое описание (всегда видно) */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {activeFactors.slice(0, 3).map((factor, i) => (
          <Badge 
            key={i} 
            variant="secondary" 
            className="gap-1 bg-white text-xs font-normal"
          >
            <factor.icon className="h-3 w-3 text-[#2D4A7C]" />
            {factor.label.length > 30 ? factor.label.slice(0, 30) + '...' : factor.label}
          </Badge>
        ))}
        {activeFactors.length > 3 && !isExpanded && (
          <Badge variant="outline" className="text-xs">
            +{activeFactors.length - 3} ещё
          </Badge>
        )}
      </div>

      {/* Детальная информация (раскрывающаяся) */}
      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-[#e0e0e0] pt-3">
          {/* Факторы с прогрессбарами */}
          <div className="space-y-2">
            {activeFactors.map((factor, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <factor.icon className="h-3.5 w-3.5 text-[#2D4A7C]" />
                    <span className="text-[#1a1a1a]">{factor.label}</span>
                  </div>
                  <span className="font-medium text-[#2D4A7C]">
                    +{Math.round(factor.value)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(factor.value, 100)} 
                  className="h-1.5"
                />
              </div>
            ))}
          </div>

          {/* Объяснения от персонализации */}
          {factors.personalization?.explanations && factors.personalization.explanations.length > 0 && (
            <div className="rounded bg-[#EDF1F7] p-2">
              <p className="text-xs font-medium text-[#2D4A7C]">Подробнее:</p>
              <ul className="mt-1 space-y-0.5 text-xs text-[#666666]">
                {factors.personalization.explanations.map((exp, i) => (
                  <li key={i}>• {exp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ML алгоритмы */}
          {(factors.ga || factors.rl || factors.lstm) && (
            <div className="grid gap-2 sm:grid-cols-3">
              {factors.ga && (
                <div className={`rounded-lg ${factorDescriptions.ga.bgColor} p-2`}>
                  <div className="flex items-center gap-1.5">
                    <Dna className={`h-4 w-4 ${factorDescriptions.ga.color}`} />
                    <span className="text-xs font-medium text-[#1a1a1a]">
                      {factorDescriptions.ga.title}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#666666]">
                    {factors.ga.reason || factorDescriptions.ga.description}
                  </p>
                </div>
              )}
              
              {factors.rl && factors.rl.qValue > 0 && (
                <div className={`rounded-lg ${factorDescriptions.rl.bgColor} p-2`}>
                  <div className="flex items-center gap-1.5">
                    <Brain className={`h-4 w-4 ${factorDescriptions.rl.color}`} />
                    <span className="text-xs font-medium text-[#1a1a1a]">
                      {factorDescriptions.rl.title}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#666666]">
                    {factors.rl.reason || factorDescriptions.rl.description}
                  </p>
                </div>
              )}
              
              {factors.lstm && factors.lstm.score > 0.5 && (
                <div className={`rounded-lg ${factorDescriptions.lstm.bgColor} p-2`}>
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className={`h-4 w-4 ${factorDescriptions.lstm.color}`} />
                    <span className="text-xs font-medium text-[#1a1a1a]">
                      {factorDescriptions.lstm.title}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#666666]">
                    {factors.lstm.reason || factorDescriptions.lstm.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Пояснение */}
          <p className="text-xs italic text-[#999999]">
            Система обучается на ваших действиях. Чем больше вы взаимодействуете с товарами, 
            тем точнее становятся рекомендации.
          </p>
        </div>
      )}
    </div>
  )
}
