/**
 * Сервис рекомендаций - объединяет все ML модули
 * ГА → RL → LSTM pipeline для оптимального ранжирования
 */

import { GeneticAlgorithm, UserProfile, Product } from './genetic-algorithm'
import { ReinforcementLearning, RLProduct } from './reinforcement-learning'
import { LSTMRanker, RankingProduct, UserContext, RankedProduct } from './lstm-ranker'

export interface SearchRequest {
  query: string
  userId?: string
  userINN?: string
  userRole?: string
  categoryPreferences?: { category: string; count: number; totalSpent: number }[]
  contractHistory?: { steId: number; steName: string; category: string; count: number }[]
  interactions?: { steId: string; type: string; timestamp: Date }[]
  filters?: {
    minPrice?: number
    maxPrice?: number
    categories?: string[]
  }
}

export interface SearchResult {
  ste_id: number
  name: string
  category: string
  avgPrice?: number
  minPrice?: number
  maxPrice?: number
  contractCount?: number
  textScore: number
}

export interface OptimizedSearchResponse {
  results: RankedProduct[]
  meta: {
    totalFound: number
    gaCategories: string[]
    gaFitness: number
    rlTotalReward: number
    searchTimeMs: number
    optimizationSteps: string[]
  }
}

export class RecommendationService {
  private ga: GeneticAlgorithm
  private rl: ReinforcementLearning
  private lstm: LSTMRanker

  constructor() {
    this.ga = new GeneticAlgorithm(30, 10, 0.15, 5)
    this.rl = new ReinforcementLearning(0.1, 0.9, 0.15)
    this.lstm = new LSTMRanker()
  }

