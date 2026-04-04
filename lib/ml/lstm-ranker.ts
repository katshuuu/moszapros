/**
 * LSTM-подобное ранжирование товаров
 * Упрощённая реализация без TensorFlow для быстрой работы
 * Использует взвешенную комбинацию признаков с временным контекстом
 */

export interface RankingProduct {
  ste_id: number
  name: string
  category: string
  price?: number
  avgPrice?: number
  minPrice?: number
  maxPrice?: number
  contractCount?: number
  relevance?: number
  textScore?: number
}

export interface UserContext {
  inn?: string
  categoryPreferences: { category: string; count: number; totalSpent: number }[]
  contractHistory: { steId: number; category: string; count: number }[]
  recentInteractions: { steId: number; type: string; timestamp: Date }[]
  sessionViews: number[]
}

export interface RankingWeights {
  textRelevance: number
  categoryMatch: number
  historyMatch: number
  popularity: number
  priceOptimality: number
  recency: number
  sessionContext: number
}

export interface RankedProduct extends RankingProduct {
  finalScore: number
  scoreBreakdown: {
    textScore: number
    categoryScore: number
    historyScore: number
    popularityScore: number
    priceScore: number
    recencyScore: number
    sessionScore: number
  }
  rankingReasons: string[]
}

export class LSTMRanker {
  private weights: RankingWeights
  private hiddenState: number[] // "Память" LSTM
  private cellState: number[]
  private sequenceLength: number

  constructor() {
    // Веса для комбинации признаков
    this.weights = {
      textRelevance: 0.25,
      categoryMatch: 0.20,
      historyMatch: 0.20,
      popularity: 0.15,
      priceOptimality: 0.10,
      recency: 0.05,
      sessionContext: 0.05
    }

    // Инициализация "памяти" LSTM
    this.hiddenState = []
    this.cellState = []
    this.sequenceLength = 10
  }

  /**
   * Сигмоидная функция активации
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))))
  }

  /**
   * Tanh функция активации
   */
  private tanh(x: number): number {
    return Math.tanh(x)
  }

