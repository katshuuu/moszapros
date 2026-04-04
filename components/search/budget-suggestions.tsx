"use client"

import { useMemo } from 'react'
import { Lightbulb, ShoppingCart, Plus, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { steItems } from '@/lib/ste-data'

interface BudgetSuggestionsProps {
  selectedItemId: string
  selectedItemPrice: number
  selectedItemQuantity: number
  totalBudget: number
  userRole?: string
  onAddToCart?: (itemId: string, quantity: number) => void
}

// Сопутствующие товары по категориям
const relatedCategories: Record<string, string[]> = {
  'Канцелярские товары': ['Канцелярские товары', 'Офисные принадлежности', 'Бумага и бумажные изделия'],
  'Офисные принадлежности': ['Канцелярские товары', 'Офисные принадлежности', 'Мебель офисная'],
  'Медицинские товары': ['Медицинские товары', 'Санитарно-гигиенические товары', 'Хозяйственные товары'],
  'Строительные материалы': ['Строительные материалы', 'Инструменты', 'Хозяйственные товары'],
  'Компьютерная техника': ['Компьютерная техника', 'Офисные принадлежности', 'Расходные материалы'],
  'Мебель офисная': ['Мебель офисная', 'Офисные принадлежности', 'Компьютерная техника'],
  'Хозяйственные товары': ['Хозяйственные товары', 'Санитарно-гигиенические товары', 'Бумага и бумажные изделия'],
}

// Рекомендации по ролям
const roleSuggestions: Record<string, string[]> = {
  'office': ['Ручка', 'Карандаш', 'Ластик', 'Скрепки', 'Степлер', 'Линейка', 'Блокнот', 'Тетрадь'],
  'medical': ['Перчатки', 'Маски', 'Антисептик', 'Вата', 'Бинт', 'Пластырь', 'Халат'],
  'construction': ['Перчатки', 'Каска', 'Очки защитные', 'Респиратор', 'Инструмент'],
}

export function BudgetSuggestions({
  selectedItemId,
  selectedItemPrice,
  selectedItemQuantity,
  totalBudget,
  userRole,
  onAddToCart
}: BudgetSuggestionsProps) {
  // Рассчитываем остаток бюджета
  const selectedItemTotal = selectedItemPrice * selectedItemQuantity
  const remainingBudget = totalBudget - selectedItemTotal

  // Находим выбранный товар
  const selectedItem = useMemo(() => {
    return steItems.find(item => item.id === selectedItemId)
  }, [selectedItemId])

  // Находим сопутствующие товары на остаток бюджета
  const suggestions = useMemo(() => {
    if (remainingBudget <= 0 || !selectedItem) return []

    // Определяем категории для поиска
    const itemCategory = selectedItem.category
    const searchCategories = relatedCategories[itemCategory] || [itemCategory]
    
    // Получаем ключевые слова для роли
    const roleKeywords = userRole ? roleSuggestions[userRole] || [] : []

    // Находим товары в подходящих категориях с ценой в пределах остатка
    const candidateItems = steItems.filter(item => {
      // Исключаем выбранный товар
      if (item.id === selectedItemId) return false
      
      // Проверяем что цена укладывается в остаток
      if (item.priceMin > remainingBudget) return false

      // Приоритет товарам из связанных категорий
      const categoryMatch = searchCategories.includes(item.category)
      
      // Приоритет товарам по роли
      const roleMatch = roleKeywords.some(keyword => 
        item.name.toLowerCase().includes(keyword.toLowerCase())
      )

      return categoryMatch || roleMatch
    })

    // Сортируем по релевантности
    const scored = candidateItems.map(item => {
      let score = 0
      
      // Бонус за связанную категорию
      if (searchCategories.includes(item.category)) score += 10
      
      // Бонус за совпадение с ролью
      if (roleKeywords.some(kw => item.name.toLowerCase().includes(kw.toLowerCase()))) {
        score += 20
      }
      
      // Бонус за популярность
      if (item.purchaseCount) score += item.purchaseCount / 100
      
      // Штраф за высокую цену (предпочитаем бюджетные)
      score -= item.priceMin / remainingBudget * 5

      return { item, score }
    })

    // Сортируем и берем топ-6
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ item }) => {
        // Рассчитываем сколько можно купить на остаток
        const maxQuantity = Math.floor(remainingBudget / item.priceMin)
        return {
          ...item,
          suggestedQuantity: Math.min(maxQuantity, 10), // Не больше 10 штук
          maxAffordable: maxQuantity
        }
      })
  }, [selectedItem, selectedItemId, remainingBudget, userRole])

  if (remainingBudget <= 0 || suggestions.length === 0) {
    return null
  }

  return (
    <Card className="mt-6 border-2 border-dashed border-[#2D4A7C]/30 bg-gradient-to-r from-[#EDF1F7] to-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-[#2D4A7C]">
          <Lightbulb className="h-5 w-5 text-[#C93535]" />
          Возможно, Вам понадобится
        </CardTitle>
        <p className="text-sm text-[#666666]">
          На остаток бюджета <span className="font-semibold text-[#C93535]">{remainingBudget.toLocaleString('ru-RU')} ₽</span> вы можете докупить:
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1a1a1a] line-clamp-1">
                    {item.name}
                  </span>
                  {item.maxAffordable >= 10 && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Выгодно
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#666666]">
                  <span>{item.priceMin.toLocaleString('ru-RU')} ₽/{item.unit}</span>
                  <span>•</span>
                  <span>до {item.maxAffordable} шт</span>
                </div>
              </div>
              {onAddToCart && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-2 h-8 w-8 p-0 text-[#2D4A7C] hover:bg-[#2D4A7C] hover:text-white"
                  onClick={() => onAddToCart(item.id, item.suggestedQuantity)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Сводка */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#2D4A7C]/5 p-3">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4 text-[#2D4A7C]" />
            <span className="text-[#666666]">
              Выбрано: <strong className="text-[#1a1a1a]">{selectedItem?.name}</strong>
            </span>
          </div>
          <div className="text-right text-sm">
            <div className="text-[#666666]">
              {selectedItemQuantity} шт × {selectedItemPrice.toLocaleString('ru-RU')} ₽
            </div>
            <div className="font-semibold text-[#1a1a1a]">
              = {selectedItemTotal.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
