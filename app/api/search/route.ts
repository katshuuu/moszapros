import { NextRequest, NextResponse } from 'next/server'
import { query, STERecord } from '@/lib/db'

// Simple Russian stemming (Porter-like)
function stemRussian(word: string): string {
  const endings = [
    'ами', 'ями', 'ого', 'его', 'ому', 'ему', 'ым', 'им', 'ых', 'их',
    'ую', 'юю', 'ая', 'яя', 'ое', 'ее', 'ие', 'ые', 'ой', 'ей',
    'ов', 'ев', 'ий', 'ый', 'ая', 'ой', 'ей', 'ию', 'ью',
    'ам', 'ям', 'ах', 'ях', 'ом', 'ем', 'ей', 'ью', 'ия', 'ья',
    'ие', 'ье', 'ии', 'ьи', 'ию', 'ью', 'ов', 'ев', 'ей',
    'а', 'я', 'о', 'е', 'и', 'ы', 'у', 'ю', 'й', 'ь'
  ]
  
  let result = word.toLowerCase()
  for (const ending of endings) {
    if (result.endsWith(ending) && result.length > ending.length + 2) {
      result = result.slice(0, -ending.length)
      break
    }
  }
  return result
}

// Levenshtein distance for typo correction
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

// Synonyms dictionary
const synonyms: Record<string, string[]> = {
  'бумага': ['бумажный', 'писчая', 'офисная', 'ватман', 'картон'],
  'компьютер': ['пк', 'ноутбук', 'ПК', 'эвм', 'моноблок', 'системный блок'],
  'принтер': ['мфу', 'печатающее устройство', 'копир'],
  'стол': ['столик', 'парта', 'рабочее место'],
  'стул': ['кресло', 'табурет', 'сиденье'],
  'канцелярия': ['канцтовары', 'офисные принадлежности', 'письменные принадлежности'],
  'медицина': ['медицинский', 'лекарства', 'препараты', 'фармацевтика'],
  'лампа': ['светильник', 'освещение', 'люстра', 'бра'],
  'шкаф': ['тумба', 'гардероб', 'комод', 'пенал'],
  'монитор': ['дисплей', 'экран'],
  'телефон': ['смартфон', 'мобильный', 'сотовый'],
  'маска': ['респиратор', 'средство защиты'],
  'перчатки': ['рукавицы', 'варежки'],
  'дезинфектор': ['дезинфицирующий', 'антисептик', 'санитайзер'],
}

function expandWithSynonyms(word: string): string[] {
  const lowerWord = word.toLowerCase()
  const result = [word]
  
  for (const [key, values] of Object.entries(synonyms)) {
    if (lowerWord.includes(key) || key.includes(lowerWord)) {
      result.push(...values)
    }
    for (const syn of values) {
      if (lowerWord.includes(syn) || syn.includes(lowerWord)) {
        result.push(key, ...values.filter(v => v !== syn))
      }
    }
  }
  
  return [...new Set(result)]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      query: searchQuery, 
      filters = {}, 
      userId,
      userRole,
      userHistory = [],
      limit = 50,
      offset = 0 
    } = body

    if (!searchQuery || searchQuery.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Process query: stem words, expand with synonyms
    const words = searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
    const stems = words.map(stemRussian)
    const expanded = words.flatMap(expandWithSynonyms)
    const allTerms = [...new Set([...words, ...stems, ...expanded])]

    // Build search conditions
    const searchConditions = allTerms.map((_, i) => 
      `(ste_name ILIKE $${i + 1} OR okpd2_name ILIKE $${i + 1})`
    ).join(' OR ')
    
    const searchParams = allTerms.map(term => `%${term}%`)

    let sql = `
      SELECT 
        ste_id,
        ste_name,
        okpd2_code,
        okpd2_name,
        unit,
        category,
        (
          SELECT COUNT(*) FROM contracts c WHERE c.ste_id = ste.ste_id
        ) as contract_count,
        (
          SELECT AVG(contract_amount) FROM contracts c WHERE c.ste_id = ste.ste_id
        ) as avg_price
      FROM ste
      WHERE ${searchConditions}
    `

    // Add category filter
    let paramIndex = allTerms.length + 1
    if (filters.category) {
      sql += ` AND category = $${paramIndex}`
      searchParams.push(filters.category)
      paramIndex++
    }

    sql += ` ORDER BY contract_count DESC NULLS LAST, ste_id`
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    searchParams.push(limit.toString(), offset.toString())

    const result = await query<STERecord & { contract_count: string; avg_price: string }>(sql, searchParams)

    // Calculate relevance scores with personalization
    const scoredResults = result.rows.map(row => {
      let baseScore = 0
      
      // Text match scoring
      const nameLower = row.ste_name.toLowerCase()
      for (const word of words) {
        if (nameLower.includes(word)) {
          baseScore += nameLower.startsWith(word) ? 30 : 20
        }
      }
      for (const stem of stems) {
        if (nameLower.includes(stem)) {
          baseScore += 15
        }
      }

      // Popularity boost
      const contractCount = parseInt(row.contract_count || '0')
      baseScore += Math.min(contractCount / 100, 20)

      // Personalization boost based on user history
      let personalizationScore = 0
      const personalizationReasons: string[] = []

      if (userHistory && userHistory.length > 0) {
        // Check if user has interacted with similar categories
        for (const historyItem of userHistory) {
          if (historyItem.category === row.category) {
            personalizationScore += 10
            personalizationReasons.push('Вы часто просматриваете товары этой категории')
          }
          if (historyItem.steId === row.ste_id) {
            personalizationScore += 15
            personalizationReasons.push('Вы ранее взаимодействовали с этим товаром')
          }
        }
      }

      // Role-based boost
      if (userRole === 'buyer' && contractCount > 100) {
        personalizationScore += 5
        personalizationReasons.push('Популярно среди покупателей')
      }

      return {
        ...row,
        contractCount,
        avgPrice: parseFloat(row.avg_price || '0'),
        relevanceScore: baseScore + personalizationScore,
        personalizationScore,
        personalizationReasons: [...new Set(personalizationReasons)]
      }
    })

    // Sort by total score
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return NextResponse.json({
      query: {
        original: searchQuery,
        stems,
        expanded: allTerms,
        corrections: [] // TODO: implement typo detection
      },
      results: scoredResults,
      pagination: {
        limit,
        offset,
        count: scoredResults.length
      }
    })
  } catch (error) {
    console.error('[API] Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
