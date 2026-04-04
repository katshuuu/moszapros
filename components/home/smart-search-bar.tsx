"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, TrendingUp, X } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { steItems, categories, synonyms } from '@/lib/ste-data'
import { correctTypos, russianStem } from '@/lib/search-engine'

interface Suggestion {
  type: 'history' | 'category' | 'product' | 'trending' | 'correction' | 'synonym'
  text: string
  icon?: React.ReactNode
  steId?: string
  subtext?: string
}

export function SmartSearchBar() {
  const router = useRouter()
  const { isAuthenticated, searchHistory } = useAuthStore()
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Популярные запросы (тренды)
  const trendingQueries = [
    'Бумага для принтера',
    'Канцелярские товары',
    'Медицинские перчатки',
    'Строительные материалы',
    'Офисная мебель'
  ]

  // Генерация подсказок на основе ввода
  const generateSuggestions = useCallback((searchQuery: string): Suggestion[] => {
    const results: Suggestion[] = []
    const lowerQuery = searchQuery.toLowerCase().trim()

    if (!lowerQuery) {
      // Показываем историю поиска
      const recentSearches = searchHistory.slice(0, 5).map(item => ({
        type: 'history' as const,
        text: item.query,
        icon: <Clock className="h-4 w-4 text-[#666666]" />,
        subtext: `${item.resultsCount} результатов`
      }))
      
      if (recentSearches.length > 0) {
        results.push(...recentSearches)
      }
      
      // Добавляем популярные запросы
      const trending = trendingQueries.slice(0, 3).map(q => ({
        type: 'trending' as const,
        text: q,
        icon: <TrendingUp className="h-4 w-4 text-[#C93535]" />
      }))
      results.push(...trending)
      
      return results
    }

    // 1. Проверяем на опечатки
    const typoCorrection = correctTypos(lowerQuery)
    if (typoCorrection.wasChanged) {
      results.push({
        type: 'correction' as const,
        text: typoCorrection.corrected,
        subtext: `Возможно, вы имели в виду`,
        icon: <Search className="h-4 w-4 text-[#C93535]" />
      })
    }

    // 2. Поиск по синонимам
    const queryStem = russianStem(lowerQuery.split(' ')[0])
    for (const [term, syns] of Object.entries(synonyms)) {
      const termStem = russianStem(term)
      if (termStem === queryStem || syns.some(s => russianStem(s) === queryStem)) {
        // Добавляем основной термин и синонимы как подсказки
        if (term.toLowerCase() !== lowerQuery) {
          results.push({
            type: 'synonym' as const,
            text: term,
            subtext: `Синоним: ${syns.slice(0, 2).join(', ')}`,
            icon: <Search className="h-4 w-4 text-[#2D4A7C]" />
          })
        }
        break
      }
    }

    // 3. Поиск по категориям
    const matchingCategories = categories
      .filter(cat => cat.toLowerCase().includes(lowerQuery))
      .slice(0, 2)
      .map(cat => ({
        type: 'category' as const,
        text: cat,
        subtext: 'Категория',
        icon: <Search className="h-4 w-4 text-[#2D4A7C]" />
      }))
    results.push(...matchingCategories)

    // 4. Морфологический поиск по товарам
    const matchingProducts = steItems
      .filter(ste => {
        const nameStem = ste.name.toLowerCase().split(' ').map(russianStem)
        const descStem = ste.description.toLowerCase().split(' ').map(russianStem)
        return ste.name.toLowerCase().includes(lowerQuery) ||
          ste.description.toLowerCase().includes(lowerQuery) ||
          (ste.code && ste.code.toLowerCase().includes(lowerQuery)) ||
          nameStem.includes(queryStem) ||
          descStem.includes(queryStem)
      })
      .slice(0, 5)
      .map(ste => ({
        type: 'product' as const,
        text: ste.name,
        subtext: `${ste.category} • ${ste.priceMin.toLocaleString('ru-RU')} ₽`,
        steId: ste.id,
        icon: <Search className="h-4 w-4 text-[#666666]" />
      }))
    results.push(...matchingProducts)

    // 5. Поиск по истории
    const matchingHistory = searchHistory
      .filter(item => item.query.toLowerCase().includes(lowerQuery))
      .slice(0, 2)
      .map(item => ({
        type: 'history' as const,
        text: item.query,
        subtext: `${item.resultsCount} результатов`,
        icon: <Clock className="h-4 w-4 text-[#666666]" />
      }))
    
    // Добавляем историю в начало
    return [...matchingHistory, ...results].slice(0, 10)
  }, [searchHistory])

  // Обновление подсказок при изменении запроса
  useEffect(() => {
    if (isFocused) {
      setSuggestions(generateSuggestions(query))
      setSelectedIndex(-1)
    }
  }, [query, isFocused, generateSuggestions])

  // Обработка клика вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Обработка клавиатуры
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex])
      } else {
        handleSearch()
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false)
    }
  }

  // Выбор подсказки
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.text)
    setIsFocused(false)
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    router.push(`/search?q=${encodeURIComponent(suggestion.text)}`)
  }

  // Поиск
  const handleSearch = () => {
    if (!query.trim()) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const showDropdown = isFocused && suggestions.length > 0

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Поисковая строка */}
      <div className="flex overflow-hidden rounded-lg shadow-lg">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Введите название категории, товара или ID СТЕ"
          className="flex-1 bg-[#E8ECF0] px-5 py-4 text-base text-[#1a1a1a] placeholder-[#666666] outline-none transition-colors focus:bg-[#dce0e5]"
        />
        <button
          onClick={handleSearch}
          className="flex items-center justify-center bg-[#C93535] px-6 text-white transition-colors hover:bg-[#B02E2E]"
          aria-label="Поиск"
        >
          <Search className="h-6 w-6" />
        </button>
      </div>

      {/* Выпадающий список подсказок */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[#e0e0e0] bg-white shadow-xl"
        >
          {/* Заголовок секции истории */}
          {query.trim() === '' && searchHistory.length > 0 && (
            <div className="flex items-center justify-between border-b border-[#e0e0e0] bg-[#f5f5f5] px-4 py-2">
              <span className="text-xs font-medium text-[#666666]">Недавние запросы</span>
            </div>
          )}
          
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => {
              const isHistory = suggestion.type === 'history'
              const isTrending = suggestion.type === 'trending'
              const isSelected = index === selectedIndex
              
              // Разделитель между историей и трендами
              const showTrendingHeader = 
                isTrending && 
                index > 0 && 
                suggestions[index - 1]?.type === 'history' &&
                query.trim() === ''

              return (
                <li key={`${suggestion.type}-${index}`}>
                  {showTrendingHeader && (
                    <div className="border-t border-[#e0e0e0] bg-[#f5f5f5] px-4 py-2">
                      <span className="text-xs font-medium text-[#666666]">Популярные запросы</span>
                    </div>
                  )}
                  <button
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected 
                        ? 'bg-[#EDF1F7]' 
                        : 'hover:bg-[#f5f5f5]'
                    }`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {suggestion.icon}
                    <div className="flex-1">
                      <span className="block text-sm text-[#1a1a1a]">
                        {suggestion.text}
                      </span>
                      {suggestion.subtext && (
                        <span className="block text-xs text-[#666666]">
                          {suggestion.subtext}
                        </span>
                      )}
                    </div>
                    {isHistory && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Можно добавить удаление из истории
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                          }
                        }}
                        className="rounded p-1 text-[#999999] hover:bg-[#e0e0e0] hover:text-[#666666]"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    {isTrending && (
                      <span className="rounded bg-[#C93535]/10 px-2 py-0.5 text-xs text-[#C93535]">
                        популярно
                      </span>
                    )}
                    {suggestion.type === 'correction' && (
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                        исправление
                      </span>
                    )}
                    {suggestion.type === 'synonym' && (
                      <span className="rounded bg-[#2D4A7C]/10 px-2 py-0.5 text-xs text-[#2D4A7C]">
                        синоним
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          
          {/* Подсказка для неавторизованных */}
          {!isAuthenticated && (
            <div className="border-t border-[#e0e0e0] bg-[#FFF9E6] px-4 py-2 text-center text-xs text-[#8B6914]">
              Войдите для доступа к персонализированному поиску
            </div>
          )}
        </div>
      )}
    </div>
  )
}
