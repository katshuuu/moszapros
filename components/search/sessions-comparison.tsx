"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { type SearchSession, type PositionChange } from '@/lib/store'

interface SessionsComparisonProps {
  currentQuery: string
  sessions: SearchSession[]
  positionChanges: PositionChange[]
}

export function SessionsComparison({ currentQuery, sessions, positionChanges }: SessionsComparisonProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (sessions.length < 2) {
    return null // Нет достаточно данных для сравнения
  }

  const upCount = positionChanges.filter(pc => pc.change > 0).length
  const downCount = positionChanges.filter(pc => pc.change < 0).length
  const sameCount = positionChanges.filter(pc => pc.change === 0).length

  // Топ-факторы изменений
  const allFactors = positionChanges.flatMap(pc => pc.factors)
  const factorCounts = allFactors.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topFactors = Object.entries(factorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const factorLabels: Record<string, string> = {
    view: 'Просмотры',
    click: 'Клики',
    purchase: 'Покупки',
    positive: 'Лайки',
    negative: 'Дизлайки',
    role: 'Роль пользователя',
    similar_users: 'Похожие пользователи',
    trending: 'Тренды',
    price: 'Цена'
  }

  return (
    <Card className="mb-6 border-[#2D4A7C]/20">
      <CardHeader className="cursor-pointer pb-2" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-[#2D4A7C]" />
            Сравнение с предыдущей сессией
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Краткая статистика */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <span className="text-lg font-bold text-green-600">{upCount}</span>
              <span className="ml-1 text-sm text-[#666666]">поднялись</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <span className="text-lg font-bold text-red-600">{downCount}</span>
              <span className="ml-1 text-sm text-[#666666]">опустились</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <Minus className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-600">{sameCount}</span>
              <span className="ml-1 text-sm text-[#666666]">без изменений</span>
            </div>
          </div>
        </div>

        {/* Расширенная информация */}
        {isExpanded && (
          <div className="mt-4 space-y-4 border-t border-[#e0e0e0] pt-4">
            {/* Топ-факторы */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-[#666666]">
                Топ-факторы изменений для запроса «{currentQuery}»
              </h4>
              <div className="flex flex-wrap gap-2">
                {topFactors.map(([factor, count]) => (
                  <Badge key={factor} variant="outline" className="text-sm">
                    {factorLabels[factor] || factor}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Список изменений */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-[#666666]">
                Детали изменений позиций
              </h4>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {positionChanges.slice(0, 10).map((pc) => (
                  <div 
                    key={pc.steId}
                    className="flex items-center justify-between rounded-lg bg-[#f5f5f5] p-2 text-sm"
                  >
                    <span className="flex-1 truncate text-[#1a1a1a]">{pc.steName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#666666]">
                        {pc.previousPosition} → {pc.currentPosition}
                      </span>
                      <Badge 
                        className={pc.change > 0 
                          ? 'bg-green-100 text-green-800' 
                          : pc.change < 0 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                        }
                      >
                        {pc.change > 0 && '+'}
                        {pc.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Прогноз */}
            <div className="rounded-lg bg-[#EDF1F7] p-3">
              <h4 className="mb-1 text-sm font-medium text-[#2D4A7C]">
                Прогноз при сохранении текущего поведения
              </h4>
              <p className="text-sm text-[#666666]">
                {upCount > downCount 
                  ? 'Релевантные товары продолжат подниматься в выдаче. Ваши предпочтения становятся более точными.'
                  : downCount > upCount
                    ? 'Некоторые товары потеряли приоритет. Возможно, ваши интересы изменились.'
                    : 'Выдача стабильна. Система точно отражает ваши предпочтения.'
                }
              </p>
            </div>

            {/* Сравнение сессий */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-[#666666]">
                История сессий по запросу «{currentQuery}»
              </h4>
              <div className="space-y-1">
                {sessions.slice(0, 5).map((session, index) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[#666666]">
                      Сессия {index === 0 ? '(текущая)' : `#${sessions.length - index}`}
                    </span>
                    <span className="text-[#999999]">
                      {new Date(session.timestamp).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="text-[#666666]">
                      {session.results.length} результатов
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
