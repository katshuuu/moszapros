"use client"

import { useMemo } from 'react'
import { Lightbulb, ShoppingCart, Plus, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { steItems } from '@/lib/ste-data'

interface CartItem {
  id: string
  price: number
  quantity: number
}

interface BudgetSuggestionsProps {
  selectedItemId: string
  selectedItemPrice: number
  selectedItemQuantity: number
  totalBudget: number
  userRole?: string
  userCategory?: string
  cartItems?: CartItem[]
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
  userCategory,
  cartItems = [],
  onAddToCart
}: BudgetSuggestionsProps) {
  // Рассчитываем общую сумму в корзине
  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])
  
  // Если корзина пуста, используем выбранный товар
  const totalSpent = cartTotal > 0 ? cartTotal : selectedItemPrice * selectedItemQuantity
  const remainingBudget = totalBudget - totalSpent
  
  // Процент освоения бюджета
  const budgetUsedPercent = Math.round((totalSpent / totalBudget) * 100)

  // Находим выбранный товар
  const selectedItem = useMemo(() => {
    return steItems.find(item => item.id === selectedItemId)
  }, [selectedItemId])

  // Находим сопутствующие товары на остаток бюджета
  const suggestions = useMemo(() => {
    if (remainingBudget <= 0 || !selectedItem) return []

    // Определяем категории для поиска
    const itemCategory = userCategory || selectedItem.category
    const searchCategories = relatedCategories[itemCategory] || [itemCategory]
    
    // Получаем ключевые слова для роли
    const roleKeywords = userRole ? roleSuggestions[userRole] || [] : []
    
    // Получаем ID товаров уже в корзине
    const cartItemIds = cartItems.map(i => i.id)

    // Находим товары в подходящих категориях с ценой в пределах остатка
    const candidateItems = steItems.filter(item => {
      // Исключаем выбранный товар и товары в корзине
      if (item.id === selectedItemId) return false
      if (cartItemIds.includes(item.id)) return false
      
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
        <p className="mt-1 text-xs text-[#2D4A7C]">
          Основано на закупках похожих организаций{userRole === 'buyer' && userCategory ? ` сферы "${userCategory}"` : ''}
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

        {/* Сводка по бюджету */}
        <div className="mt-4 space-y-3 rounded-lg bg-[#2D4A7C]/5 p-4">
          {/* Прогресс-бар освоения бюджета */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#666666]">Освоение бюджета:</span>
              <span className="font-semibold text-[#1a1a1a]">{budgetUsedPercent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#2D4A7C] to-[#C93535] transition-all duration-500"
                style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Итоги */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-3">
            <div className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-[#2D4A7C]" />
              <span className="text-[#666666]">
                {cartItems.length > 0 ? `В корзине: ${cartItems.length} поз.` : `Выбрано: ${selectedItem?.name}`}
              </span>
            </div>
            <div className="text-right text-sm">
              <div className="text-[#666666]">
                Потрачено: <span className="font-semibold text-[#1a1a1a]">{totalSpent.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="text-[#666666]">
                из <span className="font-semibold text-[#C93535]">{totalBudget.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
