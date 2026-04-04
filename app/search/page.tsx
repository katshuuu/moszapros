"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { useSessionsStore } from '@/lib/sessions-store'
import { categories, roleRecommendations, steItems } from '@/lib/ste-data'
import { SearchInput } from '@/components/search/search-input'
import { SearchFilters } from '@/components/search/search-filters'
import { FiltersPanel, type SearchFilters as FilterSettings, defaultFilters } from '@/components/search/filters-panel'
import { BudgetSuggestions } from '@/components/search/budget-suggestions'
import { SearchResults } from '@/components/search/search-results'
import { RecommendedSection } from '@/components/search/recommended-section'
import { SearchExplanation } from '@/components/search/search-explanation'
import { SessionsComparison } from '@/components/search/sessions-comparison'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, Zap, Clock, RefreshCw, Database, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Тип результата поиска из API
interface APISearchResult {
  ste_id: number
  name: string
  category: string
  description?: string
  priceMin: number
  priceMax: number
  contractCount?: number
  avgPrice?: number
  purchaseCount?: number
  relevanceScore: number
  textScore: number
  personalizationScore: number
  personalizationReasons: string[]
  positionChange: number
  originalPosition: number
  newPosition?: number
  scoreBreakdown: {
    text: number
    typo: number
    synonym: number
    popularity: number
    personalization: number
    itemBoost: number
    categoryBoost: number
  }
  signalStrength: 'strong' | 'medium' | 'weak' | 'none'
}

interface APISearchResponse {
  query: {
    original: string
    corrected: string | null
    stems: string[]
    expanded: string[]
    typoCorrection: {
      original: string
      corrected: string
      wasChanged: boolean
    }
  }
  results: APISearchResult[]
  totalFound: number
  searchTimeMs: number
  source: 'database' | 'fallback' | 'error'
  pipeline?: {
    typoCorrection: { original: string; corrected: string; wasChanged: boolean }
    synonymExpansion: { originalTerms: string[]; expandedTerms: string[]; synonymsUsed: string[] }
    userProfile: { hasHistory: boolean; topCategories: string[]; signalStrength: string }
    rerankingSummary: { totalReranked: number; significantChanges: number; avgPositionChange: number }
    explanationForUser: string
    pipelineTimeMs: number
  }
}

// Преобразование результата API в формат для компонентов
interface SearchResult {
  id: string
  name: string
  category: string
  description: string
  priceMin: number
  priceMax: number
  purchaseCount: number
  relevanceScore: number
  personalizedScore: number
  matchedTerms: string[]
  personalizationFactors: {
    roleBonus: number
    interactionBonus: number
    viewCount: number
    clickCount: number
    purchaseCount: number
    positiveSignals: number
    negativeSignals: number
    explanation: string[]
  }
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const { isAuthenticated, user, addSearchHistory, interactions, addInteraction } = useAuthStore()
  const { saveSession, getSessionsByQuery, getPositionChanges } = useSessionsStore()
  const [query, setQuery] = useState(initialQuery)
  
