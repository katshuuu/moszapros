import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface StatsResult {
  total_contracts: string
  total_amount: string
  avg_amount: string
  min_amount: string
  max_amount: string
}

interface RegionStats {
  buyer_region: string
  count: string
  total: string
}

interface SellerStats {
  seller_name: string
  count: string
  total: string
}

interface YearStats {
  year: number
  count: string
  total: string
}

export async function GET() {
  try {
    // General statistics
    const generalStats = await query<StatsResult>(`
      SELECT 
        COUNT(*) as total_contracts,
        SUM(contract_amount) as total_amount,
        AVG(contract_amount) as avg_amount,
        MIN(contract_amount) as min_amount,
        MAX(contract_amount) as max_amount
      FROM contracts
    `)

    // Top 10 buyer regions
    const topRegions = await query<RegionStats>(`
      SELECT buyer_region, COUNT(*) as count, SUM(contract_amount) as total
      FROM contracts
      GROUP BY buyer_region
      ORDER BY total DESC
      LIMIT 10
    `)

    // Top 10 sellers
    const topSellers = await query<SellerStats>(`
      SELECT seller_name, COUNT(*) as count, SUM(contract_amount) as total
      FROM contracts
      GROUP BY seller_name
      ORDER BY total DESC
      LIMIT 10
    `)

    // Distribution by years
    const yearDistribution = await query<YearStats>(`
      SELECT EXTRACT(YEAR FROM contract_date) as year, COUNT(*) as count, SUM(contract_amount) as total
      FROM contracts
      GROUP BY year
      ORDER BY year DESC
    `)

    // STE count
    const steCount = await query<{ count: string }>(`SELECT COUNT(*) as count FROM ste`)

    return NextResponse.json({
      general: {
        totalContracts: parseInt(generalStats.rows[0]?.total_contracts || '0'),
        totalAmount: parseFloat(generalStats.rows[0]?.total_amount || '0'),
        avgAmount: parseFloat(generalStats.rows[0]?.avg_amount || '0'),
        minAmount: parseFloat(generalStats.rows[0]?.min_amount || '0'),
        maxAmount: parseFloat(generalStats.rows[0]?.max_amount || '0'),
        totalSTE: parseInt(steCount.rows[0]?.count || '0')
      },
      topRegions: topRegions.rows.map(r => ({
        region: r.buyer_region,
        count: parseInt(r.count),
        total: parseFloat(r.total)
      })),
      topSellers: topSellers.rows.map(s => ({
        name: s.seller_name,
        count: parseInt(s.count),
        total: parseFloat(s.total)
      })),
      yearDistribution: yearDistribution.rows.map(y => ({
        year: y.year,
        count: parseInt(y.count),
        total: parseFloat(y.total)
      }))
    })
  } catch (error) {
    console.error('[API] Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
