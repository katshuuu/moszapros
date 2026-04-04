import { NextRequest, NextResponse } from 'next/server'
import { query, ContractRecord, isDatabaseConfigured } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const steId = searchParams.get('ste_id')
    const buyerRegion = searchParams.get('buyer_region')
    const sellerRegion = searchParams.get('seller_region')
    const minAmount = searchParams.get('min_amount')
    const maxAmount = searchParams.get('max_amount')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        data: [],
        pagination: { limit, offset, count: 0, total: 0, hasMore: false },
        source: 'fallback',
        message: 'Database not configured'
      })
    }

    // Adapted to user's table structure: ste has (ste_id, name, category)
    let sql = `
      SELECT 
        c.contract_name,
        c.contract_id,
        c.ste_id,
        c.contract_date,
        c.contract_amount,
        c.inn_buyer,
        c.buyer_name,
        c.buyer_region,
        c.inn_seller,
        c.seller_name,
        c.seller_region,
        s.name as ste_name,
        s.category as ste_category
      FROM contracts c
      LEFT JOIN ste s ON c.ste_id = s.ste_id
      WHERE 1=1
    `
    const params: unknown[] = []
    let paramIndex = 1

    if (steId) {
      sql += ` AND c.ste_id = $${paramIndex}`
      params.push(parseInt(steId))
      paramIndex++
    }

    if (buyerRegion) {
      sql += ` AND c.buyer_region ILIKE $${paramIndex}`
      params.push(`%${buyerRegion}%`)
      paramIndex++
    }

    if (sellerRegion) {
      sql += ` AND c.seller_region ILIKE $${paramIndex}`
      params.push(`%${sellerRegion}%`)
      paramIndex++
    }

    if (minAmount) {
      sql += ` AND c.contract_amount >= $${paramIndex}`
      params.push(parseFloat(minAmount))
      paramIndex++
    }

    if (maxAmount) {
      sql += ` AND c.contract_amount <= $${paramIndex}`
      params.push(parseFloat(maxAmount))
      paramIndex++
    }

    if (dateFrom) {
      sql += ` AND c.contract_date >= $${paramIndex}`
      params.push(dateFrom)
      paramIndex++
    }

    if (dateTo) {
      sql += ` AND c.contract_date <= $${paramIndex}`
      params.push(dateTo)
      paramIndex++
    }

    sql += ` ORDER BY c.contract_date DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await query<ContractRecord & { ste_name: string; ste_category: string }>(sql, params)

    if (!result) {
      return NextResponse.json({
        data: [],
        pagination: { limit, offset, count: 0, total: 0, hasMore: false },
        source: 'error',
        error: 'Database query failed'
      })
    }

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM contracts c WHERE 1=1`
    const countParams: unknown[] = []
    let countParamIndex = 1

    if (steId) {
      countSql += ` AND c.ste_id = $${countParamIndex}`
      countParams.push(parseInt(steId))
      countParamIndex++
    }
    if (buyerRegion) {
      countSql += ` AND c.buyer_region ILIKE $${countParamIndex}`
      countParams.push(`%${buyerRegion}%`)
      countParamIndex++
    }
    if (sellerRegion) {
      countSql += ` AND c.seller_region ILIKE $${countParamIndex}`
      countParams.push(`%${sellerRegion}%`)
      countParamIndex++
    }
    if (minAmount) {
      countSql += ` AND c.contract_amount >= $${countParamIndex}`
      countParams.push(parseFloat(minAmount))
      countParamIndex++
    }
    if (maxAmount) {
      countSql += ` AND c.contract_amount <= $${countParamIndex}`
      countParams.push(parseFloat(maxAmount))
      countParamIndex++
    }

    const countResult = await query<{ total: string }>(countSql, countParams)
    const total = parseInt(countResult?.rows[0]?.total || '0')

    return NextResponse.json({
      data: result.rows.map(row => ({
        contractId: row.contract_id,
        contractName: row.contract_name,
        steId: row.ste_id,
        steName: row.ste_name,
        steCategory: row.ste_category,
        contractDate: row.contract_date,
        contractAmount: row.contract_amount,
        buyer: {
          inn: row.inn_buyer,
          name: row.buyer_name,
          region: row.buyer_region
        },
        seller: {
          inn: row.inn_seller,
          name: row.seller_name,
          region: row.seller_region
        }
      })),
      pagination: {
        limit,
        offset,
        count: result.rows.length,
        total,
        hasMore: offset + result.rows.length < total
      },
      source: 'database'
    })
  } catch (error) {
    console.error('[API] Contracts search error:', error)
    return NextResponse.json(
      { error: 'Failed to search contracts', data: [], source: 'error' },
      { status: 500 }
    )
  }
}

// Get contract statistics for a specific STE
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { steId } = body

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        stats: null,
        source: 'fallback',
        message: 'Database not configured'
      })
    }

    const result = await query<{
      total_contracts: string
      total_amount: string
      avg_amount: string
      min_amount: string
      max_amount: string
      unique_buyers: string
      unique_sellers: string
      first_contract: Date
      last_contract: Date
    }>(`
      SELECT 
        COUNT(*) as total_contracts,
        COALESCE(SUM(contract_amount), 0) as total_amount,
        COALESCE(AVG(contract_amount), 0) as avg_amount,
        COALESCE(MIN(contract_amount), 0) as min_amount,
        COALESCE(MAX(contract_amount), 0) as max_amount,
        COUNT(DISTINCT inn_buyer) as unique_buyers,
        COUNT(DISTINCT inn_seller) as unique_sellers,
        MIN(contract_date) as first_contract,
        MAX(contract_date) as last_contract
      FROM contracts
      WHERE ste_id = $1
    `, [steId])

    if (!result || result.rows.length === 0) {
      return NextResponse.json({
        stats: null,
        source: 'database'
      })
    }

    const row = result.rows[0]
    return NextResponse.json({
      stats: {
        totalContracts: parseInt(row.total_contracts),
        totalAmount: parseFloat(row.total_amount),
        avgAmount: parseFloat(row.avg_amount),
        minAmount: parseFloat(row.min_amount),
        maxAmount: parseFloat(row.max_amount),
        uniqueBuyers: parseInt(row.unique_buyers),
        uniqueSellers: parseInt(row.unique_sellers),
        firstContract: row.first_contract,
        lastContract: row.last_contract
      },
      source: 'database'
    })
  } catch (error) {
    console.error('[API] Contract stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract stats', stats: null, source: 'error' },
      { status: 500 }
    )
  }
}
