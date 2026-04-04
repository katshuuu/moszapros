import { NextRequest, NextResponse } from 'next/server'
import { query, STERecord, isDatabaseConfigured } from '@/lib/db'
import { steItems, synonyms } from '@/lib/ste-data'
import { recommendationService } from '@/lib/ml/recommendation-service'

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

// Find closest word for typo correction
function correctTypo(word: string, dictionary: string[]): { corrected: string; wasChanged: boolean } {
  const lowerWord = word.toLowerCase()
  
  if (dictionary.includes(lowerWord)) {
    return { corrected: word, wasChanged: false }
  }
  
  let bestMatch = word
  let bestDistance = 3
  
  for (const dictWord of dictionary) {
    const distance = levenshtein(lowerWord, dictWord.toLowerCase())
    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = dictWord
    }
  }
  
  return { 
    corrected: bestDistance < 3 ? bestMatch : word, 
    wasChanged: bestDistance < 3 && bestMatch !== word 
  }
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
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { 
      query: searchQuery, 
      filters = {}, 
      userId,
      userINN,
      userRole,
      userHistory = [],
      categoryPreferences = [],
      contractHistory = [],
      interactions = [],
      useMLOptimization = true,
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
    
    // Typo correction
    const correctedWords = words.map(w => correctTypo(w, Object.keys(synonyms)))
    const hasTypoCorrection = correctedWords.some(c => c.wasChanged)
    const correctedQuery = hasTypoCorrection 
      ? correctedWords.map(c => c.corrected).join(' ')
      : null

    // Fallback mode
    if (!isDatabaseConfigured()) {
      console.log('[API] Search using fallback data')
      
      const results = steItems.filter(item => {
        const nameLower = item.name.toLowerCase()
        const descLower = item.description.toLowerCase()
        const catLower = item.category.toLowerCase()
        
        return allTerms.some(term => 
          nameLower.includes(term) || 
          descLower.includes(term) || 
          catLower.includes(term)
        )
      })

      let filteredResults = results
      if (filters.category && filters.category !== 'Все категории') {
        filteredResults = results.filter(r => r.category === filters.category)
      }

      const scoredResults = filteredResults.map(item => {
        let score = 0
        const nameLower = item.name.toLowerCase()
        
        for (const word of words) {
          if (nameLower.includes(word)) {
            score += nameLower.startsWith(word) ? 30 : 20
          }
        }
        score += (item.purchaseCount || 0) / 100

        return {
          ste_id: parseInt(item.id),
          name: item.name,
          category: item.category,
          description: item.description,
          priceMin: item.priceMin,
          priceMax: item.priceMax,
          purchaseCount: item.purchaseCount || 0,
          relevanceScore: score,
          textScore: score,
          personalizationScore: 0,
          personalizationReasons: []
        }
      })

      scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

      return NextResponse.json({
        query: {
          original: searchQuery,
          corrected: correctedQuery,
          stems,
          expanded: allTerms,
          typoCorrection: hasTypoCorrection ? {
            original: searchQuery,
            corrected: correctedQuery,
            wasChanged: true
          } : null
        },
        results: scoredResults.slice(offset, offset + limit),
        totalFound: scoredResults.length,
        searchTimeMs: Date.now() - startTime,
        source: 'fallback',
        mlOptimization: null
      })
    }

    // Database search
    const searchConditions = allTerms.map((_, i) => 
      `(s.name ILIKE $${i + 1} OR s.category ILIKE $${i + 1})`
    ).join(' OR ')
    
    const searchParams: unknown[] = allTerms.map(term => `%${term}%`)

    let sql = `
      SELECT 
        s.ste_id,
        s.name,
        s.category,
        COUNT(c.contract_id) as contract_count,
        COALESCE(AVG(c.contract_amount), 0) as avg_price,
        COALESCE(MIN(c.contract_amount), 0) as min_price,
        COALESCE(MAX(c.contract_amount), 0) as max_price
      FROM ste s
      LEFT JOIN contracts c ON s.ste_id = c.ste_id
      WHERE (${searchConditions})
    `

    let paramIndex = allTerms.length + 1
    if (filters.category && filters.category !== 'Все категории') {
      sql += ` AND s.category = $${paramIndex}`
      searchParams.push(filters.category)
      paramIndex++
    }

    sql += ` GROUP BY s.ste_id, s.name, s.category`
    sql += ` ORDER BY contract_count DESC NULLS LAST, s.ste_id`
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    searchParams.push(limit * 2, 0) // Get more results for ML optimization

    const result = await query<STERecord & { 
      contract_count: string
      avg_price: string 
      min_price: string
      max_price: string
    }>(sql, searchParams)

    if (!result) {
      return NextResponse.json({
        query: { original: searchQuery, corrected: correctedQuery },
        results: [],
        totalFound: 0,
        searchTimeMs: Date.now() - startTime,
        source: 'error',
        error: 'Database query failed'
      })
    }

    // Calculate base text scores
    const baseResults = result.rows.map(row => {
      let textScore = 0
      const nameLower = row.name.toLowerCase()
      
      for (const word of words) {
        if (nameLower.includes(word)) {
          textScore += nameLower.startsWith(word) ? 30 : 20
        }
      }
      for (const stem of stems) {
        if (nameLower.includes(stem)) {
          textScore += 15
        }
      }

      const contractCount = parseInt(row.contract_count || '0')
      textScore += Math.min(contractCount / 10, 20)

      return {
        ste_id: row.ste_id,
        name: row.name,
        category: row.category,
        contractCount,
        avgPrice: parseFloat(row.avg_price || '0'),
        minPrice: parseFloat(row.min_price || '0'),
        maxPrice: parseFloat(row.max_price || '0'),
        textScore
      }
    })

    // Get all categories for GA
    const categoriesResult = await query<{ category: string }>(
      'SELECT DISTINCT category FROM ste WHERE category IS NOT NULL'
    )
    const allCategories = categoriesResult?.rows.map(r => r.category) || []

    // Apply ML optimization if user has history
    let finalResults
    let mlOptimization = null

    if (useMLOptimization && (categoryPreferences.length > 0 || contractHistory.length > 0)) {
      console.log('[API] Applying ML optimization (GA + RL + LSTM)')
      
      const optimized = await recommendationService.optimizeSearch(
        baseResults,
        {
          query: searchQuery,
          userId,
          userINN,
          userRole,
          categoryPreferences,
          contractHistory,
          interactions,
          filters
        },
        allCategories
      )

      finalResults = optimized.results.map(r => ({
        ste_id: r.ste_id,
        name: r.name,
        category: r.category,
        contractCount: r.contractCount,
        avgPrice: r.avgPrice,
        priceMin: r.minPrice,
        priceMax: r.maxPrice,
        relevanceScore: Math.round(r.finalScore * 100),
        personalizationScore: Math.round(
          (r.scoreBreakdown.categoryScore + r.scoreBreakdown.historyScore) * 100
        ),
        personalizationReasons: r.rankingReasons,
        mlScoreBreakdown: r.scoreBreakdown,
        mlFactors: {
          ga: optimized.meta.gaCategories.includes(r.category) ? {
            categoryMatch: true,
            fitness: optimized.meta.gaFitness,
            reason: `Категория "${r.category}" оптимальна для вашего профиля`
          } : undefined,
          rl: r.scoreBreakdown.rlScore > 0 ? {
            qValue: r.scoreBreakdown.rlScore,
            reward: r.scoreBreakdown.rlScore * 10,
            reason: 'Система обучилась на ваших предпочтениях'
          } : undefined,
          lstm: r.scoreBreakdown.lstmScore > 0.3 ? {
            score: r.scoreBreakdown.lstmScore,
            temporalBoost: r.scoreBreakdown.lstmScore * 0.2,
            reason: 'Учтена последовательность ваших действий'
          } : undefined,
          personalization: {
            historyBoost: Math.round(r.scoreBreakdown.historyScore * 100),
            categoryBoost: Math.round(r.scoreBreakdown.categoryScore * 100),
            purchaseBoost: contractHistory.some((c: { steId: number }) => c.steId === r.ste_id) ? 25 : 0,
            roleBoost: 0,
            explanations: r.rankingReasons
          }
        }
      }))

      mlOptimization = {
        enabled: true,
        gaCategories: optimized.meta.gaCategories,
        gaFitness: optimized.meta.gaFitness,
        rlTotalReward: optimized.meta.rlTotalReward,
        optimizationTimeMs: optimized.meta.searchTimeMs,
        steps: optimized.meta.optimizationSteps
      }
    } else {
      // Basic personalization without ML
      finalResults = baseResults.map(row => {
        let personalizationScore = 0
        const personalizationReasons: string[] = []

        if (contractHistory && contractHistory.length > 0) {
          for (const contract of contractHistory) {
            if (contract.steId === row.ste_id) {
              personalizationScore += 25
              personalizationReasons.push(`Вы закупали этот товар ${contract.count} раз`)
            }
            if (contract.category === row.category) {
              personalizationScore += 8
              if (!personalizationReasons.some(r => r.includes('категории'))) {
                personalizationReasons.push(`Вы часто закупаете товары категории "${contract.category}"`)
              }
            }
          }
        }

        if (categoryPreferences && categoryPreferences.length > 0) {
          const catPref = categoryPreferences.find(
            (cp: { category: string; count: number }) => cp.category === row.category
          )
          if (catPref) {
            personalizationScore += Math.min(catPref.count * 2, 15)
            if (!personalizationReasons.some(r => r.includes('категории'))) {
              personalizationReasons.push(`${catPref.count} контрактов в этой категории`)
            }
          }
        }

        return {
          ste_id: row.ste_id,
          name: row.name,
          category: row.category,
          contractCount: row.contractCount,
          avgPrice: row.avgPrice,
          priceMin: row.minPrice,
          priceMax: row.maxPrice,
          relevanceScore: row.textScore + personalizationScore,
          personalizationScore,
          personalizationReasons: [...new Set(personalizationReasons)]
        }
      })

      finalResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM ste s WHERE (${searchConditions})`
    const countParams = allTerms.map(term => `%${term}%`)
    
    if (filters.category && filters.category !== 'Все категории') {
      countSql += ` AND s.category = $${allTerms.length + 1}`
      countParams.push(filters.category)
    }

    const countResult = await query<{ total: string }>(countSql, countParams)
    const totalFound = parseInt(countResult?.rows[0]?.total || String(finalResults.length))

    return NextResponse.json({
      query: {
        original: searchQuery,
        corrected: correctedQuery,
        stems,
        expanded: allTerms,
        typoCorrection: hasTypoCorrection ? {
          original: searchQuery,
          corrected: correctedQuery,
          wasChanged: true
        } : null
      },
      results: finalResults.slice(offset, offset + limit),
      totalFound,
      searchTimeMs: Date.now() - startTime,
      source: 'database',
      mlOptimization
    })
  } catch (error) {
    console.error('[API] Search error:', error)
    return NextResponse.json(
      { 
        error: 'Search failed', 
        results: [],
        totalFound: 0,
        searchTimeMs: Date.now() - startTime,
        source: 'error'
      },
      { status: 500 }
    )
  }
}
