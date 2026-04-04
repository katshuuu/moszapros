"use client"

import { useState, useEffect, useRef } from 'react'
import { useEventTracker } from '@/lib/hooks/use-event-tracker'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ThumbsUp, ThumbsDown, ShoppingCart, Star, TrendingUp, TrendingDown, Minus, Info, HelpCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useSessionsStore, type DetailedExplanation } from '@/lib/sessions-store'
import { roleRecommendations } from '@/lib/ste-data'
import { type SearchResult, type TypoCorrection } from '@/lib/search-engine'
import { toast } from 'sonner'
import { ExplanationModal } from './explanation-modal'
import { RankingExplanationCard, type ScoreBreakdown } from './ranking-explanation-card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RankingData {
  scoreBreakdown: ScoreBreakdown
  positionChange: number
  originalPosition: number
  newPosition: number
  signalStrength: 'strong' | 'medium' | 'weak' | 'none'
  explanations: string[]
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  userRole?: string
  onInteraction?: (steId: string, type: 'view' | 'click' | 'purchase' | 'positive' | 'negative') => void
  typoCorrection?: TypoCorrection
  selectedItemId?: string | null
  rankingDataMap?: Record<string, RankingData>
}

const roleLabels: Record<string, string> = {
  office: 'офисных поставок',
  medical: 'медицинского оборудования',
  construction: 'строительных материалов'
}

