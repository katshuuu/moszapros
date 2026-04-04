import { NextResponse } from 'next/server'
import { testConnection, isDatabaseConfigured, query } from '@/lib/db'

export async function GET() {
  // Check if database is configured
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      status: 'healthy',
      mode: 'fallback',
      database: {
        connected: false,
        message: 'DATABASE_URL not configured - using local fallback data'
      },
      features: {
        search: 'active (local)',
        personalization: 'active (local)',
        history: 'active (local)',
        metrics: 'active (local)'
      }
    })
  }

  // Try to connect to database
  const connectionTest = await testConnection()

  if (!connectionTest.connected) {
    return NextResponse.json({
      status: 'healthy',
      mode: 'fallback',
      database: {
        connected: false,
        error: connectionTest.error,
        message: 'Database unavailable - using local fallback data'
      },
      features: {
        search: 'active (local)',
        personalization: 'active (local)',
        history: 'active (local)',
        metrics: 'active (local)'
      }
    })
  }

  try {
    // Get database info
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
    if (tables) {
      for (const table of tables.rows) {
        try {
          const countResult = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM ${table.tablename}`
          )
          tableCounts[table.tablename] = parseInt(countResult?.rows[0]?.count || '0')
        } catch {
          tableCounts[table.tablename] = -1
        }
      }
    }

    return NextResponse.json({
      status: 'healthy',
      mode: 'database',
      database: {
        connected: true,
        serverTime: result?.rows[0]?.now,
        version: result?.rows[0]?.version?.split(' ').slice(0, 2).join(' ')
      },
      tables: tableCounts,
      features: {
        search: 'active (database)',
        personalization: 'active (database)',
        history: 'active (database)',
        metrics: 'active (database)'
      }
    })
  } catch (error) {
    console.error('[API] Health check error:', error)
    return NextResponse.json({
      status: 'healthy',
      mode: 'fallback',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      features: {
        search: 'active (local)',
        personalization: 'active (local)',
        history: 'active (local)',
        metrics: 'active (local)'
      }
    })
  }
}
