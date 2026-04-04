/**
 * Генетический алгоритм для формирования графов категорий
 * Оптимизирует набор категорий под профиль пользователя
 */

export interface UserProfile {
  inn?: string
  preferredCategories: string[]
  purchaseHistory: { steId: number; category: string; count: number }[]
  minPrice?: number
  maxPrice?: number
}

export interface Product {
  ste_id: number
  name: string
  category: string
  price?: number
  contractCount?: number
}

export interface Chromosome {
  categories: string[]
  fitness: number
}

export class GeneticAlgorithm {
  private populationSize: number
  private generations: number
  private mutationRate: number
  private eliteCount: number

  constructor(
    populationSize = 30,
    generations = 15,
    mutationRate = 0.15,
    eliteCount = 5
  ) {
    this.populationSize = populationSize
    this.generations = generations
    this.mutationRate = mutationRate
    this.eliteCount = eliteCount
  }

  /**
   * Создать случайную хромосому (набор категорий)
   */
  private createChromosome(allCategories: string[]): string[] {
    const size = Math.floor(Math.random() * Math.min(allCategories.length, 5)) + 1
    const shuffled = [...allCategories].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, size)
  }

  /**
   * Оценка приспособленности хромосомы
   * Учитывает: историю покупок, предпочтения, количество товаров
   */
  private calculateFitness(
    chromosome: string[],
    userProfile: UserProfile,
    products: Product[]
  ): number {
    let score = 0

    for (const category of chromosome) {
      // Бонус за категории из истории покупок
      const historyMatch = userProfile.purchaseHistory.find(
        h => h.category === category
      )
      if (historyMatch) {
        score += historyMatch.count * 10 // Вес истории
      }

      // Бонус за предпочтённые категории
      if (userProfile.preferredCategories.includes(category)) {
        score += 15
      }

      // Бонус за количество товаров в категории
      const productsInCategory = products.filter(p => p.category === category)
      score += Math.min(productsInCategory.length, 20) * 0.5

      // Бонус за популярные товары (по количеству контрактов)
      const popularProducts = productsInCategory.filter(
        p => (p.contractCount || 0) > 5
      )
      score += popularProducts.length * 2
    }

    // Штраф за слишком большой или маленький граф
    if (chromosome.length > 5) score -= (chromosome.length - 5) * 5
    if (chromosome.length < 2) score -= 10

    return Math.max(0, score)
  }

  /**
   * Селекция: турнирный отбор
   */
  private tournamentSelection(
    population: Chromosome[],
    tournamentSize = 3
  ): Chromosome {
    const tournament: Chromosome[] = []
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length)
      tournament.push(population[randomIndex])
    }
    return tournament.sort((a, b) => b.fitness - a.fitness)[0]
  }

  /**
   * Кроссовер: одноточечный
   */
  private crossover(parent1: string[], parent2: string[]): string[] {
    if (parent1.length === 0) return [...parent2]
    if (parent2.length === 0) return [...parent1]

    const point1 = Math.floor(Math.random() * parent1.length)
    const point2 = Math.floor(Math.random() * parent2.length)

    const child = [
      ...parent1.slice(0, point1),
      ...parent2.slice(point2)
    ]

    // Убрать дубликаты
    return [...new Set(child)]
  }

  /**
   * Мутация: добавить/удалить/заменить категорию
   */
  private mutate(chromosome: string[], allCategories: string[]): string[] {
    if (Math.random() > this.mutationRate) return chromosome

    const result = [...chromosome]
    const operation = Math.random()

    if (operation < 0.33 && result.length < allCategories.length) {
      // Добавить случайную категорию
      const available = allCategories.filter(c => !result.includes(c))
      if (available.length > 0) {
        result.push(available[Math.floor(Math.random() * available.length)])
      }
    } else if (operation < 0.66 && result.length > 1) {
      // Удалить случайную категорию
      result.splice(Math.floor(Math.random() * result.length), 1)
    } else if (result.length > 0) {
      // Заменить случайную категорию
      const available = allCategories.filter(c => !result.includes(c))
      if (available.length > 0) {
        const replaceIndex = Math.floor(Math.random() * result.length)
        result[replaceIndex] = available[Math.floor(Math.random() * available.length)]
      }
    }

    return result
  }

  /**
   * Основной метод эволюции
   */
  evolve(
    userProfile: UserProfile,
    products: Product[],
    allCategories: string[]
  ): { bestCategories: string[]; fitness: number; generations: number } {
    // Инициализация популяции
    let population: Chromosome[] = Array(this.populationSize)
      .fill(null)
      .map(() => {
        const categories = this.createChromosome(allCategories)
        return {
          categories,
          fitness: this.calculateFitness(categories, userProfile, products)
        }
      })

    // Добавить категории из истории как "элитную" особь
    if (userProfile.purchaseHistory.length > 0) {
      const historyCategories = [
        ...new Set(userProfile.purchaseHistory.map(h => h.category))
      ].slice(0, 5)
      population[0] = {
        categories: historyCategories,
        fitness: this.calculateFitness(historyCategories, userProfile, products)
      }
    }

    // Эволюция
    for (let gen = 0; gen < this.generations; gen++) {
      // Сортировка по приспособленности
      population.sort((a, b) => b.fitness - a.fitness)

      // Новая популяция
      const newPopulation: Chromosome[] = []

      // Элитизм: лучшие особи переходят без изменений
      for (let i = 0; i < this.eliteCount && i < population.length; i++) {
        newPopulation.push(population[i])
      }

      // Заполнить остальную популяцию потомками
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.tournamentSelection(population)
        const parent2 = this.tournamentSelection(population)
        
        let childCategories = this.crossover(
          parent1.categories,
          parent2.categories
        )
        childCategories = this.mutate(childCategories, allCategories)

        newPopulation.push({
          categories: childCategories,
          fitness: this.calculateFitness(childCategories, userProfile, products)
        })
      }

      population = newPopulation
    }

    // Вернуть лучшую особь
    population.sort((a, b) => b.fitness - a.fitness)
    return {
      bestCategories: population[0].categories,
      fitness: population[0].fitness,
      generations: this.generations
    }
  }
}

export const geneticAlgorithm = new GeneticAlgorithm()
