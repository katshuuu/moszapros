/**
 * Пайплайн умного поиска
 * 
 * Retrieval → Typo Correction → Synonym Expansion → Personalized Rerank → Behavioral Signals
 * 
 * Каждый этап добавляет связи в граф и улучшает ранжирование
 */

import { synonyms } from '../ste-data'
import { 
  buildUserProfile, 
  UserProfile, 
  UserInteraction,
  SIGNAL_WEIGHTS 
} from './behavioral-signals'
import { 
  rerank, 
  RankedResult, 
  RetrievalResult,
  createPositionChangeSummary,
  DEFAULT_RERANKER_CONFIG
} from './personalized-reranker'

// =============================================================================
// Этап 1: TYPO CORRECTION (Исправление опечаток)
// =============================================================================

/**
 * Расстояние Левенштейна для поиска похожих слов
 */
function levenshtein(a: string, b: string): number {
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

// Словарь для исправления опечаток
const TYPO_DICTIONARY: string[] = [
  ...Object.keys(synonyms),
  ...Object.values(synonyms).flat(),
  'бумага', 'ручка', 'карандаш', 'степлер', 'скрепки', 'папка', 'файл',
  'маркер', 'корректор', 'ножницы', 'линейка', 'ластик', 'клей', 'тетрадь',
  'блокнот', 'стол', 'стул', 'кресло', 'шкаф', 'компьютер', 'монитор',
  'принтер', 'клавиатура', 'мышь', 'картридж', 'канцелярия', 'офисный',
  'медицинский', 'строительный', 'хозяйственный'
]

export interface TypoCorrectionResult {
  original: string
  corrected: string
  wasChanged: boolean
  corrections: { from: string; to: string; distance: number }[]
}

export function correctTypos(query: string): TypoCorrectionResult {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const corrections: { from: string; to: string; distance: number }[] = []
  const correctedWords: string[] = []
  
  for (const word of words) {
    if (word.length < 3) {
      correctedWords.push(word)
      continue
    }
    
    // Точное совпадение
    if (TYPO_DICTIONARY.includes(word)) {
      correctedWords.push(word)
      continue
    }
    
    // Ищем ближайшее слово
    let bestMatch = word
    let bestDistance = Math.ceil(word.length * 0.35) // Максимум 35% ошибок
    
    for (const dictWord of TYPO_DICTIONARY) {
      if (Math.abs(dictWord.length - word.length) > 3) continue
      
      const distance = levenshtein(word, dictWord)
      if (distance < bestDistance) {
        bestMatch = dictWord
        bestDistance = distance
      }
    }
    
    if (bestMatch !== word) {
      corrections.push({ from: word, to: bestMatch, distance: bestDistance })
    }
    correctedWords.push(bestMatch)
  }
  
  return {
    original: query,
    corrected: correctedWords.join(' '),
    wasChanged: corrections.length > 0,
    corrections
  }
}

// =============================================================================
// Этап 2: SYNONYM EXPANSION (Расширение синонимами)
// =============================================================================

export interface SynonymExpansionResult {
  originalTerms: string[]
  expandedTerms: string[]
  synonymGroups: { term: string; synonyms: string[] }[]
  totalExpansion: number
}

export function expandSynonyms(query: string): SynonymExpansionResult {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const expanded = new Set<string>(words)
  const synonymGroups: { term: string; synonyms: string[] }[] = []
  
  for (const word of words) {
    const wordStems = [word, stemRussian(word)]
    
    for (const [term, syns] of Object.entries(synonyms)) {
      const termStems = [term.toLowerCase(), stemRussian(term)]
      
      // Проверяем совпадение
      const matches = wordStems.some(ws => 
        termStems.includes(ws) || 
        syns.some(s => stemRussian(s) === ws)
      )
      
      if (matches) {
        const addedSynonyms: string[] = []
        expanded.add(term)
        for (const syn of syns) {
          if (!expanded.has(syn)) {
            expanded.add(syn)
            addedSynonyms.push(syn)
          }
        }
        if (addedSynonyms.length > 0) {
          synonymGroups.push({ term: word, synonyms: addedSynonyms })
        }
      }
    }
  }
  
  return {
    originalTerms: words,
    expandedTerms: Array.from(expanded),
    synonymGroups,
    totalExpansion: expanded.size - words.length
  }
}

// Простой русский стеммер
function stemRussian(word: string): string {
  const endings = [
    'ами', 'ями', 'ого', 'его', 'ому', 'ему', 'ым', 'им', 'ых', 'их',
    'ую', 'юю', 'ая', 'яя', 'ое', 'ее', 'ие', 'ые', 'ой', 'ей',
    'ов', 'ев', 'ий', 'ый', 'ой', 'ей', 'ию', 'ью',
    'ам', 'ям', 'ах', 'ях', 'ом', 'ем', 'ей', 'ью', 'ия', 'ья',
    'а', 'я', 'о', 'е', 'и', 'ы', 'у', 'ю', 'й', 'ь'
  ]
  
  let result = word.toLowerCase()
  for (const ending of endings) {
    if (result.endsWith(ending) && result.length > ending.length + 2) {
      return result.slice(0, -ending.length)
    }
  }
  return result
}

// =============================================================================
// Этап 3: RETRIEVAL (Базовый поиск)
// =============================================================================

export interface RetrievalConfig {
  useStems: boolean
  useSynonyms: boolean
  nameBoost: number     // Множитель для совпадения в названии
  categoryBoost: number // Множитель для совпадения в категории
}

const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig = {
  useStems: true,
  useSynonyms: true,
  nameBoost: 2.0,
  categoryBoost: 1.5
}

export function calculateTextScore(
  itemName: string,
  itemCategory: string,
  searchTerms: string[],
  config: RetrievalConfig = DEFAULT_RETRIEVAL_CONFIG
): { score: number; matchedTerms: string[] } {
  const nameLower = itemName.toLowerCase()
  const categoryLower = itemCategory.toLowerCase()
  const nameStems = nameLower.split(/\s+/).map(stemRussian)
  
  let score = 0
  const matchedTerms: string[] = []
  
  for (const term of searchTerms) {
    const termStem = stemRussian(term)
    
    // Точное совпадение в названии
    if (nameLower.includes(term)) {
      score += 10 * config.nameBoost
      if (!matchedTerms.includes(term)) matchedTerms.push(term)
      
      // Бонус за совпадение в начале
      if (nameLower.startsWith(term)) {
        score += 5
      }
    }
    // Совпадение по стему в названии
    else if (config.useStems && nameStems.includes(termStem)) {
      score += 7 * config.nameBoost
      if (!matchedTerms.includes(term)) matchedTerms.push(term)
    }
    
    // Совпадение в категории
    if (categoryLower.includes(term) || stemRussian(categoryLower).includes(termStem)) {
      score += 5 * config.categoryBoost
    }
  }
  
  return { score, matchedTerms }
}

// =============================================================================
// ПОЛНЫЙ ПАЙПЛАЙН ПОИСКА
// =============================================================================

export interface SearchPipelineInput {
  query: string
  results: RetrievalResult[]
  userInteractions?: UserInteraction[]
  contractHistory?: { steId: number; steName: string; category: string; count: number }[]
  categoryPreferences?: { category: string; count: number; totalSpent: number }[]
}

export interface SearchPipelineOutput {
  // Результаты
  results: RankedResult[]
  
  // Метаданные пайплайна
  pipeline: {
    // Этап 1: Typo Correction
    typoCorrection: TypoCorrectionResult
    
    // Этап 2: Synonym Expansion
    synonymExpansion: SynonymExpansionResult
    
    // Этап 3: User Profile
    userProfile: {
      hasProfile: boolean
      topCategories: string[]
      frequentItemsCount: number
      signalStrength: 'strong' | 'medium' | 'weak' | 'none'
    }
    
    // Этап 4: Reranking Summary
    rerankingSummary: {
      improved: number
      unchanged: number
      decreased: number
      topChanges: { name: string; from: number; to: number; reason: string }[]
    }
  }
  
  // Для отображения пользователю
  explanationForUser: string[]
  
  // Время выполнения
  pipelineTimeMs: number
}

/**
 * Выполняет полный пайплайн умного поиска
 */
export function runSearchPipeline(input: SearchPipelineInput): SearchPipelineOutput {
  const startTime = Date.now()
  const explanationForUser: string[] = []
  
  // Этап 1: Typo Correction
  const typoCorrection = correctTypos(input.query)
  if (typoCorrection.wasChanged) {
    explanationForUser.push(
      `Исправлены опечатки: "${typoCorrection.original}" → "${typoCorrection.corrected}"`
    )
  }
  
  // Этап 2: Synonym Expansion
  const synonymExpansion = expandSynonyms(typoCorrection.corrected)
  if (synonymExpansion.totalExpansion > 0) {
    const synList = synonymExpansion.synonymGroups
      .flatMap(g => g.synonyms)
      .slice(0, 5)
      .join(', ')
    explanationForUser.push(`Расширен поиск синонимами: ${synList}`)
  }
  
  // Этап 3: Build User Profile
  let userProfile: UserProfile | null = null
  let profileStrength: 'strong' | 'medium' | 'weak' | 'none' = 'none'
  
  if (input.userInteractions?.length || input.contractHistory?.length || input.categoryPreferences?.length) {
    userProfile = buildUserProfile(
      input.userInteractions || [],
      input.contractHistory,
      input.categoryPreferences
    )
    
    // Определяем силу профиля
    const totalSignals = 
      (input.userInteractions?.length || 0) + 
      (input.contractHistory?.reduce((sum, c) => sum + c.count, 0) || 0)
    
    if (totalSignals > 50) {
      profileStrength = 'strong'
      explanationForUser.push('Сильная персонализация на основе вашей истории')
    } else if (totalSignals > 10) {
      profileStrength = 'medium'
      explanationForUser.push('Результаты персонализированы по вашему профилю')
    } else if (totalSignals > 0) {
      profileStrength = 'weak'
      explanationForUser.push('Базовая персонализация активна')
    }
  }
  
  // Этап 4: Rerank
  const matchedSynonyms = new Map<number, string[]>()
  
  // Для каждого результата находим совпавшие синонимы
  for (const result of input.results) {
    const matched: string[] = []
    const nameLower = result.name.toLowerCase()
    
    for (const term of synonymExpansion.expandedTerms) {
      if (nameLower.includes(term) && !synonymExpansion.originalTerms.includes(term)) {
        matched.push(term)
      }
    }
    
    if (matched.length > 0) {
      matchedSynonyms.set(result.steId, matched)
    }
  }
  
  const rankedResults = rerank(
    input.results,
    userProfile,
    {
      originalQuery: input.query,
      correctedQuery: typoCorrection.wasChanged ? typoCorrection.corrected : null,
      synonymsUsed: synonymExpansion.synonymGroups.flatMap(g => g.synonyms),
      matchedSynonyms
    },
    DEFAULT_RERANKER_CONFIG
  )
  
  // Этап 5: Summary
  const rerankingSummary = createPositionChangeSummary(rankedResults)
  
  if (rerankingSummary.improved > 0) {
    explanationForUser.push(
      `${rerankingSummary.improved} товаров поднялись в выдаче благодаря вашему профилю`
    )
  }
  
  return {
    results: rankedResults,
    pipeline: {
      typoCorrection,
      synonymExpansion,
      userProfile: {
        hasProfile: userProfile !== null,
        topCategories: userProfile?.topCategories.slice(0, 5).map(c => c.category) || [],
        frequentItemsCount: userProfile?.frequentItems.length || 0,
        signalStrength: profileStrength
      },
      rerankingSummary
    },
    explanationForUser,
    pipelineTimeMs: Date.now() - startTime
  }
}

/**
 * Генерирует объяснение для конкретного товара
 */
export function generateItemExplanation(
  result: RankedResult,
  pipelineOutput: SearchPipelineOutput
): string[] {
  const explanations: string[] = []
  const { scoreBreakdown, positionChange, originalPosition, newPosition } = result
  
  // Главный фактор
  const factors = [
    { name: 'Совпадение с запросом', value: scoreBreakdown.textScore, threshold: 10 },
    { name: 'Ваши предпочтения', value: scoreBreakdown.personalizationScore, threshold: 5 },
    { name: 'Популярность', value: scoreBreakdown.popularityScore, threshold: 5 },
    { name: 'Синонимы', value: scoreBreakdown.synonymBonus, threshold: 3 }
  ].filter(f => f.value >= f.threshold)
   .sort((a, b) => b.value - a.value)
  
  if (factors.length > 0) {
    explanations.push(`Главные факторы: ${factors.slice(0, 2).map(f => f.name).join(' и ')}`)
  }
  
  // Изменение позиции
  if (positionChange > 5) {
    explanations.push(`Поднялся с ${originalPosition}-го на ${newPosition}-е место (+${positionChange})`)
  } else if (positionChange > 0) {
    explanations.push(`Поднялся на ${positionChange} позиций`)
  }
  
  // Детали персонализации
  if (result.personalizationFactors.isInHistory) {
    if (result.personalizationFactors.purchaseCount > 0) {
      explanations.push(`Вы закупали этот товар ${result.personalizationFactors.purchaseCount} раз`)
    } else {
      explanations.push('Вы ранее взаимодействовали с этим товаром')
    }
  }
  
  if (result.personalizationFactors.categoryRank >= 0 && result.personalizationFactors.categoryRank < 3) {
    const rankText = result.personalizationFactors.categoryRank === 0 ? 'основная' : 'частая'
    explanations.push(`"${result.category}" — ваша ${rankText} категория`)
  }
  
  return explanations
}