  /**
   * Нормализация значения в диапазон [0, 1]
   */
  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5
    return Math.max(0, Math.min(1, (value - min) / (max - min)))
  }

  /**
   * Извлечь признаки товара
   */
  private extractFeatures(
    product: RankingProduct,
    userContext: UserContext,
    allProducts: RankingProduct[]
  ): number[] {
    const features: number[] = []

    // 1. Текстовая релевантность (уже рассчитана)
    features.push(product.textScore || 0)

    // 2. Совпадение с предпочтительными категориями
    const categoryPref = userContext.categoryPreferences.find(
      cp => cp.category === product.category
    )
    features.push(categoryPref ? Math.min(categoryPref.count / 10, 1) : 0)

    // 3. Совпадение с историей покупок
    const historyMatch = userContext.contractHistory.find(
      ch => ch.steId === product.ste_id
    )
    features.push(historyMatch ? Math.min(historyMatch.count / 5, 1) : 0)

    // 4. Популярность (по количеству контрактов)
    const maxContracts = Math.max(...allProducts.map(p => p.contractCount || 0), 1)
    features.push(this.normalize(product.contractCount || 0, 0, maxContracts))

    // 5. Оптимальность цены
    const avgPrice = product.avgPrice || product.price || 0
    const allPrices = allProducts.map(p => p.avgPrice || p.price || 0).filter(p => p > 0)
    const medianPrice = allPrices.sort((a, b) => a - b)[Math.floor(allPrices.length / 2)] || 1
    features.push(this.sigmoid((medianPrice - avgPrice) / medianPrice * 2))

    // 6. Недавность взаимодействия
    const recentInteraction = userContext.recentInteractions.find(
      ri => ri.steId === product.ste_id
    )
    if (recentInteraction) {
      const hoursSince = (Date.now() - new Date(recentInteraction.timestamp).getTime()) / 3600000
      features.push(Math.exp(-hoursSince / 24)) // Экспоненциальное затухание
    } else {
      features.push(0)
    }

    // 7. Контекст сессии (просмотрен ли в текущей сессии)
    features.push(userContext.sessionViews.includes(product.ste_id) ? 0.5 : 0)

    return features
  }

  /**
   * LSTM-подобная обработка последовательности признаков
   * Упрощённая версия без полноценных gate-ов
   */
  private processSequence(features: number[][]): number[] {
    // Инициализация состояний
    if (this.hiddenState.length === 0) {
      this.hiddenState = new Array(features[0]?.length || 7).fill(0)
      this.cellState = new Array(features[0]?.length || 7).fill(0)
    }

    const outputs: number[] = []

    for (const featureVector of features) {
      // Forget gate (упрощённый)
      const forgetGate = featureVector.map((f, i) => 
        this.sigmoid(f + this.hiddenState[i] * 0.5)
      )

      // Input gate
      const inputGate = featureVector.map((f, i) => 
        this.sigmoid(f * 0.8 + this.hiddenState[i] * 0.2)
      )

      // Candidate values
      const candidates = featureVector.map((f, i) => 
        this.tanh(f + this.hiddenState[i] * 0.3)
      )

      // Update cell state
      this.cellState = this.cellState.map((c, i) => 
        forgetGate[i] * c + inputGate[i] * candidates[i]
      )

      // Output gate
      const outputGate = featureVector.map((f, i) => 
        this.sigmoid(f * 0.6 + this.cellState[i] * 0.4)
      )

      // Update hidden state
      this.hiddenState = this.cellState.map((c, i) => 
        outputGate[i] * this.tanh(c)
      )

      // Финальный скор = взвешенная сумма hidden state
      const score = this.hiddenState.reduce((sum, h, i) => {
        const weights = Object.values(this.weights)
        return sum + h * (weights[i] || 0.1)
      }, 0)

      outputs.push(this.sigmoid(score * 2))
    }

    return outputs
  }

  /**
   * Ранжировать товары
   */
  rank(
    products: RankingProduct[],
    userContext: UserContext
  ): RankedProduct[] {
    // Сброс состояний LSTM для новой сессии
    this.hiddenState = []
    this.cellState = []

    // Извлечь признаки для всех товаров
    const allFeatures: number[][] = products.map(p => 
      this.extractFeatures(p, userContext, products)
    )

    // Обработать через LSTM
    const lstmScores = this.processSequence(allFeatures)

    // Сформировать результаты
    const rankedProducts: RankedProduct[] = products.map((product, idx) => {
      const features = allFeatures[idx]
      const lstmScore = lstmScores[idx]

      // Breakdown скоров
      const scoreBreakdown = {
        textScore: features[0] * this.weights.textRelevance,
        categoryScore: features[1] * this.weights.categoryMatch,
        historyScore: features[2] * this.weights.historyMatch,
        popularityScore: features[3] * this.weights.popularity,
        priceScore: features[4] * this.weights.priceOptimality,
        recencyScore: features[5] * this.weights.recency,
        sessionScore: features[6] * this.weights.sessionContext
      }

      // Финальный скор: комбинация LSTM + прямой расчёт
      const directScore = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0)
      const finalScore = lstmScore * 0.6 + directScore * 0.4

      // Причины ранжирования
      const rankingReasons: string[] = []
      if (features[2] > 0) {
        rankingReasons.push('Ранее закупали этот товар')
      }
      if (features[1] > 0.5) {
        rankingReasons.push('Часто закупаете в этой категории')
      }
      if (features[3] > 0.7) {
        rankingReasons.push('Популярно среди покупателей')
      }
      if (features[0] > 0.8) {
        rankingReasons.push('Высокое совпадение с запросом')
      }
      if (features[5] > 0.5) {
        rankingReasons.push('Недавно просматривали')
      }

      return {
        ...product,
        finalScore,
        scoreBreakdown,
        rankingReasons
      }
    })

    // Сортировка по финальному скору
    return rankedProducts.sort((a, b) => b.finalScore - a.finalScore)
  }

  /**
   * Обновить веса на основе обратной связи
   */
  updateWeights(feedback: { 
    clicked: number[]
    purchased: number[]
    ignored: number[]
  }): void {
    // Увеличить вес для признаков кликнутых/купленных товаров
    const learningRate = 0.05

    if (feedback.clicked.length > feedback.ignored.length) {
      // Пользователь активен - увеличиваем вес персонализации
      this.weights.historyMatch = Math.min(0.3, this.weights.historyMatch + learningRate)
      this.weights.categoryMatch = Math.min(0.25, this.weights.categoryMatch + learningRate)
    }

    if (feedback.purchased.length > 0) {
      // Покупки сигнализируют о правильном ранжировании
      this.weights.popularity = Math.min(0.2, this.weights.popularity + learningRate * 0.5)
    }

    // Нормализация весов
    const totalWeight = Object.values(this.weights).reduce((a, b) => a + b, 0)
    for (const key of Object.keys(this.weights) as (keyof RankingWeights)[]) {
      this.weights[key] = this.weights[key] / totalWeight
    }
  }

  /**
   * Получить текущие веса
   */
  getWeights(): RankingWeights {
    return { ...this.weights }
  }
}

export const lstmRanker = new LSTMRanker()
