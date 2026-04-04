import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConfigured, query } from '@/lib/db'

// In-memory event store for fallback mode
const eventStore: Map<string, UserEvent[]> = new Map()

export interface UserEvent {
  id: string
  userId: string
  eventType: 'click' | 'view' | 'dwell' | 'select' | 'search' | 'scroll' | 'hover'
  steId?: string
  steName?: string
  category?: string
  query?: string
  position?: number
  dwellTime?: number // время просмотра в секундах
  scrollDepth?: number // глубина прокрутки 0-100%
  sessionId: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// GET - получить события пользователя
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const eventType = searchParams.get('eventType')
  const limit = parseInt(searchParams.get('limit') || '100')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  if (isDatabaseConfigured()) {
    try {
      let queryText = `
        SELECT * FROM user_events 
        WHERE user_id = $1
      `
      const params: (string | number)[] = [userId]
      
      if (eventType) {
        queryText += ` AND event_type = $2`
        params.push(eventType)
      }
      
      queryText += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`
      params.push(limit)
      
      const result = await query(queryText, params)
      
      if (result) {
        return NextResponse.json({
          events: result.rows,
          source: 'database'
        })
      }
    } catch (error) {
      console.error('[API] Events query error:', error)
    }
  }

  // Fallback
  const userEvents = eventStore.get(userId) || []
  const filtered = eventType 
    ? userEvents.filter(e => e.eventType === eventType)
    : userEvents
  
  return NextResponse.json({
    events: filtered.slice(0, limit),
    source: 'fallback'
  })
}

// POST - записать событие
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      eventType,
      steId,
      steName,
      category,
      query: searchQuery,
      position,
      dwellTime,
      scrollDepth,
      sessionId,
      metadata
    } = body

    if (!userId || !eventType || !sessionId) {
      return NextResponse.json(
        { error: 'userId, eventType, and sessionId are required' },
        { status: 400 }
      )
    }

    const event: UserEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      eventType,
      steId,
      steName,
      category,
      query: searchQuery,
      position,
      dwellTime,
      scrollDepth,
      sessionId,
      timestamp: new Date(),
      metadata
    }

    if (isDatabaseConfigured()) {
      try {
        await query(
          `INSERT INTO user_events 
           (id, user_id, event_type, ste_id, ste_name, category, query, position, dwell_time, scroll_depth, session_id, metadata, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            event.id,
            userId,
            eventType,
            steId || null,
            steName || null,
            category || null,
            searchQuery || null,
            position || null,
            dwellTime || null,
            scrollDepth || null,
            sessionId,
            JSON.stringify(metadata || {}),
            event.timestamp
          ]
        )
        
        return NextResponse.json({
          success: true,
          eventId: event.id,
          source: 'database'
        })
      } catch (error) {
        console.error('[API] Event insert error:', error)
      }
    }

    // Fallback to in-memory store
    const userEvents = eventStore.get(userId) || []
    userEvents.unshift(event)
    // Keep only last 1000 events per user
    if (userEvents.length > 1000) {
      userEvents.pop()
    }
    eventStore.set(userId, userEvents)

    return NextResponse.json({
      success: true,
      eventId: event.id,
      source: 'fallback'
    })
  } catch (error) {
    console.error('[API] Event processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Получение агрегированных данных для графа предпочтений
export async function getPreferenceData(userId: string) {
  const userEvents = eventStore.get(userId) || []
  
  // Агрегация по категориям
  const categoryStats: Record<string, { clicks: number; views: number; dwellTime: number; selects: number }> = {}
  
  for (const event of userEvents) {
    if (!event.category) continue
    
    if (!categoryStats[event.category]) {
      categoryStats[event.category] = { clicks: 0, views: 0, dwellTime: 0, selects: 0 }
    }
    
    switch (event.eventType) {
      case 'click':
        categoryStats[event.category].clicks++
        break
      case 'view':
        categoryStats[event.category].views++
        break
      case 'dwell':
        categoryStats[event.category].dwellTime += event.dwellTime || 0
        break
      case 'select':
        categoryStats[event.category].selects++
        break
    }
  }
  
  return categoryStats
}
