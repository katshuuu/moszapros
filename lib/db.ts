import { Pool, PoolClient, QueryResult } from 'pg'

// Singleton pattern for connection pool
let pool: Pool | null = null
let connectionFailed = false

// Check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL && !connectionFailed
}

function getPool(): Pool | null {
  if (connectionFailed) {
    return null
  }

  if (!pool) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      console.log('[DB] DATABASE_URL not set, using fallback data')
      return null
    }

    try {
      pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      })

      pool.on('error', (err) => {
        console.error('[DB] Pool error:', err.message)
        connectionFailed = true
      })
    } catch (error) {
      console.error('[DB] Failed to create pool:', error)
      connectionFailed = true
      return null
    }
  }

  return pool
}

// Query helper function with fallback support
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T> | null> {
  const pool = getPool()
  
  if (!pool) {
    return null
  }

  try {
    const start = Date.now()
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB] Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount })
    }
    
    return result
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DB] Query failed:', errorMessage)
    
    // Mark connection as failed for connection errors
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection')) {
      connectionFailed = true
    }
    
    return null
  }
}

// Safe query that returns empty result on failure
export async function safeQuery<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const result = await query<T>(text, params)
  return result || { rows: [], rowCount: 0 }
}

// Get a client from the pool for transactions
export async function getClient(): Promise<PoolClient | null> {
  const pool = getPool()
  if (!pool) return null
  
  try {
    return await pool.connect()
  } catch (error) {
    console.error('[DB] Failed to get client:', error)
    return null
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T | null> {
  const client = await getClient()
  
  if (!client) {
    return null
  }
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// Test database connection
export async function testConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!process.env.DATABASE_URL) {
    return { connected: false, error: 'DATABASE_URL not configured' }
  }

  try {
    const result = await query('SELECT NOW() as now, version() as version')
    if (result && result.rows.length > 0) {
      console.log('[DB] Connection successful')
      return { connected: true }
    }
    return { connected: false, error: 'No response from database' }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DB] Connection test failed:', errorMessage)
    return { connected: false, error: errorMessage }
  }
}

// Close all connections
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Reset connection state (useful for retrying)
export function resetConnection(): void {
  connectionFailed = false
  pool = null
}

// Types for database entities - adapted to user's actual table structure
export interface STERecord {
  ste_id: number
  name: string
  category: string
}

export interface ContractRecord {
  contract_name: string
  contract_id: number
  ste_id: number
  contract_date: Date
  contract_amount: number
  inn_buyer: number
  buyer_name: string
  buyer_region: string
  inn_seller: number
  seller_name: string
  seller_region: string
}

export interface UserRecord {
  id: number
  email: string
  password_hash: string
  full_name: string
  organization: string
  role: 'buyer' | 'seller' | 'admin'
  created_at: Date
  updated_at: Date
}

export interface SearchHistoryRecord {
  id: number
  user_id: number
  query: string
  filters: Record<string, unknown>
  results_count: number
  created_at: Date
}

export interface InteractionRecord {
  id: number
  user_id: number
  ste_id: number
  interaction_type: 'view' | 'click' | 'positive' | 'negative' | 'purchase'
  created_at: Date
}

export default {
  query,
  safeQuery,
  getClient,
  withTransaction,
  testConnection,
  closePool,
  isDatabaseConfigured,
  resetConnection,
}
