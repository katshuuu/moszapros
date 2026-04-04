/**
 * Локальный поисковый движок с морфологическим анализом, 
 * синонимами, исправлением опечаток и персонализацией.
 * 
 * ВАЖНО: Не использует никаких внешних API!
 * Все алгоритмы работают локально на клиенте.
 */

import { steItems, synonyms, roleRecommendations, type STEItem } from './ste-data'
import { type Interaction } from './store'

// =============================================================================
// МОРФОЛОГИЧЕСКИЙ АНАЛИЗ (СТЕММИНГ) ДЛЯ РУССКОГО ЯЗЫКА
// =============================================================================

// Суффиксы русского языка для стемминга (упрощенный алгоритм Портера для русского)
const PERFECTIVE_GERUND = /((?:ив|ивши|ившись|ыв|ывши|ывшись)|(?:[ая](?:в|вши|вшись)))$/i
const ADJECTIVE = /(ее|ие|ые|ое|ими|ыми|ей|ий|ый|ой|ем|им|ым|ом|его|ого|ему|ому|их|ых|ую|юю|ая|яя|ою|ею)$/i
const PARTICIPLE = /((?:ивш|ывш|ующ)|(?:[ая](?:ем|нн|вш|ющ|щ)))$/i
const REFLEXIVE = /(с[яь])$/i
const VERB = /((?:ила|ыла|ена|ейте|уйте|ите|или|ыли|ей|уй|ил|ыл|им|ым|ен|ило|ыло|ено|ят|ует|уют|ит|ыт|ены|ить|ыть|ишь|ую|ю)|(?:[ая](?:ла|на|ете|йте|ли|й|л|ем|н|ло|но|ет|ют|ны|ть|ешь|нно)))$/i
const NOUN = /(а|ев|ов|ие|ье|е|иями|ями|ами|еи|ии|и|ией|ей|ой|ий|й|иям|ям|ием|ем|ам|ом|о|у|ах|иях|ях|ы|ь|ию|ью|ю|ия|ья|я)$/i
const SUPERLATIVE = /(ейш|ейше)$/i
const DERIVATIONAL = /(ост|ость)$/i

// Группы гласных и согласных
const VOWEL = /[аеиоуыэюя]/i
const CONSONANT = /[бвгджзйклмнпрстфхцчшщ]/i

function findRegion(word: string): { rv: number; r1: number; r2: number } {
  let rv = word.length
  let r1 = word.length
  let r2 = word.length

  // RV - первая гласная
  for (let i = 0; i < word.length; i++) {
    if (VOWEL.test(word[i])) {
      rv = i + 1
      break
    }
  }

  // R1 - после первого сочетания гласная-согласная
  let foundVowel = false
  for (let i = 0; i < word.length; i++) {
    if (VOWEL.test(word[i])) {
      foundVowel = true
    } else if (foundVowel && CONSONANT.test(word[i])) {
      r1 = i + 1
      break
    }
  }

  // R2 - внутри R1 аналогично
  foundVowel = false
  for (let i = r1; i < word.length; i++) {
    if (VOWEL.test(word[i])) {
      foundVowel = true
    } else if (foundVowel && CONSONANT.test(word[i])) {
      r2 = i + 1
      break
    }
  }

  return { rv, r1, r2 }
}

/**
 * Русский стеммер (упрощенный алгоритм Портера)
 */
export function russianStem(word: string): string {
  word = word.toLowerCase().replace(/ё/g, 'е')
  
  if (word.length < 3) return word
  
  const { rv } = findRegion(word)
  let result = word
  
  // Шаг 1: Убираем окончания
  let rvPart = result.substring(rv)
  
  // Пробуем PERFECTIVE GERUND
  if (PERFECTIVE_GERUND.test(rvPart)) {
    result = result.replace(PERFECTIVE_GERUND, '')
  } else {
    // Убираем REFLEXIVE если есть
    if (REFLEXIVE.test(rvPart)) {
      result = result.replace(REFLEXIVE, '')
      rvPart = result.substring(rv)
    }
    
    // Пробуем ADJECTIVE/PARTICIPLE, VERB, NOUN
    if (ADJECTIVE.test(rvPart)) {
      result = result.replace(ADJECTIVE, '')
      if (PARTICIPLE.test(result.substring(rv))) {
        result = result.replace(PARTICIPLE, '')
      }
    } else if (VERB.test(rvPart)) {
      result = result.replace(VERB, '')
    } else if (NOUN.test(rvPart)) {
      result = result.replace(NOUN, '')
    }
  }
  
  // Шаг 2: Убираем и
  if (result.endsWith('и')) {
    result = result.slice(0, -1)
  }
  
  // Шаг 3: Derivational
  const { r2 } = findRegion(result)
  if (DERIVATIONAL.test(result.substring(r2))) {
    result = result.replace(DERIVATIONAL, '')
  }
  
  // Шаг 4: Superlative и финальные изменения
  result = result.replace(SUPERLATIVE, '')
  if (result.endsWith('нн')) {
    result = result.slice(0, -1)
  }
  if (result.endsWith('ь')) {
    result = result.slice(0, -1)
  }
  
  return result
}

