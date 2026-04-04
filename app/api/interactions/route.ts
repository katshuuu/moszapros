import { NextRequest, NextResponse } from 'next/server'
import { query, isDatabaseConfigured, InteractionRecord } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  // Check if database is configured
  if (!isDatabaseConfigured()) {
    // Return empty data when no database
    return NextResponse.json({
      interactions: [],
      preferences: {
        categories: [],
        ste: []
      },
      source: 'fallback'
    })
  }

  try {
    const result = await query<InteractionRecord & { ste_name: string; category: string }>(
      `SELECT 
        i.*,
        s.ste_name,
        s.category
       FROM interactions i
       LEFT JOIN ste s ON i.ste_id = s.ste_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC
       LIMIT 100`,
      [userId]
    )

    if (!result) {
      return NextResponse.json({
        interactions: [],
        preferences: { categories: [], ste: [] },
        source: 'fallback'
      })
    }

    // Aggregate interactions for personalization
    const categoryPreferences: Record<string, number> = {}
    const stePreferences: Record<number, number> = {}

    for (const row of result.rows) {
      const weight = row.interaction_type === 'purchase' ? 5 
        : row.interaction_type === 'positive' ? 3
        : row.interaction_type === 'click' ? 2
        : row.interaction_type === 'view' ? 1
        : row.interaction_type === 'negative' ? -2
        : 0

      if (row.category) {
        categoryPreferences[row.category] = (categoryPreferences[row.category] || 0) + weight
      }
      stePreferences[row.ste_id] = (stePreferences[row.ste_id] || 0) + weight
    }

    return NextResponse.json({
      interactions: result.rows,
      preferences: {
        categories: Object.entries(categoryPreferences)
          .sort(([,a], [,b]) => b - a)
          .map(([category, score]) => ({ category, score })),
        ste: Object.entries(stePreferences)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 20)
          .map(([steId, score]) => ({ steId: parseInt(steId), score }))
      },
      source: 'database'
    })
  } catch (error) {
    console.error('[API] Get interactions error:', error)
    return NextResponse.json({
      interactions: [],
      preferences: { categories: [], ste: [] },
      source: 'fallback',
      error: 'Database unavailable'
    })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { userId, steId, interactionType } = body

  if (!userId || !steId || !interactionType) {
    return NextResponse.json(
      { error: 'userId, steId, and interactionType are required' },
      { status: 400 }
    )
  }

  const validTypes = ['view', 'click', 'positive', 'negative', 'purchase']
  if (!validTypes.includes(interactionType)) {
    return NextResponse.json(
      { error: `interactionType must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    )
  }

  // Check if database is configured
  if (!isDatabaseConfigured()) {
    // Return success but indicate fallback mode
    return NextResponse.json({
      interaction: {
        id: Date.now(),
        user_id: userId,
        ste_id: steId,
        interaction_type: interactionType,
        created_at: new Date().toISOString()
      },
      source: 'local',
      message: 'Interaction saved locally (database not connected)'
    }, { status: 201 })
  }

  try {
    const result = await query<InteractionRecord>(
      `INSERT INTO interactions (user_id, ste_id, interaction_type, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [userId, steId, interactionType]
    )

    if (!result) {
      return NextResponse.json({
        interaction: {
          id: Date.now(),
          user_id: userId,
          ste_id: steId,
          interaction_type: interactionType,
          created_at: new Date().toISOString()
        },
        source: 'local'
      }, { status: 201 })
    }

    return NextResponse.json({ 
      interaction: result.rows[0],
      source: 'database'
    }, { status: 201 })
  } catch (error) {
    console.error('[API] Create interaction error:', error)
    // Return success with local fallback
    return NextResponse.json({
      interaction: {
        id: Date.now(),
        user_id: userId,
        ste_id: steId,
        interaction_type: interactionType,
        created_at: new Date().toISOString()
      },
      source: 'local',
      message: 'Saved locally due to database error'
    }, { status: 201 })
  }
}
