/**
 * Reinforcement Learning для комбинирования товаров
 * Q-Learning для оптимального выбора следующего товара
 */

export interface RLProduct {
  ste_id: number
  name: string
  category: string
  price?: number
  relevance?: number
  contractCount?: number
}

export interface QTableEntry {
  productId: number
  qValue: number
  visits: number
}

export class ReinforcementLearning {
  private learningRate: number
  private discountFactor: number
  private explorationRate: number
  private qTable: Map<string, Map<number, QTableEntry>>

  constructor(
    learningRate = 0.1,
    discountFactor = 0.9,
    explorationRate = 0.2
  ) {
    this.learningRate = learningRate
    this.discountFactor = discountFactor
    this.explorationRate = explorationRate
    this.qTable = new Map()
  }

  /**
   * Получить состояние: хэш текущей комбинации товаров
   */
  private getState(selectedProducts: RLProduct[]): string {
    if (selectedProducts.length === 0) return 'empty'
    
    // Состояние = категории выбранных товаров
    const categories = [...new Set(selectedProducts.map(p => p.category))].sort()
    return categories.join('|')
  }

  /**
   * Получить Q-значения для состояния
   */
  private getQValues(state: string): Map<number, QTableEntry> {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Map())
    }
    return this.qTable.get(state)!
  }

  /**
   * Выбрать действие (товар) по epsilon-greedy стратегии
   */
  private selectAction(
    state: string,
    availableProducts: RLProduct[],
    selectedIds: Set<number>
  ): RLProduct | null {
    const unselected = availableProducts.filter(p => !selectedIds.has(p.ste_id))
    if (unselected.length === 0) return null

    // Exploration: случайный выбор
    if (Math.random() < this.explorationRate) {
      return unselected[Math.floor(Math.random() * unselected.length)]
    }

    // Exploitation: выбор по Q-значению
    const qValues = this.getQValues(state)
    let bestProduct = unselected[0]
    let bestQValue = -Infinity

    for (const product of unselected) {
      const entry = qValues.get(product.ste_id)
      const qValue = entry ? entry.qValue : 0
      
      // Добавляем бонус за релевантность и популярность
      const bonus = (product.relevance || 0) * 0.5 + 
                    Math.log((product.contractCount || 1) + 1) * 0.3
      
      if (qValue + bonus > bestQValue) {
        bestQValue = qValue + bonus
        bestProduct = product
      }
    }

    return bestProduct
  }

  /**
   * Рассчитать награду за добавление товара
   */
  private calculateReward(
    product: RLProduct,
    currentCombination: RLProduct[],
    userCategories: string[]
  ): number {
    let reward = 0

    // Награда за релевантность
    reward += (product.relevance || 0) * 10

    // Награда за популярность
    reward += Math.min((product.contractCount || 0) / 10, 5)

    // Награда за категорию из предпочтений пользователя
    if (userCategories.includes(product.category)) {
      reward += 15
    }

    // Награда за разнообразие категорий
    const existingCategories = new Set(currentCombination.map(p => p.category))
    if (!existingCategories.has(product.category)) {
      reward += 5 // Бонус за новую категорию
    }

    // Штраф за слишком много товаров одной категории
    const sameCategory = currentCombination.filter(
      p => p.category === product.category
    ).length
    if (sameCategory > 3) {
      reward -= 5
    }

    return reward
  }

  /**
   * Обновить Q-таблицу
   */
  private updateQTable(
    state: string,
    productId: number,
    reward: number,
    nextState: string
  ): void {
    const qValues = this.getQValues(state)
    const currentEntry = qValues.get(productId) || { productId, qValue: 0, visits: 0 }

    // Максимальное Q-значение для следующего состояния
    const nextQValues = this.getQValues(nextState)
    let maxNextQ = 0
    for (const entry of nextQValues.values()) {
      if (entry.qValue > maxNextQ) {
        maxNextQ = entry.qValue
      }
    }

    // Q-Learning update rule
    const newQValue = currentEntry.qValue + 
      this.learningRate * (reward + this.discountFactor * maxNextQ - currentEntry.qValue)

    qValues.set(productId, {
      productId,
      qValue: newQValue,
      visits: currentEntry.visits + 1
    })
  }

  /**
   * Сгенерировать оптимальную комбинацию товаров
   */
  generateCombination(
    availableProducts: RLProduct[],
    userCategories: string[],
    maxItems = 10,
    episodes = 5
  ): { products: RLProduct[]; totalReward: number } {
    let bestCombination: RLProduct[] = []
    let bestTotalReward = -Infinity

    // Несколько эпизодов для обучения
    for (let episode = 0; episode < episodes; episode++) {
      const combination: RLProduct[] = []
      const selectedIds = new Set<number>()
      let totalReward = 0
      let state = this.getState(combination)

      // Выбираем товары пока не достигнем лимита
      for (let step = 0; step < maxItems; step++) {
        const product = this.selectAction(state, availableProducts, selectedIds)
        if (!product) break

        const reward = this.calculateReward(product, combination, userCategories)
        totalReward += reward

        combination.push(product)
        selectedIds.add(product.ste_id)

        const nextState = this.getState(combination)
        this.updateQTable(state, product.ste_id, reward, nextState)
        state = nextState
      }

      // Сохраняем лучшую комбинацию
      if (totalReward > bestTotalReward) {
        bestTotalReward = totalReward
        bestCombination = [...combination]
      }
    }

    return {
      products: bestCombination,
      totalReward: bestTotalReward
    }
  }

  /**
   * Получить статистику Q-таблицы
   */
  getStats(): { states: number; entries: number } {
    let entries = 0
    for (const stateMap of this.qTable.values()) {
      entries += stateMap.size
    }
    return {
      states: this.qTable.size,
      entries
    }
  }

  /**
   * Сбросить Q-таблицу
   */
  reset(): void {
    this.qTable.clear()
  }
}

export const reinforcementLearning = new ReinforcementLearning()
