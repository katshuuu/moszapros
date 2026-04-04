/**
 * Поведенческие сигналы пользователя
 * Формирует граф связей: пользователь → товары → категории
 */

export interface BehavioralSignal {
  type: 'view' | 'click' | 'purchase' | 'positive' | 'negative' | 'dwell' | 'bounce'
  weight: number
  decayFactor: number // коэффициент затухания по времени
  description: string
}

// Веса поведенческих сигналов
export const SIGNAL_WEIGHTS: Record<string, BehavioralSignal> = {
  view: {
    type: 'view',
    weight: 0.1,
    decayFactor: 0.95,
    description: 'Просмотр в выдаче'
  },
  click: {
    type: 'click',
    weight: 0.3,
    decayFactor: 0.9,
    description: 'Клик на карточку'
  },
  dwell: {
    type: 'dwell',
    weight: 0.5,
    decayFactor: 0.85,
    description: 'Долгое изучение (>30 сек)'
  },
  purchase: {
    type: 'purchase',
    weight: 1.0,
    decayFactor: 0.7,
    description: 'Покупка/контракт'
  },
  positive: {
    type: 'positive',
    weight: 0.8,
    decayFactor: 0.8,
    description: 'Положительная оценка'
  },
  negative: {
    type: 'negative',
    weight: -0.5,
    decayFactor: 0.9,
    description: 'Отрицательная оценка'
  },
  bounce: {
    type: 'bounce',
    weight: -0.2,
    decayFactor: 0.95,
    description: 'Быстрый возврат (<5 сек)'
  }
}

export interface UserInteraction {
  steId: number
  steName: string
  category: string
  signalType: string
  timestamp: Date
  weight: number
}

export interface UserProfile {
  inn?: string
  userId?: string
  
  // Граф связей: категория → суммарный вес
  categoryWeights: Map<string, number>
  
  // Граф связей: steId → суммарный вес
  itemWeights: Map<number, number>
  
  // История взаимодействий для decay
  interactions: UserInteraction[]
  
  // Топ категории
  topCategories: { category: string; weight: number }[]
  
  // Часто покупаемые товары
  frequentItems: { steId: number; name: string; count: number }[]
}

/**
 * Вычисляет вес сигнала с учетом времени (decay)
 */
export function calculateDecayedWeight(
  baseWeight: number,
  decayFactor: number,
  daysSinceInteraction: number
): number {
  // Экспоненциальное затухание: weight * decay^days
  return baseWeight * Math.pow(decayFactor, daysSinceInteraction)
}

/**
 * Строит профиль пользователя из истории взаимодействий
 */
export function buildUserProfile(
  interactions: UserInteraction[],
  contractHistory?: { steId: number; steName: string; category: string; count: number }[],
  categoryPreferences?: { category: string; count: number; totalSpent: number }[]
): UserProfile {
  const now = new Date()
  const categoryWeights = new Map<string, number>()
  const itemWeights = new Map<number, number>()
  
  // Обрабатываем историю взаимодействий с decay
  for (const interaction of interactions) {
    const signal = SIGNAL_WEIGHTS[interaction.signalType]
    if (!signal) continue
    
    const daysSince = Math.floor(
      (now.getTime() - new Date(interaction.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    )
    const decayedWeight = calculateDecayedWeight(
      signal.weight,
      signal.decayFactor,
      daysSince
    )
    
    // Добавляем в граф категорий
    const currentCatWeight = categoryWeights.get(interaction.category) || 0
    categoryWeights.set(interaction.category, currentCatWeight + decayedWeight)
    
    // Добавляем в граф товаров
    const currentItemWeight = itemWeights.get(interaction.steId) || 0
    itemWeights.set(interaction.steId, currentItemWeight + decayedWeight)
  }
  
  // Добавляем данные из истории контрактов (сильный сигнал)
  if (contractHistory) {
    for (const contract of contractHistory) {
      // Контракт = покупка, но данные исторические, поэтому decay выше
      const weight = contract.count * SIGNAL_WEIGHTS.purchase.weight * 0.5
      
      const currentCatWeight = categoryWeights.get(contract.category) || 0
      categoryWeights.set(contract.category, currentCatWeight + weight)
      
      const currentItemWeight = itemWeights.get(contract.steId) || 0
      itemWeights.set(contract.steId, currentItemWeight + weight)
    }
  }
  
  // Добавляем предпочтения по категориям
  if (categoryPreferences) {
    for (const pref of categoryPreferences) {
      const weight = Math.log10(pref.count + 1) * 0.3 + Math.log10(pref.totalSpent + 1) * 0.001
      const currentWeight = categoryWeights.get(pref.category) || 0
      categoryWeights.set(pref.category, currentWeight + weight)
    }
  }
  
  // Сортируем топ категории
  const topCategories = Array.from(categoryWeights.entries())
    .map(([category, weight]) => ({ category, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10)
  
  // Частые товары
  const frequentItems = contractHistory
    ?.sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(c => ({ steId: c.steId, name: c.steName, count: c.count })) || []
  
  return {
    categoryWeights,
    itemWeights,
    interactions,
    topCategories,
    frequentItems
  }
}

/**
 * Вычисляет персонализационный буст для товара
 */
export function calculatePersonalizationBoost(
  steId: number,
  category: string,
  userProfile: UserProfile
): {
  totalBoost: number
  itemBoost: number
  categoryBoost: number
  explanations: string[]
} {
  const explanations: string[] = []
  
  // Буст от прямых взаимодействий с товаром
  const itemWeight = userProfile.itemWeights.get(steId) || 0
  let itemBoost = 0
  
  if (itemWeight > 0) {
    // Нормализуем: максимум 30 баллов
    itemBoost = Math.min(itemWeight * 10, 30)
    
    // Находим частоту покупок
    const frequentItem = userProfile.frequentItems.find(f => f.steId === steId)
    if (frequentItem && frequentItem.count > 0) {
      explanations.push(`Вы закупали этот товар ${frequentItem.count} раз`)
    } else if (itemBoost > 10) {
      explanations.push(`Вы ранее взаимодействовали с этим товаром`)
    }
  }
  
  // Буст от категории
  const categoryWeight = userProfile.categoryWeights.get(category) || 0
  let categoryBoost = 0
  
  if (categoryWeight > 0) {
    // Нормализуем: максимум 20 баллов
    categoryBoost = Math.min(categoryWeight * 5, 20)
    
    const categoryRank = userProfile.topCategories.findIndex(c => c.category === category)
    if (categoryRank === 0) {
      explanations.push(`"${category}" — ваша основная категория закупок`)
    } else if (categoryRank > 0 && categoryRank < 3) {
      explanations.push(`Вы часто закупаете товары категории "${category}"`)
    } else if (categoryBoost > 5) {
      explanations.push(`Категория "${category}" в вашем профиле`)
    }
  }
  
  const totalBoost = itemBoost + categoryBoost
  
  return {
    totalBoost,
    itemBoost,
    categoryBoost,
    explanations
  }
}

/**
 * Форматирует объяснение веса сигнала для пользователя
 */
export function formatSignalExplanation(signalType: string, count: number): string {
  const signal = SIGNAL_WEIGHTS[signalType]
  if (!signal) return ''
  
  const weightSign = signal.weight >= 0 ? '+' : ''
  const totalWeight = signal.weight * count
  
  return `${signal.description} (${count}x): ${weightSign}${totalWeight.toFixed(1)} баллов`
}
