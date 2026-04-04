import { NextRequest, NextResponse } from 'next/server'
import { query, STERecord, isDatabaseConfigured } from '@/lib/db'
import { steItems, synonyms } from '@/lib/ste-data'
import { 
  runSearchPipeline, 
  calculateTextScore,
  generateItemExplanation 
} from '@/lib/search/search-pipeline'
import { UserInteraction } from '@/lib/search/behavioral-signals'

// Simple Russian stemming
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

      // Transform to RetrievalResult format
      const retrievalResults = filteredResults.map(item => {
        const { score, matchedTerms } = calculateTextScore(
          item.name, 
          item.category, 
          allTerms
        )
        
        return {
          steId: parseInt(item.id),
          name: item.name,
          category: item.category,
          textScore: score,
          contractCount: item.purchaseCount || 0,
          avgPrice: (item.priceMin + item.priceMax) / 2,
          minPrice: item.priceMin,
          maxPrice: item.priceMax
        }
      })

      // Run search pipeline with personalization
      const userInteractions: UserInteraction[] = interactions.map((i: { steId: string; type: string; timestamp?: string }) => ({
        steId: parseInt(i.steId),
        steName: '',
        category: '',
        signalType: i.type,
        timestamp: new Date(i.timestamp || Date.now()),
        weight: 1
      }))

      const pipelineResult = runSearchPipeline({
        query: searchQuery,
        results: retrievalResults,
        userInteractions,
        contractHistory,
        categoryPreferences
      })

      // Format results for frontend
      const formattedResults = pipelineResult.results.map(r => ({
        ste_id: r.steId,
        name: r.name,
        category: r.category,
        description: filteredResults.find(f => parseInt(f.id) === r.steId)?.description || '',
        priceMin: r.minPrice,
        priceMax: r.maxPrice,
        purchaseCount: r.contractCount,
        relevanceScore: Math.round(r.finalScore),
        textScore: Math.round(r.scoreBreakdown.textScore),
        personalizationScore: Math.round(r.scoreBreakdown.personalizationScore),
        personalizationReasons: r.explanations,
        positionChange: r.positionChange,
        originalPosition: r.originalPosition,
        scoreBreakdown: {
          text: r.scoreBreakdown.textScore,
          typo: r.scoreBreakdown.typoBonus,
          synonym: r.scoreBreakdown.synonymBonus,
          popularity: r.scoreBreakdown.popularityScore,
          personalization: r.scoreBreakdown.personalizationScore,
          itemBoost: r.scoreBreakdown.itemBoost,
          categoryBoost: r.scoreBreakdown.categoryBoost
        },
        signalStrength: r.personalizationFactors.signalStrength
      }))

      return NextResponse.json({
        query: {
          original: searchQuery,
          corrected: pipelineResult.pipeline.typoCorrection.wasChanged 
            ? pipelineResult.pipeline.typoCorrection.corrected 
            : null,
          stems,
          expanded: allTerms,
          typoCorrection: pipelineResult.pipeline.typoCorrection
        },
        results: formattedResults.slice(offset, offset + limit),
        totalFound: formattedResults.length,
        searchTimeMs: Date.now() - startTime,
        source: 'fallback',
        pipeline: {
          typoCorrection: pipelineResult.pipeline.typoCorrection,
          synonymExpansion: pipelineResult.pipeline.synonymExpansion,
          userProfile: pipelineResult.pipeline.userProfile,
          rerankingSummary: pipelineResult.pipeline.rerankingSummary,
          explanationForUser: pipelineResult.explanationForUser,
          pipelineTimeMs: pipelineResult.pipelineTimeMs
        }
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
    searchParams.push(limit * 3, 0) // Get more for reranking

    const result = await query<STERecord & { 
      contract_count: string
      avg_price: string 
      min_price: string
      max_price: string
    }>(sql, searchParams)

    if (!result) {
      return NextResponse.json({
        query: { original: searchQuery },
        results: [],
        totalFound: 0,
        searchTimeMs: Date.now() - startTime,
        source: 'error',
        error: 'Database query failed'
      })
    }

    // Transform to RetrievalResult format
    const retrievalResults = result.rows.map(row => {
      const { score } = calculateTextScore(row.name, row.category, allTerms)
      
      return {
        steId: row.ste_id,
        name: row.name,
        category: row.category,
        textScore: score,
        contractCount: parseInt(row.contract_count || '0'),
        avgPrice: parseFloat(row.avg_price || '0'),
        minPrice: parseFloat(row.min_price || '0'),
        maxPrice: parseFloat(row.max_price || '0')
      }
    })

    // Build user interactions for pipeline
    const userInteractions: UserInteraction[] = interactions.map((i: { steId: string; type: string; timestamp?: string }) => ({
      steId: parseInt(i.steId),
      steName: '',
      category: '',
      signalType: i.type,
      timestamp: new Date(i.timestamp || Date.now()),
      weight: 1
    }))

    // Run search pipeline with personalization
    const pipelineResult = runSearchPipeline({
      query: searchQuery,
      results: retrievalResults,
      userInteractions,
      contractHistory,
      categoryPreferences
    })

    // Format results for frontend
    const formattedResults = pipelineResult.results.map(r => {
      const itemExplanations = generateItemExplanation(r, pipelineResult)
      
      return {
        ste_id: r.steId,
        name: r.name,
        category: r.category,
        contractCount: r.contractCount,
        avgPrice: r.avgPrice,
        priceMin: r.minPrice,
        priceMax: r.maxPrice,
        relevanceScore: Math.round(r.finalScore),
        textScore: Math.round(r.scoreBreakdown.textScore),
        personalizationScore: Math.round(r.scoreBreakdown.personalizationScore),
        personalizationReasons: [...r.explanations, ...itemExplanations].slice(0, 5),
        positionChange: r.positionChange,
        originalPosition: r.originalPosition,
        newPosition: r.newPosition,
        scoreBreakdown: {
          text: Math.round(r.scoreBreakdown.textScore),
          typo: Math.round(r.scoreBreakdown.typoBonus),
          synonym: Math.round(r.scoreBreakdown.synonymBonus),
          popularity: Math.round(r.scoreBreakdown.popularityScore),
          personalization: Math.round(r.scoreBreakdown.personalizationScore),
          itemBoost: Math.round(r.scoreBreakdown.itemBoost),
          categoryBoost: Math.round(r.scoreBreakdown.categoryBoost)
        },
        signalStrength: r.personalizationFactors.signalStrength,
        personalizationFactors: r.personalizationFactors
      }
    })

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM ste s WHERE (${searchConditions})`
    const countParams = allTerms.map(term => `%${term}%`)
    
    if (filters.category && filters.category !== 'Все категории') {
      countSql += ` AND s.category = $${allTerms.length + 1}`
      countParams.push(filters.category)
    }

    const countResult = await query<{ total: string }>(countSql, countParams)
    const totalFound = parseInt(countResult?.rows[0]?.total || String(formattedResults.length))

    return NextResponse.json({
      query: {
        original: searchQuery,
        corrected: pipelineResult.pipeline.typoCorrection.wasChanged 
          ? pipelineResult.pipeline.typoCorrection.corrected 
          : null,
        stems,
        expanded: allTerms,
        typoCorrection: pipelineResult.pipeline.typoCorrection
      },
      results: formattedResults.slice(offset, offset + limit),
      totalFound,
      searchTimeMs: Date.now() - startTime,
      source: 'database',
      pipeline: {
        typoCorrection: pipelineResult.pipeline.typoCorrection,
        synonymExpansion: pipelineResult.pipeline.synonymExpansion,
        userProfile: pipelineResult.pipeline.userProfile,
        rerankingSummary: pipelineResult.pipeline.rerankingSummary,
        explanationForUser: pipelineResult.explanationForUser,
        pipelineTimeMs: pipelineResult.pipelineTimeMs
      }
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
