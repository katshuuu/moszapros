/**
 * Персонализированный Reranker
 * 
 * Пайплайн: Retrieval → Typo Correction → Synonym Expansion → Rerank
 * 
 * Использует граф связей для переранжирования результатов
 */

import { 
  UserProfile, 
  calculatePersonalizationBoost,
  SIGNAL_WEIGHTS
} from './behavioral-signals'

export interface RetrievalResult {
  steId: number
  name: string
  category: string
  textScore: number // базовый скор от retrieval
  contractCount: number
  avgPrice: number
  minPrice: number
  maxPrice: number
}

export interface RankedResult extends RetrievalResult {
  // Итоговые скоры
  finalScore: number
  originalPosition: number
  newPosition: number
  positionChange: number
  
  // Разбивка скора для объяснения
  scoreBreakdown: {
    textScore: number           // Совпадение текста (0-40)
    typoBonus: number           // Бонус за исправление опечатки (0-5)
    synonymBonus: number        // Бонус за расширение синонимами (0-10)
    popularityScore: number     // Популярность товара (0-15)
    personalizationScore: number // Персонализация (0-35)
    itemBoost: number           // Прямой буст от истории с товаром
    categoryBoost: number       // Буст от категории
  }
  
  // Объяснения для пользователя
  explanations: string[]
  
  // Факторы персонализации (для карточки)
  personalizationFactors: {
    isInHistory: boolean
    purchaseCount: number
    categoryRank: number
    signalStrength: 'strong' | 'medium' | 'weak' | 'none'
  }
}

export interface RerankerConfig {
  weights: {
    text: number        // Вес текстового совпадения
    typo: number        // Вес исправления опечаток
    synonym: number     // Вес расширения синонимами
    popularity: number  // Вес популярности
    personalization: number // Вес персонализации
  }
  maxBoost: number      // Максимальный буст от персонализации
  decayEnabled: boolean // Использовать decay по времени
}

// Конфигурация по умолчанию
export const DEFAULT_RERANKER_CONFIG: RerankerConfig = {
  weights: {
    text: 0.35,           // 35% - текстовое совпадение
    typo: 0.05,           // 5% - исправление опечаток
    synonym: 0.10,        // 10% - расширение синонимами
    popularity: 0.15,     // 15% - популярность
    personalization: 0.35 // 35% - персонализация
  },
  maxBoost: 35,
  decayEnabled: true
}

/**
 * Выполняет персонализированное переранжирование результатов
 */
