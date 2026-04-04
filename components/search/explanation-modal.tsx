"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Clock, MousePointer, ShoppingCart, ThumbsUp, ThumbsDown, Users, Sparkles, Activity } from 'lucide-react'
import { type DetailedExplanation, type PositionChangeFactor } from '@/lib/sessions-store'
import { type SearchResult } from '@/lib/search-engine'

interface ExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  item: SearchResult
  explanation: DetailedExplanation
}

const factorIcons: Record<PositionChangeFactor['type'], React.ReactNode> = {
  view: <Clock className="h-4 w-4" />,
  click: <MousePointer className="h-4 w-4" />,
  purchase: <ShoppingCart className="h-4 w-4" />,
  positive: <ThumbsUp className="h-4 w-4" />,
  negative: <ThumbsDown className="h-4 w-4" />,
  role: <Users className="h-4 w-4" />,
  similar_users: <Users className="h-4 w-4" />,
  trending: <Sparkles className="h-4 w-4" />,
  price: <Activity className="h-4 w-4" />
}

const factorColors: Record<PositionChangeFactor['type'], string> = {
  view: 'bg-blue-100 text-blue-800',
  click: 'bg-purple-100 text-purple-800',
  purchase: 'bg-green-100 text-green-800',
  positive: 'bg-emerald-100 text-emerald-800',
  negative: 'bg-red-100 text-red-800',
  role: 'bg-indigo-100 text-indigo-800',
  similar_users: 'bg-cyan-100 text-cyan-800',
  trending: 'bg-amber-100 text-amber-800',
  price: 'bg-orange-100 text-orange-800'
}

