"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ShoppingCart, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { type STEItem } from '@/lib/ste-data'
import { toast } from 'sonner'

interface RecommendedSectionProps {
  items: STEItem[]
}

export function RecommendedSection({ items }: RecommendedSectionProps) {
  const { favorites, toggleFavorite, addInteraction, user } = useAuthStore()

  const handleFavorite = (item: STEItem) => {
    toggleFavorite(item.id)
    addInteraction(item.id, 'favorite')
    toast.success(
      favorites.includes(item.id) 
        ? 'Удалено из избранного' 
        : 'Добавлено в избранное'
    )
  }

  const handlePurchase = (item: STEItem) => {
    addInteraction(item.id, 'purchase')
    toast.success('Товар добавлен в корзину! (Демо)')
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-background p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EDF1F7]">
          <span className="text-2xl">✨</span>
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">Начните поиск</h3>
        <p className="text-muted-foreground">
          Введите запрос в поисковую строку, чтобы найти нужные товары
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#C93535]" />
        <h2 className="text-xl font-bold text-foreground">
          Рекомендуется именно вам
        </h2>
      </div>
      <p className="text-muted-foreground">
        На основе профиля «{user?.organization}» и вашей истории закупок
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isFavorite = favorites.includes(item.id)

          return (
            <Card key={item.id} className="overflow-hidden border-border bg-background transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between">
                  <Badge variant="secondary" className="bg-[#EDF1F7] text-[#2D4A7C]">
                    {item.category}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleFavorite(item)}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-[#C93535] text-[#C93535]' : 'text-muted-foreground'}`} />
                  </Button>
                </div>

                <h3 className="mb-1 font-medium text-foreground line-clamp-2">{item.name}</h3>
                <p className="mb-2 text-xs text-[#2D4A7C]">{item.steCode}</p>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{item.description}</p>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#2D4A7C]">
                      {item.priceMin.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-xs text-muted-foreground">за {item.unit}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handlePurchase(item)}
                    className="bg-[#C93535] text-white hover:bg-[#B02E2E]"
                  >
                    <ShoppingCart className="mr-1 h-4 w-4" />
                    Купить
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
