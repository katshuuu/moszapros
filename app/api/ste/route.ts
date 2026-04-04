import { NextRequest, NextResponse } from 'next/server'
import { query, STERecord, isDatabaseConfigured } from '@/lib/db'
import { steItems } from '@/lib/ste-data'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category') || ''

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      console.log('[API] Using fallback STE data')
      
      // Filter fallback data
      let filtered = steItems
      
      if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower)
        )
      }
      
      if (category && category !== 'Все категории') {
        filtered = filtered.filter(item => item.category === category)
      }
      
      const paginated = filtered.slice(offset, offset + limit)
      
      return NextResponse.json({
        data: paginated.map(item => ({
          ste_id: parseInt(item.id),
          name: item.name,
          category: item.category,
          // Additional fields from fallback data
          description: item.description,
          priceMin: item.priceMin,
          priceMax: item.priceMax,
          purchaseCount: item.purchaseCount
        })),
        pagination: {
          total: filtered.length,
          limit,
          offset,
          hasMore: offset + paginated.length < filtered.length
        },
        source: 'fallback'
      })
    }

    // Use PostgreSQL database
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
      WHERE 1=1
    `
    const params: unknown[] = []
    let paramIndex = 1

    if (search) {
      sql += ` AND (s.name ILIKE $${paramIndex} OR s.category ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (category && category !== 'Все категории') {
      sql += ` AND s.category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    sql += ` GROUP BY s.ste_id, s.name, s.category`
    sql += ` ORDER BY contract_count DESC NULLS LAST, s.ste_id`
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await query<STERecord & { 
      contract_count: string
      avg_price: string 
      min_price: string
      max_price: string
    }>(sql, params)

    if (!result) {
      // Fallback if query fails
      return NextResponse.json({
        data: [],
        pagination: { total: 0, limit, offset, hasMore: false },
        source: 'fallback',
        error: 'Database query failed'
      })
    }

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM ste WHERE 1=1`
    const countParams: unknown[] = []
    let countParamIndex = 1

    if (search) {
      countSql += ` AND (name ILIKE $${countParamIndex} OR category ILIKE $${countParamIndex})`
      countParams.push(`%${search}%`)
      countParamIndex++
    }

    if (category && category !== 'Все категории') {
      countSql += ` AND category = $${countParamIndex}`
      countParams.push(category)
    }

    const countResult = await query<{ total: string }>(countSql, countParams)
    const total = parseInt(countResult?.rows[0]?.total || '0')

    return NextResponse.json({
      data: result.rows.map(row => ({
        ste_id: row.ste_id,
        name: row.name,
        category: row.category,
        contractCount: parseInt(row.contract_count || '0'),
        avgPrice: parseFloat(row.avg_price || '0'),
        priceMin: parseFloat(row.min_price || '0'),
        priceMax: parseFloat(row.max_price || '0')
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + result.rows.length < total
      },
      source: 'database'
    })
  } catch (error) {
    console.error('[API] STE search error:', error)
    return NextResponse.json(
      { error: 'Failed to search STE', data: [], source: 'error' },
      { status: 500 }
    )
  }
}
