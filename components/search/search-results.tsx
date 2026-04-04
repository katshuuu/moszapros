"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ThumbsUp, ThumbsDown, ShoppingCart, Eye, Star } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { type STEItem, roleRecommendations } from '@/lib/ste-data'
import { toast } from 'sonner'

interface SearchResultsProps {
  results: STEItem[]
  query: string
  userRole?: string
}

const roleLabels: Record<string, string> = {
  office: 'офисных поставок',
  medical: 'медицинского оборудования',
  construction: 'строительных материалов'
}

export function SearchResults({ results, query, userRole }: SearchResultsProps) {
  const { favorites, toggleFavorite, addInteraction } = useAuthStore()

  const handleFavorite = (item: STEItem) => {
    toggleFavorite(item.id)
    addInteraction(item.id, 'favorite')
    toast.success(
      favorites.includes(item.id) 
        ? 'Удалено из избранного' 
        : 'Добавлено в избранное'
    )
  }

  const handlePositiveFeedback = (item: STEItem) => {
    addInteraction(item.id, 'positive')
    toast.success('Спасибо за обратную связь! Мы учтём это в будущих результатах.')
  }

  const handleNegativeFeedback = (item: STEItem) => {
    addInteraction(item.id, 'negative')
    toast.success('Спасибо за обратную связь! Мы учтём это в будущих результатах.')
  }

  const handleView = (item: STEItem) => {
    addInteraction(item.id, 'view')
  }

  const handlePurchase = (item: STEItem) => {
    addInteraction(item.id, 'purchase')
    toast.success('Товар добавлен в корзину! (Демо)')
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg bg-background p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EDF1F7]">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">Ничего не найдено</h3>
        <p className="text-muted-foreground">
          По запросу «{query}» ничего не найдено. Попробуйте изменить поисковый запрос.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map((item, index) => {
        const isFavorite = favorites.includes(item.id)
        const isRecommended = userRole && roleRecommendations[userRole]?.includes(item.id)
        const isTopResult = index < 3

        return (
          <Card 
            key={item.id} 
            className="overflow-hidden border-border bg-background transition-shadow hover:shadow-md"
            onClick={() => handleView(item)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {isTopResult && (
                      <Badge className="bg-[#2D4A7C] text-white">
                        <Star className="mr-1 h-3 w-3" />
                        Топ результат
                      </Badge>
                    )}
                    {isRecommended && (
                      <Badge variant="outline" className="border-[#C93535] text-[#C93535]">
                        Рекомендовано для вас
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-[#EDF1F7] text-[#2D4A7C]">
                      {item.category}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
                    <p className="text-sm text-[#2D4A7C]">Код СТЕ: {item.steCode}</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.characteristics).slice(0, 3).map(([key, value]) => (
                      <span key={key} className="rounded bg-[#EDF1F7] px-2 py-1 text-xs text-foreground">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">ОКПД: {item.okpdCode}</span>
                    <span className="text-muted-foreground">Ед. изм.: {item.unit}</span>
                  </div>

                  {isRecommended && userRole && (
                    <div className="rounded-lg bg-[#EDF1F7] p-3 text-sm">
                      <span className="font-medium text-[#2D4A7C]">Почему рекомендовано: </span>
                      <span className="text-muted-foreground">
                        Этот товар часто закупается организациями в сфере {roleLabels[userRole]}.
                        Подходит на основе вашей истории взаимодействий.
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#2D4A7C]">
                      {item.priceMin.toLocaleString('ru-RU')} — {item.priceMax.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-xs text-muted-foreground">за {item.unit}</div>
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
                    <span className="text-xs text-muted-foreground">Это подходит?</span>
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