// =============================================================================
// ИСПРАВЛЕНИЕ ОПЕЧАТОК (РАССТОЯНИЕ ЛЕВЕНШТЕЙНА)
// =============================================================================

/**
 * Вычисляет расстояние Левенштейна между двумя строками
 */
export function levenshteinDistance(a: string, b: string): number {
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
          matrix[i - 1][j - 1] + 1, // замена
          matrix[i][j - 1] + 1,     // вставка
          matrix[i - 1][j] + 1      // удаление
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

// Расширенный словарь для исправления опечаток
const DICTIONARY: string[] = [
  // Канцелярия
  'бумага', 'ручка', 'ручки', 'тетрадь', 'тетради', 'карандаш', 'карандаши',
  'степлер', 'скрепки', 'папка', 'папки', 'файл', 'файлы', 'блокнот', 'блокноты',
  'маркер', 'маркеры', 'корректор', 'ножницы', 'линейка', 'ластик', 'клей',
  'дырокол', 'точилка', 'скоросшиватель', 'канцелярия', 'канцтовары',
  // Мебель
  'стол', 'столы', 'стул', 'стулья', 'кресло', 'кресла', 'шкаф', 'шкафы',
  'тумба', 'тумбы', 'мебель', 'офисная', 'офисный',
  // Техника
  'компьютер', 'компьютеры', 'монитор', 'мониторы', 'принтер', 'принтеры',
  'мфу', 'клавиатура', 'клавиатуры', 'мышь', 'мыши', 'картридж', 'картриджи',
  'флешка', 'флеш', 'накопитель', 'системный', 'блок',
  // Медицина
  'шприц', 'шприцы', 'бинт', 'бинты', 'вата', 'перчатки', 'маска', 'маски',
  'термометр', 'тонометр', 'антисептик', 'стетоскоп', 'пульсоксиметр',
  'медицинский', 'медицинская', 'медицинское',
  // Строительство
  'цемент', 'кирпич', 'кирпичи', 'песок', 'щебень', 'арматура', 'краска',
  'краски', 'гипсокартон', 'утеплитель', 'профиль', 'саморезы', 'строительный',
  'строительная', 'строительные', 'строительных'
]

export interface TypoCorrection {
  original: string
  corrected: string
  wasChanged: boolean
}

/**
 * Исправляет опечатки в запросе
 */
export function correctTypos(query: string): TypoCorrection {
  const words = query.toLowerCase().split(/\s+/)
  const correctedWords: string[] = []
  let wasChanged = false
  
  for (const word of words) {
    if (word.length < 3) {
      correctedWords.push(word)
      continue
    }
    
    // Проверяем, есть ли слово в словаре
    const wordStem = russianStem(word)
    const exactMatch = DICTIONARY.some(d => 
      d === word || russianStem(d) === wordStem
    )
    
    if (exactMatch) {
      correctedWords.push(word)
      continue
    }
    
    // Ищем ближайшее слово в словаре
    let bestMatch = word
    let bestDistance = Math.ceil(word.length * 0.4) // Максимум 40% ошибок
    
    for (const dictWord of DICTIONARY) {
      const distance = levenshteinDistance(word, dictWord)
      if (distance < bestDistance) {
        bestMatch = dictWord
        bestDistance = distance
      }
    }
    
    if (bestMatch !== word) {
      wasChanged = true
    }
    correctedWords.push(bestMatch)
  }
  
  return {
    original: query,
    corrected: correctedWords.join(' '),
    wasChanged
  }
}

// =============================================================================
// РАСШИРЕНИЕ ЗАПРОСА СИНОНИМАМИ
// =============================================================================

export interface SynonymExpansion {
  originalTerms: string[]
  expandedTerms: string[]
  synonymsUsed: string[]
}

/**
 * Расширяет запрос синонимами
 */
export function expandWithSynonyms(query: string): SynonymExpansion {
  const words = query.toLowerCase().split(/\s+/)
  const stems = words.map(russianStem)
  const expanded: Set<string> = new Set(words)
  const synonymsUsed: string[] = []
  
  for (const word of words) {
    const wordStem = russianStem(word)
    
    for (const [term, syns] of Object.entries(synonyms)) {
      const termStem = russianStem(term)
      const synStems = syns.map(russianStem)
      
      // Проверяем совпадение по стемму
      if (wordStem === termStem || synStems.includes(wordStem)) {
        expanded.add(term)
        syns.forEach(s => {
          expanded.add(s)
          if (!words.includes(s) && !synonymsUsed.includes(s)) {
            synonymsUsed.push(s)
          }
        })
        if (!words.includes(term) && !synonymsUsed.includes(term)) {
          synonymsUsed.push(term)
        }
      }
    }
  }
  
  return {
    originalTerms: words,
    expandedTerms: Array.from(expanded),
    synonymsUsed
  }
}

// =============================================================================
// ПЕРСОНАЛИЗАЦИЯ И РАНЖИРОВАНИЕ
// =============================================================================

export interface PersonalizationFactors {
  roleBonus: number
  interactionBonus: number
  viewCount: number
  clickCount: number
  purchaseCount: number
  positiveSignals: number
  negativeSignals: number
  explanation: string[]
}

/**
 * Вычисляет факторы персонализации для товара
 */
export function calculatePersonalization(
  item: STEItem,
  userRole: string | undefined,
  interactions: Interaction[]
): PersonalizationFactors {
  const factors: PersonalizationFactors = {
    roleBonus: 0,
    interactionBonus: 0,
    viewCount: 0,
    clickCount: 0,
    purchaseCount: 0,
    positiveSignals: 0,
    negativeSignals: 0,
    explanation: []
  }
  
  // Бонус за соответствие роли пользователя
  if (userRole && roleRecommendations[userRole]?.includes(item.id)) {
    factors.roleBonus = 15
    factors.explanation.push(`Рекомендовано для вашей организации (+15)`)
  }
  
  // Анализ истории взаимодействий
  const itemInteractions = interactions.filter(i => i.steId === item.id)
  
  for (const interaction of itemInteractions) {
    switch (interaction.type) {
      case 'view':
        factors.viewCount++
        factors.interactionBonus += 1
        break
      case 'click':
        factors.clickCount++
        factors.interactionBonus += 3
        break
      case 'purchase':
        factors.purchaseCount++
        factors.interactionBonus += 10
        break
      case 'favorite':
        factors.interactionBonus += 5
        break
      case 'positive':
        factors.positiveSignals++
        factors.interactionBonus += 7
        break
      case 'negative':
        factors.negativeSignals++
        factors.interactionBonus -= 5
        break
    }
  }
  
  if (factors.purchaseCount > 0) {
    factors.explanation.push(`Ранее покупался (${factors.purchaseCount} раз, +${factors.purchaseCount * 10})`)
  }
  if (factors.clickCount > 0) {
    factors.explanation.push(`Просматривали детали (${factors.clickCount} раз, +${factors.clickCount * 3})`)
  }
  if (factors.viewCount > 0) {
    factors.explanation.push(`Появлялся в выдаче (${factors.viewCount} раз, +${factors.viewCount})`)
  }
  if (factors.positiveSignals > 0) {
    factors.explanation.push(`Положительная оценка (+${factors.positiveSignals * 7})`)
  }
  if (factors.negativeSignals > 0) {
    factors.explanation.push(`Отрицательная оценка (${factors.negativeSignals * -5})`)
  }
  
  return factors
}

// =============================================================================
// ОСНОВНАЯ ФУНКЦИЯ ПОИСКА
// =============================================================================

export interface SearchResult extends STEItem {
  relevanceScore: number
  personalizedScore: number
  personalizationFactors: PersonalizationFactors
  matchedTerms: string[]
}

export interface SearchResponse {
  results: SearchResult[]
  typoCorrection: TypoCorrection
  synonymExpansion: SynonymExpansion
  searchTimeMs: number
  totalFound: number
}

/**
 * Выполняет гибридный поиск с морфологией, синонимами и персонализацией
 */
export function performSearch(
  query: string,
  category: string,
  userRole: string | undefined,
  interactions: Interaction[]
): SearchResponse {
  const startTime = performance.now()
  
  // Шаг 1: Исправление опечаток
  const typoCorrection = correctTypos(query)
  const searchQuery = typoCorrection.wasChanged ? typoCorrection.corrected : query
  
  // Шаг 2: Расширение синонимами
  const synonymExpansion = expandWithSynonyms(searchQuery)
  
  // Шаг 3: Стемминг всех терминов для морфологического поиска
  const searchStems = synonymExpansion.expandedTerms.map(russianStem)
  
  // Шаг 4: Поиск и ранжирование
  const results: SearchResult[] = []
  
  for (const item of steItems) {
    // Фильтр по категории
    if (category !== 'Все категории' && item.category !== category) {
      continue
    }
    
    // Морфологический поиск: ищем совпадения по стеммам
    const itemText = `${item.name} ${item.description} ${item.category}`.toLowerCase()
    const itemWords = itemText.split(/\s+/)
    const itemStems = itemWords.map(russianStem)
    
    const matchedTerms: string[] = []
    let matchScore = 0
    
    for (let i = 0; i < searchStems.length; i++) {
      const searchStem = searchStems[i]
      const originalTerm = synonymExpansion.expandedTerms[i]
      
      // Точное совпадение по стемму
      if (itemStems.includes(searchStem)) {
        matchedTerms.push(originalTerm)
        
        // Бонус за совпадение в названии
        const nameStems = item.name.toLowerCase().split(/\s+/).map(russianStem)
        if (nameStems.includes(searchStem)) {
          matchScore += 10
        } else {
          matchScore += 5
        }
      }
      
      // Частичное совпадение (подстрока)
      if (itemText.includes(originalTerm)) {
        if (!matchedTerms.includes(originalTerm)) {
          matchedTerms.push(originalTerm)
          matchScore += 3
        }
      }
    }
    
    // Пропускаем, если нет совпадений
    if (matchedTerms.length === 0) {
      continue
    }
    
    // Шаг 5: Персонализация
    const personalizationFactors = calculatePersonalization(item, userRole, interactions)
    
    // Бонус за популярность (логарифмический для плавности)
    const popularityBonus = Math.log10((item.purchaseCount || 1) + 1) * 2
    
    const relevanceScore = matchScore + popularityBonus
    const personalizedScore = relevanceScore + personalizationFactors.roleBonus + personalizationFactors.interactionBonus
    
    results.push({
      ...item,
      relevanceScore,
      personalizedScore,
      personalizationFactors,
      matchedTerms
    })
  }
  
  // Шаг 6: Сортировка по персонализированному скору
  results.sort((a, b) => b.personalizedScore - a.personalizedScore)
  
  const searchTimeMs = performance.now() - startTime
  
  return {
    results,
    typoCorrection,
    synonymExpansion,
    searchTimeMs,
    totalFound: results.length
  }
}

// =============================================================================
// ДИНАМИЧЕСКАЯ ИНДЕКСАЦИЯ
// =============================================================================

/**
 * Объяснение изменений в выдаче для пользователя
 */
export function explainRankingChanges(
  currentResults: SearchResult[],
  previousQuery: string,
  recentInteraction?: { steId: string; type: string }
): string[] {
  const explanations: string[] = []
  
  if (recentInteraction) {
    const item = steItems.find(i => i.id === recentInteraction.steId)
    if (item) {
      switch (recentInteraction.type) {
        case 'click':
          explanations.push(`Вы просмотрели "${item.name}" — похожие товары будут выше в выдаче`)
          break
        case 'purchase':
          explanations.push(`Вы приобрели "${item.name}" — система учтёт это для будущих рекомендаций`)
          break
        case 'positive':
          explanations.push(`Вы отметили "${item.name}" как полезный — приоритет повышен`)
          break
        case 'negative':
          explanations.push(`Вы отметили "${item.name}" как неподходящий — приоритет понижен`)
          break
      }
    }
  }
  
  // Объясняем топ-3 результата
  for (let i = 0; i < Math.min(3, currentResults.length); i++) {
    const result = currentResults[i]
    if (result.personalizationFactors.explanation.length > 0) {
      explanations.push(`#${i + 1} "${result.name}": ${result.personalizationFactors.explanation[0]}`)
    }
  }
  
  return explanations
}
