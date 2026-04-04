"use client"

import { useState } from 'react'
import { X, SlidersHorizontal, Wallet, Package, Filter, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

export interface SearchFilters {
  budgetMin: number | null
  budgetMax: number | null
  quantity: number | null
  maxPricePerUnit: number | null // Рассчитывается автоматически
  verifiedSuppliers: boolean
  inStock: boolean
  freeDelivery: boolean
  installmentAvailable: boolean
  sortBy: 'price_asc' | 'price_desc' | 'popularity' | 'rating'
}

interface FiltersPanelProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onApply: () => void
  onReset: () => void
}

export const defaultFilters: SearchFilters = {
  budgetMin: null,
  budgetMax: null,
  quantity: null,
  maxPricePerUnit: null,
  verifiedSuppliers: false,
  inStock: false,
  freeDelivery: false,
  installmentAvailable: false,
  sortBy: 'popularity'
}

export function FiltersPanel({ filters, onFiltersChange, onApply, onReset }: FiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  // Расчёт максимальной цены за единицу
  const calculateMaxPricePerUnit = (budget: number | null, quantity: number | null): number | null => {
    if (budget && quantity && quantity > 0) {
      return Math.floor(budget / quantity)
    }
    return null
  }

  const handleBudgetMaxChange = (value: string) => {
    const budget = value ? parseInt(value, 10) : null
    const maxPrice = calculateMaxPricePerUnit(budget, localFilters.quantity)
    setLocalFilters(prev => ({
      ...prev,
      budgetMax: budget,
      maxPricePerUnit: maxPrice
    }))
  }

  const handleQuantityChange = (value: string) => {
    const quantity = value ? parseInt(value, 10) : null
    const maxPrice = calculateMaxPricePerUnit(localFilters.budgetMax, quantity)
    setLocalFilters(prev => ({
      ...prev,
      quantity,
      maxPricePerUnit: maxPrice
    }))
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onApply()
    setIsOpen(false)
  }

  const handleReset = () => {
    setLocalFilters(defaultFilters)
    onReset()
  }

  const activeFiltersCount = [
    localFilters.budgetMax,
    localFilters.quantity,
    localFilters.verifiedSuppliers,
    localFilters.inStock,
    localFilters.freeDelivery,
    localFilters.installmentAvailable
  ].filter(Boolean).length

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-[#2D4A7C] text-[#2D4A7C] hover:bg-[#2D4A7C] hover:text-white"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C93535] text-xs text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[#2D4A7C]">
            <Filter className="h-5 w-5" />
            Фильтры
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Бюджет */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#2D4A7C]">
              <Wallet className="h-5 w-5" />
              <h3 className="font-semibold">Бюджет</h3>
            </div>
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="budgetMin" className="text-sm text-gray-600">Мин:</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    placeholder="0"
                    value={localFilters.budgetMin || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      budgetMin: e.target.value ? parseInt(e.target.value, 10) : null
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="budgetMax" className="text-sm text-gray-600">Макс:</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    placeholder="1 000 000"
                    value={localFilters.budgetMax || ''}
                    onChange={(e) => handleBudgetMaxChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Введите бюджет в рублях для закупки товара
              </p>
              <p className="text-xs text-gray-400">
                Диапазон: 0 ₽ — 1 000 000 ₽
              </p>
            </div>
          </div>

          {/* Количество */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#2D4A7C]">
              <Package className="h-5 w-5" />
              <h3 className="font-semibold">Количество</h3>
            </div>
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <Label htmlFor="quantity" className="text-sm text-gray-600">Кол-во единиц:</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Укажите количество"
                  value={localFilters.quantity || ''}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="mt-1"
                  min={1}
                  max={100000}
                />
              </div>
              <p className="text-xs text-gray-500">
                Укажите нужное количество товара
              </p>
              <p className="text-xs text-gray-400">
                Минимум: 1 | Максимум: 100 000
              </p>
            </div>
          </div>

          {/* Расчёт максимальной цены */}
          {localFilters.maxPricePerUnit && (
            <div className="rounded-lg border-2 border-[#2D4A7C] bg-[#EDF1F7] p-4">
              <p className="text-sm font-medium text-[#2D4A7C]">
                Максимальная цена за единицу:
              </p>
              <p className="mt-1 text-2xl font-bold text-[#C93535]">
                {localFilters.maxPricePerUnit.toLocaleString('ru-RU')} ₽
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {localFilters.budgetMax?.toLocaleString('ru-RU')} ₽ / {localFilters.quantity?.toLocaleString('ru-RU')} шт
              </p>
            </div>
          )}

          <Separator />

          {/* Дополнительные фильтры */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#2D4A7C]">
              <Filter className="h-5 w-5" />
              <h3 className="font-semibold">Дополнительные фильтры</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verifiedSuppliers"
                  checked={localFilters.verifiedSuppliers}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ ...prev, verifiedSuppliers: checked === true }))
                  }
                />
                <Label htmlFor="verifiedSuppliers" className="text-sm">
                  Только проверенные поставщики
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={localFilters.inStock}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ ...prev, inStock: checked === true }))
                  }
                />
                <Label htmlFor="inStock" className="text-sm">
                  Есть в наличии
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="freeDelivery"
                  checked={localFilters.freeDelivery}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ ...prev, freeDelivery: checked === true }))
                  }
                />
                <Label htmlFor="freeDelivery" className="text-sm">
                  Бесплатная доставка
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="installmentAvailable"
                  checked={localFilters.installmentAvailable}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ ...prev, installmentAvailable: checked === true }))
                  }
                />
                <Label htmlFor="installmentAvailable" className="text-sm">
                  Возможна рассрочка
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Сортировка */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#2D4A7C]">
              <ArrowUpDown className="h-5 w-5" />
              <h3 className="font-semibold">Сортировка</h3>
            </div>
            <RadioGroup
              value={localFilters.sortBy}
              onValueChange={(value) => 
                setLocalFilters(prev => ({ ...prev, sortBy: value as SearchFilters['sortBy'] }))
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price_asc" id="price_asc" />
                <Label htmlFor="price_asc" className="text-sm">По цене (возрастание)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price_desc" id="price_desc" />
                <Label htmlFor="price_desc" className="text-sm">По цене (убывание)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="popularity" id="popularity" />
                <Label htmlFor="popularity" className="text-sm">По популярности</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rating" id="rating" />
                <Label htmlFor="rating" className="text-sm">По рейтингу поставщика</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <SheetFooter className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Сбросить
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-[#C93535] text-white hover:bg-[#a82c2c]"
          >
            Применить фильтры
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
