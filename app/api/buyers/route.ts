import { NextRequest, NextResponse } from 'next/server'
import { query, isDatabaseConfigured } from '@/lib/db'

interface BuyerRow {
  inn_buyer: string
  buyer_name: string
  buyer_region: string
  contracts_count: string
  total_amount: string
}

// GET /api/buyers - Get list of unique buyers from contracts
export async function GET() {
  if (!isDatabaseConfigured()) {
    // Return demo buyers for fallback mode
    return NextResponse.json({
      buyers: [
        {
          inn: '7710140679',
          name: 'ООО "Демо Компания 1"',
          region: 'г. Москва',
          contractsCount: 15,
          totalAmount: 2500000
        },
        {
          inn: '7728662669',
          name: 'ООО "Демо Компания 2"',
          region: 'г. Москва',
          contractsCount: 8,
          totalAmount: 1200000
        }
      ],
      source: 'fallback'
    })
  }

  try {
    const result = await query<BuyerRow>(`
      SELECT 
        inn_buyer::text as inn_buyer,
        buyer_name,
        buyer_region,
        COUNT(*)::text as contracts_count,
        SUM(contract_amount)::text as total_amount
      FROM contracts
      GROUP BY inn_buyer, buyer_name, buyer_region
      ORDER BY COUNT(*) DESC
      LIMIT 50
    `)

    if (!result) {
      return NextResponse.json({ buyers: [], source: 'error' })
    }

    const buyers = result.rows.map(row => ({
      inn: row.inn_buyer,
      name: row.buyer_name || `Организация ИНН ${row.inn_buyer}`,
      region: row.buyer_region || 'Регион не указан',
      contractsCount: parseInt(row.contracts_count) || 0,
      totalAmount: parseFloat(row.total_amount) || 0
    }))

    return NextResponse.json({
      buyers,
      source: 'database',
      total: buyers.length
    })
  } catch (error) {
    console.error('[API] Buyers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buyers', buyers: [] },
      { status: 500 }
    )
  }
}

// POST /api/buyers - Login by INN and get buyer info with contract history
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { inn } = body

  if (!inn) {
    return NextResponse.json({ error: 'INN is required' }, { status: 400 })
  }

  if (!isDatabaseConfigured()) {
    // Fallback mode - accept any INN for demo
    return NextResponse.json({
      success: true,
      buyer: {
        inn,
        name: `Демо организация ИНН ${inn}`,
        region: 'г. Москва',
        contractsCount: 5,
        totalAmount: 500000
      },
      contractHistory: [],
      source: 'fallback'
    })
  }

  try {
    // Get buyer info
    const buyerResult = await query<BuyerRow>(`
      SELECT 
        inn_buyer::text as inn_buyer,
        buyer_name,
        buyer_region,
        COUNT(*)::text as contracts_count,
        SUM(contract_amount)::text as total_amount
      FROM contracts
      WHERE inn_buyer = $1
      GROUP BY inn_buyer, buyer_name, buyer_region
    `, [inn])

    if (!buyerResult || buyerResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'INN not found in contracts database' 
      }, { status: 404 })
    }

    const buyerRow = buyerResult.rows[0]

    // Get contract history with STE categories for personalization
    const historyResult = await query<{
      ste_id: number
      ste_name: string
      category: string
      contract_count: string
      total_amount: string
      last_contract_date: Date
    }>(`
      SELECT 
        c.ste_id,
        s.name as ste_name,
        s.category,
        COUNT(*)::text as contract_count,
        SUM(c.contract_amount)::text as total_amount,
        MAX(c.contract_date) as last_contract_date
      FROM contracts c
      JOIN ste s ON c.ste_id = s.ste_id
      WHERE c.inn_buyer = $1
      GROUP BY c.ste_id, s.name, s.category
      ORDER BY COUNT(*) DESC
      LIMIT 50
    `, [inn])

    // Get category preferences for personalization
    const categoryResult = await query<{
      category: string
      category_count: string
      total_spent: string
    }>(`
      SELECT 
        s.category,
        COUNT(*)::text as category_count,
        SUM(c.contract_amount)::text as total_spent
      FROM contracts c
      JOIN ste s ON c.ste_id = s.ste_id
      WHERE c.inn_buyer = $1
      GROUP BY s.category
      ORDER BY COUNT(*) DESC
    `, [inn])

    return NextResponse.json({
      success: true,
      buyer: {
        inn: buyerRow.inn_buyer,
        name: buyerRow.buyer_name || `Организация ИНН ${buyerRow.inn_buyer}`,
        region: buyerRow.buyer_region || 'Регион не указан',
        contractsCount: parseInt(buyerRow.contracts_count) || 0,
        totalAmount: parseFloat(buyerRow.total_amount) || 0
      },
      contractHistory: historyResult?.rows || [],
      categoryPreferences: categoryResult?.rows || [],
      source: 'database'
    })
  } catch (error) {
    console.error('[API] Buyer login error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate', success: false },
      { status: 500 }
    )
  }
}
