import { NextResponse } from 'next/server'
import { query, isDatabaseConfigured } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || 'бумага'

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      status: 'fallback',
      message: 'Database not configured - using demo data'
    })
  }

  try {
    // 1. Проверяем общее количество записей в ste
    const totalCount = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM ste'
    )

    // 2. Ищем товары по запросу (ILIKE для регистронезависимого поиска)
    const searchResults = await query<{ ste_id: string; name: string; category: string }>(
      `SELECT ste_id::text, name, category 
       FROM ste 
       WHERE name ILIKE $1 OR category ILIKE $1
       LIMIT 20`,
      [`%${q}%`]
    )

    // 3. Считаем сколько всего товаров найдено по запросу
    const matchCount = await query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM ste 
       WHERE name ILIKE $1 OR category ILIKE $1`,
      [`%${q}%`]
    )

    // 4. Проверяем конкретный товар из результатов db-status
    const specificItem = await query<{ ste_id: string; name: string; category: string }>(
      `SELECT ste_id::text, name, category FROM ste WHERE ste_id = 28369665`
    )

    return NextResponse.json({
      status: 'success',
      searchQuery: q,
      database: {
        totalSteRecords: totalCount[0]?.count || '0',
        message: `Приложение имеет доступ ко всем ${totalCount[0]?.count} записям таблицы ste`
      },
      searchResults: {
        found: matchCount[0]?.count || '0',
        message: `По запросу "${q}" найдено ${matchCount[0]?.count} товаров из ${totalCount[0]?.count}`,
        samples: searchResults
      },
      verification: {
        specificItemExists: specificItem.length > 0,
        specificItem: specificItem[0] || null,
        message: specificItem.length > 0 
          ? `Товар ste_id=28369665 найден: "${specificItem[0]?.name}"`
          : 'Товар не найден'
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
