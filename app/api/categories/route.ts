import { NextResponse } from 'next/server'
import { query, isDatabaseConfigured } from '@/lib/db'
import { categories as fallbackCategories } from '@/lib/ste-data'

export async function GET() {
  try {
    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        categories: fallbackCategories,
        source: 'fallback'
      })
    }

    // Get unique categories from database
    const result = await query<{ category: string; count: string }>(`
      SELECT 
        category, 
        COUNT(*) as count 
      FROM ste 
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category 
      ORDER BY count DESC
    `)

    if (!result || result.rows.length === 0) {
      return NextResponse.json({
        categories: fallbackCategories,
        source: 'fallback'
      })
    }

    const categories = [
      'Все категории',
      ...result.rows.map(r => r.category)
    ]

    return NextResponse.json({
      categories,
      counts: result.rows.reduce((acc, r) => {
        acc[r.category] = parseInt(r.count)
        return acc
      }, {} as Record<string, number>),
      source: 'database'
    })
  } catch (error) {
    console.error('[API] Categories error:', error)
    return NextResponse.json({
      categories: fallbackCategories,
      source: 'error'
    })
  }
}
