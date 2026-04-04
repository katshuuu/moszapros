"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SearchFiltersProps {
  category: string
  setCategory: (category: string) => void
  categories: string[]
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'popularity'
  setSortBy: (sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'popularity') => void
  resultsCount: number
}

export function SearchFilters({
  category,
  setCategory,
  categories,
  sortBy,
  setSortBy,
  resultsCount
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Категория:</span>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Сортировка:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">По релевантности</SelectItem>
              <SelectItem value="price_asc">Цена: по возрастанию</SelectItem>
              <SelectItem value="price_desc">Цена: по убыванию</SelectItem>
              <SelectItem value="popularity">По популярности</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {resultsCount > 0 && (
        <div className="text-sm text-muted-foreground">
          Найдено: <span className="font-medium text-foreground">{resultsCount}</span> позиций
        </div>
      )}
    </div>
  )
}