export function ExplanationModal({ isOpen, onClose, item, explanation }: ExplanationModalProps) {
  const positionChange = explanation.positionChange
  const hasChange = positionChange !== null && positionChange !== 0

  // Расчёт общего влияния факторов
  const totalPositiveImpact = explanation.factors
    .filter(f => f.impact > 0)
    .reduce((sum, f) => sum + f.impact, 0)
  const totalNegativeImpact = Math.abs(
    explanation.factors
      .filter(f => f.impact < 0)
      .reduce((sum, f) => sum + f.impact, 0)
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-[#2D4A7C]">Почему этот результат?</span>
            {hasChange && (
              <Badge 
                className={positionChange > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
                }
              >
                {positionChange > 0 ? (
                  <>
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Поднялся на {positionChange} {positionChange === 1 ? 'место' : 'места'}
                  </>
                ) : (
                  <>
                    <TrendingDown className="mr-1 h-3 w-3" />
                    Опустился на {Math.abs(positionChange)} {Math.abs(positionChange) === 1 ? 'место' : 'места'}
                  </>
                )}
              </Badge>
            )}
            {!hasChange && explanation.previousPosition && (
              <Badge className="bg-gray-100 text-gray-800">
                <Minus className="mr-1 h-3 w-3" />
                Позиция не изменилась
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {item.name} — позиция #{explanation.currentPosition}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="factors" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="factors">Факторы влияния</TabsTrigger>
            <TabsTrigger value="history">Ваши действия</TabsTrigger>
            <TabsTrigger value="heatmap">Тепловая карта</TabsTrigger>
          </TabsList>

          <TabsContent value="factors" className="mt-4 space-y-4">
            {/* Сводка */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#666666]">
                  Сводка влияния на позицию
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Положительное влияние</span>
                  <span className="font-medium text-green-600">+{totalPositiveImpact}%</span>
                </div>
                <Progress value={Math.min(totalPositiveImpact, 100)} className="h-2 bg-gray-200" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Отрицательное влияние</span>
                  <span className="font-medium text-red-600">-{totalNegativeImpact}%</span>
                </div>
                <Progress value={Math.min(totalNegativeImpact, 100)} className="h-2 bg-gray-200" />

                <div className="mt-4 rounded-lg bg-[#EDF1F7] p-3">
                  <p className="text-sm font-medium text-[#2D4A7C]">Прогноз</p>
                  <p className="text-sm text-[#666666]">{explanation.prediction}</p>
                </div>
              </CardContent>
            </Card>

            {/* Детализация факторов */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#666666]">
                  Детализация факторов
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {explanation.factors.length === 0 ? (
                  <p className="text-sm text-[#666666]">
                    Пока нет данных о ваших взаимодействиях с этим товаром. 
                    Позиция определяется только релевантностью запросу.
                  </p>
                ) : (
                  explanation.factors.map((factor, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-[#e0e0e0] p-3"
                    >
                      <div className={`rounded-full p-2 ${factorColors[factor.type]}`}>
                        {factorIcons[factor.type]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#1a1a1a]">{factor.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress 
                            value={Math.min(Math.abs(factor.impact), 100)} 
                            className={`h-1.5 flex-1 ${factor.impact >= 0 ? 'bg-green-200' : 'bg-red-200'}`}
                          />
                          <span className={`text-xs font-medium ${factor.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {factor.impact >= 0 ? '+' : ''}{factor.impact}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Объяснение изменения */}
            {hasChange && (
              <Card className={positionChange > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="pt-4">
                  <p className="text-sm">
                    <span className="font-medium">
                      {item.name} {positionChange > 0 ? 'поднялся' : 'опустился'} на {Math.abs(positionChange)} 
                      {Math.abs(positionChange) === 1 ? ' место' : ' места'} потому что:
                    </span>
                  </p>
                  <ul className="mt-2 space-y-1">
                    {explanation.factors.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#666666]">
                        <span className="text-lg">•</span>
                        {f.description}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#666666]">
                  Временная шкала ваших действий
                </CardTitle>
              </CardHeader>
              <CardContent>
                {explanation.userActions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-[#666666]">
                    Вы пока не взаимодействовали с этим товаром
                  </p>
                ) : (
                  <div className="relative space-y-4 pl-6">
                    {/* Вертикальная линия */}
                    <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-[#e0e0e0]" />
                    
                    {explanation.userActions.map((action, index) => (
                      <div key={index} className="relative flex items-start gap-3">
                        {/* Точка на линии */}
                        <div className="absolute -left-4 mt-1.5 h-3 w-3 rounded-full border-2 border-[#2D4A7C] bg-white" />
                        
                        <div className="flex-1 rounded-lg border border-[#e0e0e0] p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#1a1a1a]">
                              {action.description}
                            </span>
                            <Badge variant="outline" className={
                              action.impact.startsWith('+') 
                                ? 'border-green-300 text-green-600' 
                                : 'border-red-300 text-red-600'
                            }>
                              {action.impact}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-[#666666]">
                            {new Date(action.timestamp).toLocaleString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#666666]">
                  Тепловая карта факторов влияния
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Просмотры', value: explanation.breakdown.viewBonus, max: 10 },
                    { label: 'Клики', value: explanation.breakdown.clickBonus, max: 30 },
                    { label: 'Покупки', value: explanation.breakdown.purchaseBonus, max: 50 },
                    { label: 'Лайки', value: explanation.breakdown.positiveBonus, max: 35 },
                    { label: 'Дизлайки', value: Math.abs(explanation.breakdown.negativeBonus), max: 25, negative: true },
                    { label: 'Роль', value: explanation.breakdown.roleBonus, max: 15 },
                  ].map((item, index) => {
                    const intensity = Math.min((item.value / item.max) * 100, 100)
                    const bgColor = item.negative 
                      ? `rgba(220, 38, 38, ${intensity / 100})` 
                      : `rgba(34, 197, 94, ${intensity / 100})`
                    
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center justify-center rounded-lg border border-[#e0e0e0] p-4 transition-all"
                        style={{ backgroundColor: item.value > 0 ? bgColor : 'transparent' }}
                      >
                        <span className={`text-xs ${item.value > 0 ? 'text-white font-medium' : 'text-[#666666]'}`}>
                          {item.label}
                        </span>
                        <span className={`mt-1 text-lg font-bold ${
                          item.value > 0 
                            ? 'text-white' 
                            : 'text-[#999999]'
                        }`}>
                          {item.negative && item.value > 0 ? '-' : item.value > 0 ? '+' : ''}
                          {item.value}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Легенда */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#666666]">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-green-100" />
                    <span>Слабое</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-green-300" />
                    <span>Среднее</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded bg-green-500" />
                    <span>Сильное</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Граф связей */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#666666]">
                  Граф связей: действие - фактор - позиция
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-[#EDF1F7] p-4">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2D4A7C] text-white">
                      <MousePointer className="h-5 w-5" />
                    </div>
                    <p className="mt-1 text-xs text-[#666666]">Действие</p>
                  </div>
                  
                  <div className="flex-1 border-t-2 border-dashed border-[#2D4A7C]" />
                  
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#C93535] text-white">
                      <Activity className="h-5 w-5" />
                    </div>
                    <p className="mt-1 text-xs text-[#666666]">Фактор</p>
                  </div>
                  
                  <div className="flex-1 border-t-2 border-dashed border-[#C93535]" />
                  
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
                      {positionChange && positionChange > 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : positionChange && positionChange < 0 ? (
                        <TrendingDown className="h-5 w-5" />
                      ) : (
                        <Minus className="h-5 w-5" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#666666]">Позиция</p>
                  </div>
                </div>

                <p className="mt-3 text-center text-sm text-[#666666]">
                  Ваши действия формируют факторы, которые влияют на позицию товара в выдаче
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
