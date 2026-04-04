import { NextRequest, NextResponse } from 'next/server'
import { query, ContractRecord } from '@/lib/db'

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
        s.ste_name,
        s.okpd2_code
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

    sql += ` ORDER BY c.contract_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await query<ContractRecord & { ste_name: string; okpd2_code: string }>(sql, params)

    return NextResponse.json({
      data: result.rows,
      pagination: {
        limit,
        offset,
        count: result.rows.length
      }
    })
  } catch (error) {
    console.error('[API] Contracts search error:', error)
    return NextResponse.json(
      { error: 'Failed to search contracts' },
      { status: 500 }
    )
  }
}