export function rerank(
  results: RetrievalResult[],
  userProfile: UserProfile | null,
  queryInfo: {
    originalQuery: string
    correctedQuery: string | null
    synonymsUsed: string[]
    matchedSynonyms: Map<number, string[]> // steId → найденные синонимы
  },
  config: RerankerConfig = DEFAULT_RERANKER_CONFIG
): RankedResult[] {
  
  // Нормализация текстовых скоров (0-100)
  const maxTextScore = Math.max(...results.map(r => r.textScore), 1)
  
  // Нормализация популярности
  const maxContracts = Math.max(...results.map(r => r.contractCount), 1)
  
  const rankedResults: RankedResult[] = results.map((result, originalIndex) => {
    // 1. Нормализованный текстовый скор
    const normalizedTextScore = (result.textScore / maxTextScore) * 40
    
    // 2. Бонус за исправление опечатки
    const typoBonus = queryInfo.correctedQuery ? 5 : 0
    
    // 3. Бонус за совпадение с синонимами
    const matchedSyns = queryInfo.matchedSynonyms.get(result.steId) || []
    const synonymBonus = Math.min(matchedSyns.length * 3, 10)
    
    // 4. Скор популярности (логарифмический)
    const popularityScore = Math.log10(result.contractCount + 1) / Math.log10(maxContracts + 1) * 15
    
    // 5. Персонализация
    let personalizationScore = 0
    let itemBoost = 0
    let categoryBoost = 0
    const explanations: string[] = []
    let isInHistory = false
    let purchaseCount = 0
    let categoryRank = -1
    let signalStrength: 'strong' | 'medium' | 'weak' | 'none' = 'none'
    
    if (userProfile) {
      const boost = calculatePersonalizationBoost(
        result.steId,
        result.category,
        userProfile
      )
      
      itemBoost = boost.itemBoost
      categoryBoost = boost.categoryBoost
      personalizationScore = Math.min(boost.totalBoost, config.maxBoost)
      explanations.push(...boost.explanations)
      
      // Определяем силу сигнала
      isInHistory = userProfile.itemWeights.has(result.steId)
      const freqItem = userProfile.frequentItems.find(f => f.steId === result.steId)
      purchaseCount = freqItem?.count || 0
      categoryRank = userProfile.topCategories.findIndex(c => c.category === result.category)
      
      if (purchaseCount > 3 || itemBoost > 20) {
        signalStrength = 'strong'
      } else if (purchaseCount > 0 || itemBoost > 10 || categoryRank < 3) {
        signalStrength = 'medium'
      } else if (categoryBoost > 5) {
        signalStrength = 'weak'
      }
    }
    
    // Добавляем объяснения для typo и synonyms
    if (typoBonus > 0) {
      explanations.push(`Исправлена опечатка: "${queryInfo.originalQuery}" → "${queryInfo.correctedQuery}"`)
    }
    if (synonymBonus > 0 && matchedSyns.length > 0) {
      explanations.push(`Найдено по синонимам: ${matchedSyns.slice(0, 3).join(', ')}`)
    }
    if (popularityScore > 10) {
      explanations.push(`Популярный товар: ${result.contractCount} контрактов`)
    }
    
    // Итоговый скор с весами
    const finalScore = 
      normalizedTextScore * config.weights.text +
      typoBonus * config.weights.typo +
      synonymBonus * config.weights.synonym +
      popularityScore * config.weights.popularity +
      personalizationScore * config.weights.personalization
    
    return {
      ...result,
      finalScore,
      originalPosition: originalIndex + 1,
      newPosition: 0, // будет установлено после сортировки
      positionChange: 0,
      scoreBreakdown: {
        textScore: normalizedTextScore,
        typoBonus,
        synonymBonus,
        popularityScore,
        personalizationScore,
        itemBoost,
        categoryBoost
      },
      explanations,
      personalizationFactors: {
        isInHistory,
        purchaseCount,
        categoryRank,
        signalStrength
      }
    }
  })
  
  // Сортируем по финальному скору
  rankedResults.sort((a, b) => b.finalScore - a.finalScore)
  
  // Устанавливаем новые позиции и изменения
  rankedResults.forEach((result, newIndex) => {
    result.newPosition = newIndex + 1
    result.positionChange = result.originalPosition - result.newPosition
  })
  
  return rankedResults
}

/**
 * Генерирует человекопонятное объяснение ранжирования
 */
export function generateRankingExplanation(result: RankedResult): string {
  const { scoreBreakdown, originalPosition, newPosition, positionChange } = result
  
  const parts: string[] = []
  
  // Основной фактор
  const factors = [
    { name: 'Совпадение запроса', score: scoreBreakdown.textScore },
    { name: 'Персонализация', score: scoreBreakdown.personalizationScore },
    { name: 'Популярность', score: scoreBreakdown.popularityScore },
    { name: 'Синонимы', score: scoreBreakdown.synonymBonus },
  ].sort((a, b) => b.score - a.score)
  
  const topFactor = factors[0]
  if (topFactor.score > 0) {
    parts.push(`Главный фактор: ${topFactor.name} (${topFactor.score.toFixed(0)} баллов)`)
  }
  
  // Изменение позиции
  if (positionChange > 0) {
    parts.push(`Поднялся на ${positionChange} позиций благодаря вашему профилю`)
  } else if (positionChange < 0) {
    parts.push(`Опустился на ${Math.abs(positionChange)} позиций`)
  }
  
  return parts.join('. ')
}

/**
 * Создает сводку по изменению позиций для пользователя
 */
export function createPositionChangeSummary(
  results: RankedResult[]
): {
  improved: number
  unchanged: number
  decreased: number
  topChanges: { name: string; from: number; to: number; reason: string }[]
} {
  let improved = 0
  let unchanged = 0
  let decreased = 0
  
  const topChanges: { name: string; from: number; to: number; reason: string }[] = []
  
  for (const result of results) {
    if (result.positionChange > 0) {
      improved++
      if (result.positionChange >= 5 && topChanges.length < 3) {
        const reason = result.explanations[0] || 'Персонализация'
        topChanges.push({
          name: result.name,
          from: result.originalPosition,
          to: result.newPosition,
          reason
        })
      }
    } else if (result.positionChange < 0) {
      decreased++
    } else {
      unchanged++
    }
  }
  
  return { improved, unchanged, decreased, topChanges }
}
