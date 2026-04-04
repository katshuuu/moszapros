import { Pool, PoolClient, QueryResult } from 'pg'

// Singleton pattern for connection pool
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    pool = new Pool({
      connectionString,
      max: 20, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 2000, // Timeout for acquiring a connection
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })
  }

  return pool
}

// Query helper function
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool()
  const start = Date.now()
  const result = await pool.query<T>(text, params)
  const duration = Date.now() - start
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB] Query executed', { text: text.substring(0, 100), duration, rows: result.rowCount })
  }
  
  return result
}

// Get a client from the pool for transactions
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return pool.connect()
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()
  
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
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()')
    console.log('[DB] Connection successful:', result.rows[0])
    return true
  } catch (error) {
    console.error('[DB] Connection failed:', error)
    return false
  }
}

// Close all connections (useful for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Types for database entities
export interface STERecord {
  ste_id: number
  ste_name: string
  okpd2_code?: string
  okpd2_name?: string
  unit?: string
  category?: string
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
  getClient,
  withTransaction,
  testConnection,
  closePool,
}