  // Состояния для API поиска
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchResponse, setSearchResponse] = useState<APISearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dataSource, setDataSource] = useState<'database' | 'fallback' | 'error' | null>(null)
  const searchAbortController = useRef<AbortController | null>(null)
  
  // Обновляем query при изменении URL параметров
  useEffect(() => {
    const urlQuery = searchParams.get('q')
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery)
    }
  }, [searchParams, query])
  
  const [category, setCategory] = useState('Все категории')
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'popularity'>('relevance')
  const [lastInteraction, setLastInteraction] = useState<{ steId: string; type: string } | undefined>()
  const [showExplanation, setShowExplanation] = useState(true)
  const [filters, setFilters] = useState<FilterSettings>(defaultFilters)
  const [selectedItem, setSelectedItem] = useState<{ id: string; price: number; quantity: number } | null>(null)
  const [isReindexing, setIsReindexing] = useState(false)
  const [reindexMessage, setReindexMessage] = useState('')
  const [rankingDataMap, setRankingDataMap] = useState<Record<string, {
    scoreBreakdown: { text: number; typo: number; synonym: number; popularity: number; personalization: number; itemBoost: number; categoryBoost: number }
    positionChange: number
    originalPosition: number
    newPosition: number
    signalStrength: 'strong' | 'medium' | 'weak' | 'none'
    explanations: string[]
  }>>({})
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Выполняем поиск через API
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchResponse(null)
      setDataSource(null)
      return
    }

    // Отменяем предыдущий запрос
    if (searchAbortController.current) {
      searchAbortController.current.abort()
    }
    searchAbortController.current = new AbortController()

    const performAPISearch = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            filters: { category: category !== 'Все категории' ? category : undefined },
            userId: user?.id,
            userINN: user?.inn,
            userRole: user?.role,
            categoryPreferences: user?.categoryPreferences || [],
            contractHistory: user?.contractHistory || [],
            interactions: interactions.map(i => ({
              steId: i.steId,
              type: i.type,
              timestamp: i.timestamp
            })),
            limit: 50
          }),
          signal: searchAbortController.current?.signal
        })

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data: APISearchResponse = await response.json()
        setSearchResponse(data)
        setDataSource(data.source)

        // Преобразуем результаты API в формат компонентов
        const transformedResults: SearchResult[] = data.results.map(item => ({
          id: String(item.ste_id),
          name: item.name,
          category: item.category,
          description: item.description || '',
          priceMin: item.priceMin || 0,
          priceMax: item.priceMax || item.priceMin || 0,
          purchaseCount: item.contractCount || item.purchaseCount || 0,
          relevanceScore: item.relevanceScore,
          personalizedScore: item.relevanceScore + item.personalizationScore,
          matchedTerms: data.query.expanded || [],
          personalizationFactors: {
            roleBonus: item.scoreBreakdown.personalization,
            interactionBonus: item.scoreBreakdown.itemBoost + item.scoreBreakdown.categoryBoost,
            viewCount: 0,
            clickCount: 0,
            purchaseCount: 0,
            positiveSignals: 0,
            negativeSignals: 0,
            explanation: item.personalizationReasons || []
          }
        }))

        setSearchResults(transformedResults)

        // Обновляем карту данных ранжирования
        const newRankingDataMap: Record<string, typeof rankingDataMap[string]> = {}
        data.results.forEach(item => {
          newRankingDataMap[String(item.ste_id)] = {
            scoreBreakdown: item.scoreBreakdown,
            positionChange: item.positionChange,
            originalPosition: item.originalPosition,
            newPosition: item.newPosition || item.originalPosition - item.positionChange,
            signalStrength: item.signalStrength,
            explanations: item.personalizationReasons || []
          }
        })
        setRankingDataMap(newRankingDataMap)

      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('[v0] Search API error:', error)
          setSearchResults([])
          setDataSource('error')
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Дебаунс поиска
    const timer = setTimeout(performAPISearch, 300)
    return () => {
      clearTimeout(timer)
      if (searchAbortController.current) {
        searchAbortController.current.abort()
      }
    }
  }, [query, category, user, interactions])

  // Фильтрация и сортировка результатов
  const sortedResults = (() => {
    let filtered = [...searchResults]
    
    // Применяем фильтры бюджета
    if (filters.maxPricePerUnit) {
      filtered = filtered.filter(item => item.priceMin <= filters.maxPricePerUnit!)
    }
    
    // Фильтр по минимальному бюджету
    if (filters.budgetMin) {
      filtered = filtered.filter(item => item.priceMin >= filters.budgetMin!)
    }
    
    // Фильтр по наличию
    if (filters.inStock) {
      filtered = filtered.filter(item => (item.purchaseCount || 0) > 0)
    }
    
    // Сортировка
    const sortOption = filters.sortBy || sortBy
    switch (sortOption) {
      case 'price_asc':
        filtered.sort((a, b) => a.priceMin - b.priceMin)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.priceMax - a.priceMax)
        break
      case 'popularity':
        filtered.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0))
        break
      default:
        // Уже отсортировано по релевантности
        break
    }
    return filtered
  })()

  // Объяснение ранжирования
  const rankingExplanations = (() => {
    if (!searchResponse || sortedResults.length === 0) return []
    const explanations: string[] = []
    
    // Добавляем объяснение из пайплайна
    if (searchResponse.pipeline?.explanationForUser) {
      explanations.push(searchResponse.pipeline.explanationForUser)
    }
    
    // Топ-3 результата с объяснениями
    sortedResults.slice(0, 3).forEach((result, i) => {
      if (result.personalizationFactors.explanation.length > 0) {
        explanations.push(`#${i + 1} "${result.name}": ${result.personalizationFactors.explanation[0]}`)
      }
    })
    
    return explanations
  })()

  // Данные сессий для сравнения
  const querySessionsForComparison = query.trim() ? getSessionsByQuery(query) : []

  const positionChangesForComparison = query.trim() && sortedResults.length > 0 
    ? getPositionChanges(query, sortedResults) 
    : []

  // Обработчик взаимодействия с товаром
  const handleInteraction = useCallback((steId: string, type: 'view' | 'click' | 'purchase' | 'positive' | 'negative') => {
    addInteraction(steId, type)
    setLastInteraction({ steId, type })
    
    // Показываем анимацию переиндексации
    const item = sortedResults.find(r => r.id === steId)
    if (item) {
      let message = ''
      switch (type) {
        case 'click':
          message = `Просмотр "${item.name}" учтён - похожие товары будут выше`
          break
        case 'purchase':
          message = `Покупка "${item.name}" учтена - рекомендации обновлены`
          break
        case 'positive':
          message = `Положительная оценка учтена - приоритет "${item.name}" повышен`
          break
        case 'negative':
          message = `Отрицательная оценка учтена - приоритет "${item.name}" понижен`
          break
      }
      
      if (message) {
        setReindexMessage(message)
        setIsReindexing(true)
        setTimeout(() => setIsReindexing(false), 3000)
      }
    }
    
    // При клике на товар - показываем подсказки по бюджету
    if (type === 'click' && filters.budgetMax && filters.quantity) {
      if (item) {
        setSelectedItem({
          id: steId,
          price: item.priceMin,
          quantity: filters.quantity
        })
      }
    }
  }, [addInteraction, filters.budgetMax, filters.quantity, sortedResults])

  // Сброс фильтров
  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setSelectedItem(null)
  }, [])

  // Добавление в историю поиска и сохранение сессии (с дебаунсом)
  useEffect(() => {
    if (query.trim() && searchResponse && searchResponse.totalFound > 0) {
      const timer = setTimeout(() => {
        addSearchHistory(query, searchResponse.totalFound)
        // Сохраняем сессию для отслеживания изменений позиций
        saveSession(query, sortedResults, user?.role)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [query, searchResponse, sortedResults, addSearchHistory, saveSession, user?.role])

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
              <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3">
                <Info className="h-5 w-5 shrink-0 text-[#2D4A7C]" />
                <div className="flex-1">
                  <div className="text-sm text-[#1a1a1a]">
                    Результаты персонализированы для: <strong>{user.organization}</strong>
                  </div>
                  {user.inn && (
                    <div className="mt-1 text-xs text-[#666666]">
                      ИНН: <span className="font-mono">{user.inn}</span>
                      {user.region && <span className="ml-2">| {user.region}</span>}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {user.role === 'buyer' && user.contractsCount && (
                    <Badge variant="outline" className="text-xs">
                      {user.contractsCount} контрактов
                    </Badge>
                  )}
                  {user.categoryPreferences && user.categoryPreferences.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Топ категория: {user.categoryPreferences[0].category}
                    </Badge>
                  )}
                  {user.role !== 'buyer' && (
                    <Badge variant="outline" className="text-xs">
                      {user.role === 'office' && 'Офисные товары'}
                      {user.role === 'medical' && 'Медицина'}
                      {user.role === 'construction' && 'Строительство'}
                    </Badge>
                  )}
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
              typoCorrection={searchResponse?.query?.typoCorrection || searchResponse?.pipeline?.typoCorrection}
              synonymExpansion={searchResponse?.pipeline?.synonymExpansion}
            />
            
            <div className="flex flex-wrap items-center gap-3">
              <FiltersPanel
                filters={filters}
                onFiltersChange={setFilters}
                onApply={() => {}}
                onReset={handleResetFilters}
              />
              
              <SearchFilters
                category={category}
                setCategory={setCategory}
                categories={categories}
                sortBy={sortBy}
                setSortBy={setSortBy}
                resultsCount={sortedResults.length}
              />
            </div>
            
            {/* Информация о применённых фильтрах бюджета */}
            {filters.maxPricePerUnit && (
              <div className="flex items-center gap-2 rounded-lg border border-[#C93535]/30 bg-[#C93535]/5 px-4 py-2 text-sm">
                <span className="text-[#666666]">Бюджет:</span>
                <span className="font-semibold text-[#1a1a1a]">{filters.budgetMax?.toLocaleString('ru-RU')} ₽</span>
                <span className="text-[#666666]">на</span>
                <span className="font-semibold text-[#1a1a1a]">{filters.quantity?.toLocaleString('ru-RU')} шт</span>
                <span className="mx-2 text-[#666666]">|</span>
                <span className="text-[#666666]">Макс. цена за ед.:</span>
                <span className="font-bold text-[#C93535]">{filters.maxPricePerUnit.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}

            {/* Информация о поиске */}
            {searchResponse && query.trim() && (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-[#666666]">
                  <Clock className="h-4 w-4" />
                  <span>Поиск за {searchResponse.searchTimeMs.toFixed(1)} мс</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#666666]">
                  <Database className="h-4 w-4" />
                  <span>
                    {dataSource === 'database' 
                      ? `Найдено ${searchResponse.totalFound.toLocaleString('ru-RU')} товаров в БД` 
                      : dataSource === 'fallback' 
                        ? 'Демо-режим (БД не подключена)' 
                        : 'Ошибка поиска'}
                  </span>
                </div>
                {dataSource === 'database' && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    PostgreSQL
                  </Badge>
                )}
              </div>
            )}
            
            {/* Индикатор загрузки */}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-[#666666]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Поиск в базе данных...</span>
              </div>
            )}

            {/* Уведомление о динамической переиндексации */}
            {isReindexing && (
              <Alert className="animate-in fade-in slide-in-from-top-2 border-[#2D4A7C] bg-[#2D4A7C]/10">
                <RefreshCw className="h-4 w-4 animate-spin text-[#2D4A7C]" />
                <AlertDescription className="ml-2 text-[#2D4A7C]">
                  <strong>Динамическая индексация:</strong> {reindexMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Сравнение сессий */}
          {query.trim() && querySessionsForComparison.length >= 2 && (
            <SessionsComparison
              currentQuery={query}
              sessions={querySessionsForComparison}
              positionChanges={positionChangesForComparison}
            />
          )}

          {/* Объяснение персонализации */}
          {query.trim() && showExplanation && rankingExplanations.length > 0 && (
            <SearchExplanation 
              explanations={rankingExplanations}
              onClose={() => setShowExplanation(false)}
            />
          )}

          {query.trim() ? (
            <>
              <SearchResults
                results={sortedResults}
                query={query}
                userRole={user?.role}
                onInteraction={handleInteraction}
                typoCorrection={searchResponse?.query?.typoCorrection || searchResponse?.pipeline?.typoCorrection}
                selectedItemId={selectedItem?.id}
                rankingDataMap={rankingDataMap}
              />
              
              {/* Подсказка "Возможно, Вам понадобится" */}
              {selectedItem && filters.budgetMax && (
                <BudgetSuggestions
                  selectedItemId={selectedItem.id}
                  selectedItemPrice={selectedItem.price}
                  selectedItemQuantity={selectedItem.quantity}
                  totalBudget={filters.budgetMax}
                  userRole={user?.role}
                />
              )}
            </>
          ) : (
            <RecommendedSection items={recommendedItems} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
