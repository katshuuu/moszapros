import { NextRequest, NextResponse } from 'next/server'
import { query, STERecord } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category') || ''

    let sql = `
      SELECT ste_id, ste_name, okpd2_code, okpd2_name, unit, category
      FROM ste
      WHERE 1=1
    `
    const params: unknown[] = []
    let paramIndex = 1

    if (search) {
      // Full-text search with Russian morphology
      sql += ` AND (
        ste_name ILIKE $${paramIndex} 
        OR okpd2_name ILIKE $${paramIndex}
        OR okpd2_code ILIKE $${paramIndex}
      )`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (category) {
      sql += ` AND category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    sql += ` ORDER BY ste_id LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await query<STERecord>(sql, params)

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM ste WHERE 1=1`
    const countParams: unknown[] = []
    let countParamIndex = 1

    if (search) {
      countSql += ` AND (
        ste_name ILIKE $${countParamIndex} 
        OR okpd2_name ILIKE $${countParamIndex}
        OR okpd2_code ILIKE $${countParamIndex}
      )`
      countParams.push(`%${search}%`)
      countParamIndex++
    }

    if (category) {
      countSql += ` AND category = $${countParamIndex}`
      countParams.push(category)
    }

    const countResult = await query<{ total: string }>(countSql, countParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    return NextResponse.json({
      data: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + result.rows.length < total
      }
    })
  } catch (error) {
    console.error('[API] STE search error:', error)
    return NextResponse.json(
      { error: 'Failed to search STE' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ste_name, okpd2_code, okpd2_name, unit, category } = body

    const result = await query<STERecord>(
      `INSERT INTO ste (ste_name, okpd2_code, okpd2_name, unit, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ste_name, okpd2_code, okpd2_name, unit, category]
    )

    return NextResponse.json({ data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[API] STE create error:', error)
    return NextResponse.json(
      { error: 'Failed to create STE' },
      { status: 500 }
    )
  }
}
