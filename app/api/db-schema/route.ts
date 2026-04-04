import { NextResponse } from 'next/server'
import { query, isDatabaseConfigured } from '@/lib/db'

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      status: 'fallback',
      message: 'Database not configured'
    })
  }

  try {
    // Получаем структуру таблицы ste
    const steColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ste'
      ORDER BY ordinal_position
    `)

    // Получаем структуру таблицы contracts
    const contractsColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'contracts'
      ORDER BY ordinal_position
    `)

    // Примеры данных из contracts
    const contractsSample = await query(`
      SELECT * FROM contracts LIMIT 3
    `)

    // Примеры данных из ste
    const steSample = await query(`
      SELECT * FROM ste LIMIT 3
    `)

    return NextResponse.json({
      status: 'success',
      tables: {
        ste: {
          columns: steColumns.rows,
          sample: steSample.rows
        },
        contracts: {
          columns: contractsColumns.rows,
          sample: contractsSample.rows
        }
      },
      hint: 'Сравните названия колонок с ожидаемыми: inn_buyer, buyer_name, buyer_region, ste_id, contract_amount'
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
