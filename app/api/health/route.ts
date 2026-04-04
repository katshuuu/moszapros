import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    const result = await query<{ now: Date; version: string }>(`
      SELECT NOW() as now, version() as version
    `)

    // Get table counts
    const tables = await query<{ tablename: string }>(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `)

    const tableCounts: Record<string, number> = {}
    for (const table of tables.rows) {
      try {
        const countResult = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${table.tablename}`
        )
        tableCounts[table.tablename] = parseInt(countResult.rows[0]?.count || '0')
      } catch {
        tableCounts[table.tablename] = -1 // Error getting count
      }
    }

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        serverTime: result.rows[0]?.now,
        version: result.rows[0]?.version?.split(' ')[0] + ' ' + result.rows[0]?.version?.split(' ')[1]
      },
      tables: tableCounts
    })
  } catch (error) {
    console.error('[API] Health check error:', error)
    return NextResponse.json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 503 })
  }
}