export function SearchResults({ results, query, userRole, onInteraction, typoCorrection, selectedItemId, rankingDataMap = {} }: SearchResultsProps) {
  const { favorites, toggleFavorite, addInteraction, interactions } = useAuthStore()
  const { getPositionChanges, getDetailedExplanation } = useSessionsStore()
  const { trackClick, trackSearch, trackSelect, startDwellTracking, stopDwellTracking, trackHover } = useEventTracker()
  
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null)
  const [selectedExplanation, setSelectedExplanation] = useState<DetailedExplanation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const hoverTimers = useRef<Map<string, number>>(new Map())

  // Track search results when they change
  useEffect(() => {
    if (results.length > 0 && query) {
      trackSearch(query, results.length)
    }
  }, [query, results.length, trackSearch])

  // Получаем изменения позиций
  const positionChanges = getPositionChanges(query, results)
  const positionChangeMap = new Map(positionChanges.map(pc => [pc.steId, pc]))

  const handleFavorite = (item: SearchResult) => {
    toggleFavorite(item.id)
    addInteraction(item.id, 'favorite')
    onInteraction?.(item.id, 'click')
    toast.success(
      favorites.includes(item.id) 
        ? 'Удалено из избранного' 
        : 'Добавлено в избранное'
    )
  }

  const handlePositiveFeedback = (item: SearchResult) => {
    addInteraction(item.id, 'positive')
    onInteraction?.(item.id, 'positive')
    toast.success('Спасибо! Система учтёт это — похожие товары будут выше в выдаче.')
  }

  const handleNegativeFeedback = (item: SearchResult) => {
    addInteraction(item.id, 'negative')
    onInteraction?.(item.id, 'negative')
    toast.success('Спасибо! Система понизит приоритет подобных товаров.')
  }

  const handleClick = (item: SearchResult, position: number) => {
    addInteraction(item.id, 'click')
    onInteraction?.(item.id, 'click')
    // Track click event
    trackClick(item.id, item.name, item.category, position, query)
  }

  const handlePurchase = (item: SearchResult) => {
    addInteraction(item.id, 'purchase')
    onInteraction?.(item.id, 'purchase')
    // Track select/purchase event
    trackSelect(item.id, item.name, item.category, { action: 'add_to_cart', query })
    toast.success('Товар добавлен в корзину! Это повлияет на будущие рекомендации.')
  }

  // Handle hover tracking
  const handleMouseEnter = (item: SearchResult) => {
    hoverTimers.current.set(item.id, Date.now())
    startDwellTracking(item.id, item.name, item.category)
  }

  const handleMouseLeave = (item: SearchResult) => {
    const startTime = hoverTimers.current.get(item.id)
    if (startTime) {
      const duration = Date.now() - startTime
      trackHover(item.id, item.name, item.category, duration)
      hoverTimers.current.delete(item.id)
    }
    stopDwellTracking(item.id, item.name, item.category)
  }

  const handleShowExplanation = (item: SearchResult, index: number) => {
    const explanation = getDetailedExplanation(item.id, query, index + 1, interactions)
    explanation.steName = item.name
    explanation.totalScore = item.personalizedScore
    explanation.breakdown.relevanceScore = item.relevanceScore
    explanation.breakdown.roleBonus = item.personalizationFactors?.roleBonus || 0
    
    setSelectedItem(item)
    setSelectedExplanation(explanation)
    setIsModalOpen(true)
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EDF1F7]">
          <span className="text-2xl">&#128269;</span>
        </div>
        <h3 className="mb-2 text-lg font-medium text-[#1a1a1a]">Ничего не найдено</h3>
        <p className="text-[#666666]">
          По запросу «{typoCorrection?.wasChanged ? typoCorrection.corrected : query}» ничего не найдено.
        </p>
        <p className="mt-2 text-sm text-[#666666]">
          Попробуйте изменить поисковый запрос или выбрать другую категорию.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {results.map((item, index) => {
          const isFavorite = favorites.includes(item.id)
          const isRecommended = userRole && roleRecommendations[userRole]?.includes(item.id)
          const isTopResult = index < 3
          const hasPersonalization = item.personalizationFactors && 
            (item.personalizationFactors.roleBonus > 0 || item.personalizationFactors.interactionBonus > 0)
          const isSelectedItem = selectedItemId === item.id

          // Получаем изменение позиции для этого товара
          const positionChange = positionChangeMap.get(item.id)
          const hasPositionChange = positionChange && positionChange.change !== 0

          return (
            <Card 
              key={item.id} 
              className={`overflow-hidden transition-shadow hover:shadow-md ${
                isSelectedItem 
                  ? 'border-2 border-[#C93535] bg-[#C93535]/5 ring-2 ring-[#C93535]/20' 
                  : 'border-[#e0e0e0] bg-white'
              }`}
              onClick={() => handleClick(item, index + 1)}
              onMouseEnter={() => handleMouseEnter(item)}
              onMouseLeave={() => handleMouseLeave(item)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Статус позиции */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isTopResult && (
                        <Badge className="bg-[#2D4A7C] text-white">
                          <Star className="mr-1 h-3 w-3" />
                          #{index + 1}
                        </Badge>
                      )}
                      
                      {/* Изменение позиции */}
                      {hasPositionChange && (
                        <Badge 
                          className={positionChange.change > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                          }
                        >
                          {positionChange.change > 0 ? (
                            <>
                              <TrendingUp className="mr-1 h-3 w-3" />
                              &#8593; поднялся на {positionChange.change} {positionChange.change === 1 ? 'место' : 'места'}
                            </>
                          ) : (
                            <>
                              <TrendingDown className="mr-1 h-3 w-3" />
                              &#8595; опустился на {Math.abs(positionChange.change)} {Math.abs(positionChange.change) === 1 ? 'место' : 'места'}
                            </>
                          )}
                        </Badge>
                      )}
                      
                      {positionChange && positionChange.change === 0 && (
                        <Badge className="bg-gray-100 text-gray-600">
                          <Minus className="mr-1 h-3 w-3" />
                          позиция не изменилась
                        </Badge>
                      )}

                      {hasPersonalization && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help border-[#2D4A7C] text-[#2D4A7C]">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              Персонализировано
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-medium">Почему этот товар выше:</p>
                            <ul className="mt-1 space-y-1 text-sm">
                              {item.personalizationFactors.explanation.map((exp, i) => (
                                <li key={i}>• {exp}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {isRecommended && (
                        <Badge variant="outline" className="border-[#C93535] text-[#C93535]">
                          Рекомендовано
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-[#EDF1F7] text-[#2D4A7C]">
                        {item.category}
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#1a1a1a]">{item.name}</h3>
                      <p className="text-sm text-[#2D4A7C]">Код СТЕ: {item.steCode}</p>
                    </div>
                    
                    <p className="text-sm text-[#666666]">{item.description}</p>
                    
                    {/* Подсвечиваем совпавшие термины */}
                    {item.matchedTerms && item.matchedTerms.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-[#666666]">Найдено по:</span>
                        {item.matchedTerms.slice(0, 5).map((term, i) => (
                          <Badge key={i} variant="secondary" className="bg-[#D4EDDA] text-xs text-[#155724]">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(item.characteristics).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="rounded bg-[#EDF1F7] px-2 py-1 text-xs text-[#1a1a1a]">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[#666666]">ОКПД: {item.okpdCode}</span>
                      <span className="text-[#666666]">Ед. изм.: {item.unit}</span>
                      {item.purchaseCount && (
                        <span className="text-[#666666]">Закупок: {item.purchaseCount}</span>
                      )}
                    </div>

                    {/* Визуализация факторов ранжирования */}
                    {rankingDataMap[item.id] && (
                      <RankingExplanationCard
                        scoreBreakdown={rankingDataMap[item.id].scoreBreakdown}
                        positionChange={rankingDataMap[item.id].positionChange}
                        originalPosition={rankingDataMap[item.id].originalPosition}
                        newPosition={rankingDataMap[item.id].newPosition}
                        signalStrength={rankingDataMap[item.id].signalStrength}
                        explanations={rankingDataMap[item.id].explanations}
                      />
                    )}

                    {/* Кнопка "Почему этот результат?" для КАЖДОЙ карточки */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-[#2D4A7C] hover:bg-[#EDF1F7] hover:text-[#2D4A7C]"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShowExplanation(item, index)
                      }}
                    >
                      <HelpCircle className="h-4 w-4" />
                      Подробнее о ранжировании
                    </Button>

                    {/* Краткое объяснение для топ-3 */}
                    {isTopResult && hasPersonalization && item.personalizationFactors.explanation.length > 0 && (
                      <div className="flex items-start gap-2 rounded-lg bg-[#EDF1F7] p-3 text-sm">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2D4A7C]" />
                        <div>
                          <span className="font-medium text-[#2D4A7C]">Почему в топе: </span>
                          <span className="text-[#666666]">
                            {item.personalizationFactors.explanation.slice(0, 2).join('. ')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Объяснение изменения позиции */}
                    {hasPositionChange && positionChange.factors.length > 0 && (
                      <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                        positionChange.change > 0 ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {positionChange.change > 0 ? (
                          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        ) : (
                          <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        )}
                        <div>
                          <span className={`font-medium ${positionChange.change > 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {positionChange.change > 0 ? 'Поднялся' : 'Опустился'} потому что:
                          </span>
                          <ul className="mt-1 space-y-0.5 text-[#666666]">
                            {positionChange.factors.slice(0, 2).map((f, i) => (
                              <li key={i}>• {f.description}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#2D4A7C]">
                        {item.priceMin.toLocaleString('ru-RU')} — {item.priceMax.toLocaleString('ru-RU')} &#8381;
                      </div>
                      <div className="text-xs text-[#666666]">за {item.unit}</div>
                      
                      {/* Показываем скоры для отладки/демо */}
                      <div className="mt-1 text-xs text-[#999999]">
                        Релевантность: {item.relevanceScore.toFixed(1)} | 
                        Персонал.: {item.personalizedScore.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFavorite(item)
                        }}
                        className={isFavorite ? 'border-[#C93535] text-[#C93535]' : ''}
                      >
                        <Heart className={`mr-1 h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                        {isFavorite ? 'В избранном' : 'В избранное'}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePurchase(item)
                        }}
                        className="bg-[#C93535] text-white hover:bg-[#B02E2E]"
                      >
                        <ShoppingCart className="mr-1 h-4 w-4" />
                        В корзину
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#666666]">Оцените результат:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePositiveFeedback(item)
                            }}
                          >
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Поднять в выдаче</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleNegativeFeedback(item)
                            }}
                          >
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Понизить в выдаче</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Модальное окно с детальным объяснением */}
      {selectedItem && selectedExplanation && (
        <ExplanationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={selectedItem}
          explanation={selectedExplanation}
        />
      )}
    </TooltipProvider>
  )
}
