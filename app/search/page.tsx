"use client"

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { steItems, categories, roleRecommendations } from '@/lib/ste-data'
import { performSearch, explainRankingChanges, type SearchResponse, type SearchResult } from '@/lib/search-engine'
import { SearchInput } from '@/components/search/search-input'
import { SearchFilters } from '@/components/search/search-filters'
import { SearchResults } from '@/components/search/search-results'
import { RecommendedSection } from '@/components/search/recommended-section'
import { SearchExplanation } from '@/components/search/search-explanation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, Zap, Clock } from 'lucide-react'

export default function SearchPage() {
  const router = useRouter()
  const { isAuthenticated, user, addSearchHistory, interactions, addInteraction } = useAuthStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Все категории')
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'popularity'>('relevance')
  const [lastInteraction, setLastInteraction] = useState<{ steId: string; type: string } | undefined>()
  const [showExplanation, setShowExplanation] = useState(true)
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Выполняем поиск с использованием нового движка
  const searchResponse: SearchResponse | null = useMemo(() => {
    if (!query.trim()) {
      return null
    }
    return performSearch(query, category, user?.role, interactions)
  }, [query, category, user?.role, interactions])

  // Сортировка результатов
  const sortedResults = useMemo(() => {
    if (!searchResponse) return []
    
    const sorted = [...searchResponse.results]
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.priceMin - b.priceMin)
        break
      case 'price_desc':
        sorted.sort((a, b) => b.priceMax - a.priceMax)
        break
      case 'popularity':
        sorted.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0))
        break
      default:
        // Уже отсортировано по релевантности
        break
    }
    return sorted
  }, [searchResponse, sortBy])

  // Объяснение ранжирования
  const rankingExplanations = useMemo(() => {
    if (!searchResponse || sortedResults.length === 0) return []
    return explainRankingChanges(sortedResults, query, lastInteraction)
  }, [searchResponse, sortedResults, query, lastInteraction])

  // Обработчик взаимодействия с товаром
  const handleInteraction = useCallback((steId: string, type: 'view' | 'click' | 'purchase' | 'positive' | 'negative') => {
    addInteraction(steId, type)
    setLastInteraction({ steId, type })
  }, [addInteraction])

  // Добавление в историю поиска (с дебаунсом)
  useEffect(() => {
    if (query.trim() && searchResponse && searchResponse.totalFound > 0) {
      const timer = setTimeout(() => {
        addSearchHistory(query, searchResponse.totalFound)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [query, searchResponse, addSearchHistory])

  // Получаем рекомендуемые товары на основе роли
  const recommendedItems = useMemo(() => {
    if (!user?.role) return []
    const recommendedIds = roleRecommendations[user.role] || []
    return steItems
      .filter(item => recommendedIds.includes(item.id))
      .slice(0, 6)
  }, [user?.role])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#f5f5f5] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a] md:text-3xl">
              Поиск СТЕ
            </h1>
            <p className="text-[#666666]">
              Введите название товара или код СТЕ для персонализированного поиска
            </p>
          </div>

          {/* Информация о персонализации */}
          {user && (
            <Card className="mb-6 border-[#2D4A7C]/20 bg-[#2D4A7C]/5">
              <CardContent className="flex items-center gap-3 py-3">
                <Info className="h-5 w-5 text-[#2D4A7C]" />
                <div className="flex-1">
                  <span className="text-sm text-[#1a1a1a]">
                    Результаты персонализированы для: <strong>{user.organization}</strong>
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {user.role === 'office' && 'Офисные товары'}
                    {user.role === 'medical' && 'Медицина'}
                    {user.role === 'construction' && 'Строительство'}
                  </Badge>
                </div>
                {interactions.length > 0 && (
                  <span className="text-xs text-[#666666]">
                    {interactions.length} взаимодействий учтено
                  </span>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mb-6 space-y-4">
            <SearchInput
              value={query}
              onChange={setQuery}
              typoCorrection={searchResponse?.typoCorrection}
              synonymExpansion={searchResponse?.synonymExpansion}
            />
            
            <SearchFilters
              category={category}
              setCategory={setCategory}
              categories={categories}
              sortBy={sortBy}
              setSortBy={setSortBy}
              resultsCount={sortedResults.length}
            />

            {/* Информация о поиске */}
            {searchResponse && query.trim() && (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-[#666666]">
                  <Clock className="h-4 w-4" />
                  <span>Поиск за {searchResponse.searchTimeMs.toFixed(1)} мс</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#666666]">
                  <Zap className="h-4 w-4" />
                  <span>Локальный морфологический анализ</span>
                </div>
              </div>
            )}
          </div>

          {/* Объяснение персонализации */}
          {query.trim() && showExplanation && rankingExplanations.length > 0 && (
            <SearchExplanation 
              explanations={rankingExplanations}
              onClose={() => setShowExplanation(false)}
            />
          )}

          {query.trim() ? (
            <SearchResults
              results={sortedResults}
              query={query}
              userRole={user?.role}
              onInteraction={handleInteraction}
              typoCorrection={searchResponse?.typoCorrection}
            />
          ) : (
            <RecommendedSection items={recommendedItems} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
