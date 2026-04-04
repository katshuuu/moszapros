"use client"

import { useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store'

type EventType = 'click' | 'view' | 'dwell' | 'select' | 'search' | 'scroll' | 'hover'

interface TrackEventParams {
  eventType: EventType
  steId?: string
  steName?: string
  category?: string
  query?: string
  position?: number
  dwellTime?: number
  scrollDepth?: number
  metadata?: Record<string, unknown>
}

// Генерация уникального ID сессии
function generateSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('search_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`
    sessionStorage.setItem('search_session_id', sessionId)
  }
  return sessionId
}

export function useEventTracker() {
  const { user } = useAuthStore()
  const sessionId = useRef<string>('')
  const dwellTimers = useRef<Map<string, { startTime: number; timer: NodeJS.Timeout }>>(new Map())

  useEffect(() => {
    sessionId.current = generateSessionId()
  }, [])

  // Основная функция отправки события
  const trackEvent = useCallback(async (params: TrackEventParams) => {
    if (!user?.id) return

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sessionId: sessionId.current,
          ...params,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('[EventTracker] Failed to track event:', error)
    }
  }, [user?.id])

  // Трекинг клика по результату поиска
  const trackClick = useCallback((steId: string, steName: string, category: string, position: number, query?: string) => {
    trackEvent({
      eventType: 'click',
      steId,
      steName,
      category,
      position,
      query
    })
  }, [trackEvent])

  // Трекинг просмотра карточки (начало)
  const startDwellTracking = useCallback((steId: string, steName: string, category: string) => {
    const startTime = Date.now()
    
    // Отправляем событие view сразу
    trackEvent({
      eventType: 'view',
      steId,
      steName,
      category
    })

    // Устанавливаем таймер для dwell time (отправляем каждые 5 секунд)
    const timer = setInterval(() => {
      const dwellTime = Math.round((Date.now() - startTime) / 1000)
      trackEvent({
        eventType: 'dwell',
        steId,
        steName,
        category,
        dwellTime
      })
    }, 5000)

    dwellTimers.current.set(steId, { startTime, timer })
  }, [trackEvent])

  // Трекинг просмотра карточки (конец)
  const stopDwellTracking = useCallback((steId: string, steName: string, category: string) => {
    const tracking = dwellTimers.current.get(steId)
    if (tracking) {
      clearInterval(tracking.timer)
      const dwellTime = Math.round((Date.now() - tracking.startTime) / 1000)
      
      // Отправляем финальное время просмотра
      trackEvent({
        eventType: 'dwell',
        steId,
        steName,
        category,
        dwellTime,
        metadata: { final: true }
      })
      
      dwellTimers.current.delete(steId)
    }
  }, [trackEvent])

  // Трекинг выбора товара (добавление в корзину / заказ)
  const trackSelect = useCallback((steId: string, steName: string, category: string, metadata?: Record<string, unknown>) => {
    trackEvent({
      eventType: 'select',
      steId,
      steName,
      category,
      metadata
    })
  }, [trackEvent])

  // Трекинг поискового запроса
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent({
      eventType: 'search',
      query,
      metadata: { resultsCount }
    })
  }, [trackEvent])

  // Трекинг прокрутки результатов
  const trackScroll = useCallback((scrollDepth: number, query?: string) => {
    trackEvent({
      eventType: 'scroll',
      scrollDepth,
      query
    })
  }, [trackEvent])

  // Трекинг наведения на товар
  const trackHover = useCallback((steId: string, steName: string, category: string, duration: number) => {
    // Отправляем только если наведение было больше 500ms
    if (duration >= 500) {
      trackEvent({
        eventType: 'hover',
        steId,
        steName,
        category,
        metadata: { hoverDuration: duration }
      })
    }
  }, [trackEvent])

  // Очистка всех таймеров при размонтировании
  useEffect(() => {
    return () => {
      dwellTimers.current.forEach(({ timer }) => clearInterval(timer))
      dwellTimers.current.clear()
    }
  }, [])

  return {
    trackEvent,
    trackClick,
    trackSearch,
    trackSelect,
    trackScroll,
    trackHover,
    startDwellTracking,
    stopDwellTracking,
    sessionId: sessionId.current
  }
}
