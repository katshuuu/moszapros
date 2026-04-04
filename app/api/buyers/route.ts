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
          name: 'ГБУЗ "Городская поликлиника №1"',
          region: 'г. Москва',
          contractsCount: 45,
          totalAmount: 12500000
        },
        {
          inn: '7728662669',
          name: 'ГБОУ "Школа №1234"',
          region: 'г. Москва',
          contractsCount: 28,
          totalAmount: 5600000
        },
        {
          inn: '7701234567',
          name: 'ГКУ "Дирекция по строительству"',
          region: 'г. Москва',
          contractsCount: 67,
          totalAmount: 45000000
        },
        {
          inn: '7705111222',
          name: 'ГБУК "Московский музей"',
          region: 'г. Москва',
          contractsCount: 12,
          totalAmount: 3200000
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
    // Fallback mode - use demo data based on INN
    const demoBuyers: Record<string, { name: string; region: string; contractsCount: number; totalAmount: number; categories: string[] }> = {
      '7710140679': {
        name: 'ГБУЗ "Городская поликлиника №1"',
        region: 'г. Москва',
        contractsCount: 45,
        totalAmount: 12500000,
        categories: ['Медицинское оборудование', 'Медикаменты', 'Расходные материалы']
      },
      '7728662669': {
        name: 'ГБОУ "Школа №1234"',
        region: 'г. Москва',
        contractsCount: 28,
        totalAmount: 5600000,
        categories: ['Канцелярские товары', 'Учебное оборудование', 'Мебель']
      },
      '7701234567': {
        name: 'ГКУ "Дирекция по строительству"',
        region: 'г. Москва',
        contractsCount: 67,
        totalAmount: 45000000,
        categories: ['Строительные материалы', 'Инструменты', 'Спецодежда']
      },
      '7705111222': {
        name: 'ГБУК "Московский музей"',
        region: 'г. Москва',
        contractsCount: 12,
        totalAmount: 3200000,
        categories: ['Канцелярские товары', 'Офисная техника', 'Хозтовары']
      }
    }
    
    const demoData = demoBuyers[inn] || {
      name: `Организация ИНН ${inn}`,
      region: 'г. Москва',
      contractsCount: 10,
      totalAmount: 1000000,
      categories: ['Канцелярские товары', 'Хозтовары']
    }
    
    return NextResponse.json({
      success: true,
      buyer: {
        inn,
        name: demoData.name,
        region: demoData.region,
        contractsCount: demoData.contractsCount,
        totalAmount: demoData.totalAmount
      },
      contractHistory: demoData.categories.map((cat, i) => ({
        ste_id: i + 1,
        ste_name: `Товар из категории ${cat}`,
        category: cat,
        contract_count: String(Math.floor(demoData.contractsCount / demoData.categories.length))
      })),
      categoryPreferences: demoData.categories.map((cat, i) => ({
        category: cat,
        category_count: String(Math.floor(demoData.contractsCount / demoData.categories.length)),
        total_spent: String(demoData.totalAmount / demoData.categories.length)
      })),
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
