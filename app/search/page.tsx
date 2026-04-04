"use client"

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { steItems, categories, synonyms, roleRecommendations, type STEItem } from '@/lib/ste-data'
import { SearchInput } from '@/components/search/search-input'
import { SearchFilters } from '@/components/search/search-filters'
import { SearchResults } from '@/components/search/search-results'
import { RecommendedSection } from '@/components/search/recommended-section'

// Simple fuzzy matching for typo correction
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

// Find corrections for typos
function findCorrection(query: string): string | null {
  const words = query.toLowerCase().split(' ')
  const corrections: string[] = []
  
  const dictionary = [
    'бумага', 'ручка', 'тетрадь', 'принтер', 'монитор', 'компьютер',
    'стол', 'стул', 'шкаф', 'кресло', 'шприц', 'бинт', 'перчатки',
    'маска', 'цемент', 'кирпич', 'краска', 'песок', 'арматура',
    'канцелярия', 'мебель', 'медицинское', 'строительные', 'офисные'
  ]
  
  for (const word of words) {
    if (word.length < 3) {
      corrections.push(word)
      continue
    }
    
    let bestMatch = word
    let bestDistance = 3
    
    for (const dictWord of dictionary) {
      const distance = levenshteinDistance(word, dictWord)
      if (distance < bestDistance && distance > 0) {
        bestMatch = dictWord
        bestDistance = distance
      }
    }
    
    corrections.push(bestMatch)
  }
  
  const corrected = corrections.join(' ')
  return corrected !== query.toLowerCase() ? corrected : null
}

// Expand query with synonyms
function expandWithSynonyms(query: string): string[] {
  const words = query.toLowerCase().split(' ')
  const expanded: Set<string> = new Set(words)
  
  for (const word of words) {
    for (const [term, syns] of Object.entries(synonyms)) {
      if (word === term || syns.includes(word)) {
        expanded.add(term)
        syns.forEach(s => expanded.add(s))
      }
    }
  }
  
  return Array.from(expanded)
}

// Search function with hybrid matching
function searchSTE(
  query: string,
  category: string,
  userRole: string | undefined,
  interactions: { steId: string; weight: number }[]
): { items: STEItem[]; correction: string | null; synonymsUsed: string[] } {
  const correction = findCorrection(query)
  const searchQuery = correction || query
  const expandedTerms = expandWithSynonyms(searchQuery)
  const synonymsUsed = expandedTerms.filter(t => !searchQuery.toLowerCase().includes(t))
  
  let results = steItems.filter(item => {
    // Category filter
    if (category !== 'Все категории' && item.category !== category) {
      return false
    }
    
    // Text search
    const searchText = `${item.name} ${item.description} ${item.category}`.toLowerCase()
    return expandedTerms.some(term => searchText.includes(term))
  })
  
  // Calculate relevance scores
  results = results.map(item => {
    const searchText = `${item.name} ${item.description}`.toLowerCase()
    
    // Base relevance score
    let relevanceScore = 0
    expandedTerms.forEach(term => {
      if (item.name.toLowerCase().includes(term)) {
        relevanceScore += 10
      }
      if (item.description.toLowerCase().includes(term)) {
        relevanceScore += 5
      }
    })
    
    // Personalization score based on user role
    let personalizedScore = 0
    if (userRole && roleRecommendations[userRole]?.includes(item.id)) {
      personalizedScore += 20
    }
    
    // Score from user interactions
    const userInteractions = interactions.filter(i => i.steId === item.id)
    const interactionScore = userInteractions.reduce((acc, i) => acc + i.weight * 10, 0)
    personalizedScore += interactionScore
    
    // Purchase count bonus
    const popularityScore = Math.log10((item.purchaseCount || 1) + 1) * 2
    
    return {
      ...item,
      relevanceScore: relevanceScore + popularityScore,
      personalizedScore: relevanceScore + personalizedScore + popularityScore
    }
  })
  
  // Sort by personalized score
  results.sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0))
  
  return { items: results, correction, synonymsUsed }
}

export default function SearchPage() {
  const router = useRouter()
  const { isAuthenticated, user, addSearchHistory, interactions } = useAuthStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Все категории')
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'popularity'>('relevance')
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const interactionWeights = useMemo(() => 
    interactions.map(i => ({ steId: i.steId, weight: i.weight })),
    [interactions]
  )

  const { items: searchResults, correction, synonymsUsed } = useMemo(() => {
    if (!query.trim()) {
      return { items: [], correction: null, synonymsUsed: [] }
    }
    return searchSTE(query, category, user?.role, interactionWeights)
  }, [query, category, user?.role, interactionWeights])

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...searchResults]
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
        // Already sorted by relevance
        break
    }
    return sorted
  }, [searchResults, sortBy])

  // Add to search history
  useEffect(() => {
    if (query.trim() && searchResults.length > 0) {
      const timer = setTimeout(() => {
        addSearchHistory(query, searchResults.length)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [query, searchResults.length, addSearchHistory])

  // Get recommended items based on role
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
            <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              Поиск СТЕ
            </h1>
            <p className="text-muted-foreground">
              Введите название товара или код СТЕ для поиска
            </p>
          </div>

          <div className="mb-6 space-y-4">
            <SearchInput
              value={query}
              onChange={setQuery}
              correction={correction}
              synonymsUsed={synonymsUsed}
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

          {query.trim() ? (
            <SearchResults
              results={sortedResults}
              query={query}
              userRole={user?.role}
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
