import { NextResponse } from 'next/server'
import { query, isDatabaseConfigured, testConnection } from '@/lib/db'

// GET /api/db-status - Check database connection and show stats
export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  const allowLocalDb = process.env.ALLOW_LOCAL_DB
  
  console.log('[DB-STATUS] Checking database configuration...')
  console.log('[DB-STATUS] DATABASE_URL set:', !!dbUrl)
  console.log('[DB-STATUS] ALLOW_LOCAL_DB:', allowLocalDb)
  console.log('[DB-STATUS] isDatabaseConfigured():', isDatabaseConfigured())
  
  // Basic config check
  const config = {
    databaseUrlSet: !!dbUrl,
    databaseUrlPreview: dbUrl ? `${dbUrl.substring(0, 30)}...` : null,
    allowLocalDb: allowLocalDb === 'true',
    isDatabaseConfigured: isDatabaseConfigured(),
  }
  
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      status: 'fallback',
      message: 'Database not configured - using demo data',
      config,
      fix: {
        step1: 'Create .env.local file in project root',
        step2: 'Add: DATABASE_URL=postgresql://postgres:password@localhost:5432/contracts_db',
        step3: 'Add: ALLOW_LOCAL_DB=true',
        step4: 'Restart the dev server: npm run dev',
      }
    })
  }
  
  // Test actual connection
  const connectionTest = await testConnection()
  console.log('[DB-STATUS] Connection test result:', connectionTest)
  
  if (!connectionTest.connected) {
    return NextResponse.json({
      status: 'error',
      message: 'Database configured but connection failed',
      error: connectionTest.error,
      config,
    })
  }
  
  // Get table stats
  try {
    const steCount = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM ste')
    const contractsCount = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM contracts')
    const buyersCount = await query<{ count: string }>('SELECT COUNT(DISTINCT inn_buyer)::text as count FROM contracts')
    
    // Get sample data
    const steSample = await query<{ ste_id: number; name: string; category: string }>(
      'SELECT ste_id, name, category FROM ste ORDER BY RANDOM() LIMIT 5'
    )
    
    const buyersSample = await query<{ inn_buyer: string; buyer_name: string; contracts_count: string }>(
      `SELECT 
        inn_buyer::text as inn_buyer, 
        buyer_name,
        COUNT(*)::text as contracts_count
      FROM contracts 
      WHERE buyer_name IS NOT NULL
      GROUP BY inn_buyer, buyer_name
      ORDER BY COUNT(*) DESC 
      LIMIT 5`
    )
    
    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to PostgreSQL database',
      config,
      stats: {
        steCount: steCount?.rows[0]?.count || '0',
        contractsCount: contractsCount?.rows[0]?.count || '0',
        uniqueBuyers: buyersCount?.rows[0]?.count || '0',
      },
      samples: {
        ste: steSample?.rows || [],
        buyers: buyersSample?.rows || [],
      }
    })
  } catch (error) {
    console.error('[DB-STATUS] Stats error:', error)
    return NextResponse.json({
      status: 'partial',
      message: 'Connected but failed to read tables',
      error: error instanceof Error ? error.message : 'Unknown error',
      config,
    })
  }
}