  /**
   * Основной метод оптимизации поиска
   */
  async optimizeSearch(
    baseResults: SearchResult[],
    request: SearchRequest,
    allCategories: string[]
  ): Promise<OptimizedSearchResponse> {
    const startTime = Date.now()
    const optimizationSteps: string[] = []

    // 1. Подготовка профиля пользователя
    const userProfile: UserProfile = {
      inn: request.userINN,
      preferredCategories: request.categoryPreferences?.map(cp => cp.category) || [],
      purchaseHistory: request.contractHistory?.map(ch => ({
        steId: ch.steId,
        category: ch.category,
        count: ch.count
      })) || [],
      minPrice: request.filters?.minPrice,
      maxPrice: request.filters?.maxPrice
    }

    // Если нет истории - пропускаем оптимизацию
    if (userProfile.purchaseHistory.length === 0 && userProfile.preferredCategories.length === 0) {
      optimizationSteps.push('Пропуск персонализации: нет истории пользователя')
      
      // Базовое ранжирование по LSTM без персонализации
      const userContext: UserContext = {
        inn: request.userINN,
        categoryPreferences: [],
        contractHistory: [],
        recentInteractions: [],
        sessionViews: []
      }

      const ranked = this.lstm.rank(
        baseResults.map(r => ({ ...r, textScore: r.textScore })),
        userContext
      )

      return {
        results: ranked,
        meta: {
          totalFound: ranked.length,
          gaCategories: [],
          gaFitness: 0,
          rlTotalReward: 0,
          searchTimeMs: Date.now() - startTime,
          optimizationSteps
        }
      }
    }

    // 2. Генетический алгоритм: оптимизация графа категорий
    optimizationSteps.push('ГА: Формирование графа категорий')
    
    const products: Product[] = baseResults.map(r => ({
      ste_id: r.ste_id,
      name: r.name,
      category: r.category,
      price: r.avgPrice,
      contractCount: r.contractCount
    }))

    const gaResult = this.ga.evolve(userProfile, products, allCategories)
    optimizationSteps.push(`ГА: Найден граф из ${gaResult.bestCategories.length} категорий (fitness=${gaResult.fitness.toFixed(2)})`)

    // 3. Фильтрация результатов по графу категорий (с сохранением остальных)
    const inGraphResults = baseResults.filter(r => 
      gaResult.bestCategories.includes(r.category)
    )
    const outGraphResults = baseResults.filter(r => 
      !gaResult.bestCategories.includes(r.category)
    )

    // 4. Reinforcement Learning: оптимизация комбинации товаров
    optimizationSteps.push('RL: Оптимизация комбинации товаров')

    const rlProducts: RLProduct[] = inGraphResults.map(r => ({
      ste_id: r.ste_id,
      name: r.name,
      category: r.category,
      price: r.avgPrice,
      relevance: r.textScore,
      contractCount: r.contractCount
    }))

    const rlResult = this.rl.generateCombination(
      rlProducts,
      userProfile.preferredCategories,
      Math.min(inGraphResults.length, 20),
      5
    )
    optimizationSteps.push(`RL: Сформирована комбинация из ${rlResult.products.length} товаров (reward=${rlResult.totalReward.toFixed(2)})`)

    // 5. Подготовка контекста для LSTM
    const userContext: UserContext = {
      inn: request.userINN,
      categoryPreferences: request.categoryPreferences || [],
      contractHistory: request.contractHistory?.map(ch => ({
        steId: ch.steId,
        category: ch.category,
        count: ch.count
      })) || [],
      recentInteractions: request.interactions?.map(i => ({
        steId: parseInt(i.steId),
        type: i.type,
        timestamp: new Date(i.timestamp)
      })) || [],
      sessionViews: []
    }

    // 6. LSTM ранжирование
    optimizationSteps.push('LSTM: Финальное ранжирование')

    // Объединяем результаты: сначала из графа, потом остальные
    const combinedResults: RankingProduct[] = [
      ...rlResult.products.map(p => {
        const original = baseResults.find(r => r.ste_id === p.ste_id)
        return {
          ste_id: p.ste_id,
          name: p.name,
          category: p.category,
          avgPrice: original?.avgPrice,
          minPrice: original?.minPrice,
          maxPrice: original?.maxPrice,
          contractCount: p.contractCount,
          textScore: original?.textScore || 0
        }
      }),
      ...outGraphResults.map(r => ({
        ste_id: r.ste_id,
        name: r.name,
        category: r.category,
        avgPrice: r.avgPrice,
        minPrice: r.minPrice,
        maxPrice: r.maxPrice,
        contractCount: r.contractCount,
        textScore: r.textScore
      }))
    ]

    // Убираем дубликаты
    const uniqueResults = combinedResults.filter((r, idx) => 
      combinedResults.findIndex(x => x.ste_id === r.ste_id) === idx
    )

    const ranked = this.lstm.rank(uniqueResults, userContext)
    optimizationSteps.push(`LSTM: Отранжировано ${ranked.length} товаров`)

    const searchTimeMs = Date.now() - startTime
    optimizationSteps.push(`Общее время оптимизации: ${searchTimeMs}мс`)

    return {
      results: ranked,
      meta: {
        totalFound: ranked.length,
        gaCategories: gaResult.bestCategories,
        gaFitness: gaResult.fitness,
        rlTotalReward: rlResult.totalReward,
        searchTimeMs,
        optimizationSteps
      }
    }
  }

  /**
   * Обновить модели на основе feedback
   */
  updateFromFeedback(feedback: {
    clicked: number[]
    purchased: number[]
    ignored: number[]
  }): void {
    this.lstm.updateWeights(feedback)
  }

  /**
   * Получить статистику моделей
   */
  getStats(): {
    rl: { states: number; entries: number }
    lstm: { weights: Record<string, number> }
  } {
    return {
      rl: this.rl.getStats(),
      lstm: { weights: this.lstm.getWeights() as unknown as Record<string, number> }
    }
  }

  /**
   * Сбросить обучение
   */
  reset(): void {
    this.rl.reset()
  }
}

export const recommendationService = new RecommendationService()
