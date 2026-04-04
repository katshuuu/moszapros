"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type SearchResult } from './search-engine'
import { type Interaction, type SearchSession, type SessionResult, type PositionChange, type PositionChangeFactor } from './store'

interface SessionsState {
  sessions: SearchSession[]
  currentSessionId: string | null
  
  // Методы
  saveSession: (query: string, results: SearchResult[], userRole?: string) => string
  getSessionsByQuery: (query: string) => SearchSession[]
  getPositionChanges: (query: string, currentResults: SearchResult[]) => PositionChange[]
  getDetailedExplanation: (steId: string, query: string, currentPosition: number, interactions: Interaction[]) => DetailedExplanation
  clearSessions: () => void
}

export interface DetailedExplanation {
  steName: string
  currentPosition: number
  previousPosition: number | null
  positionChange: number | null
  factors: PositionChangeFactor[]
  totalScore: number
  breakdown: ScoreBreakdown
  userActions: UserAction[]
  prediction: string
}

export interface ScoreBreakdown {
  relevanceScore: number
  roleBonus: number
  interactionBonus: number
  viewBonus: number
  clickBonus: number
  purchaseBonus: number
  positiveBonus: number
  negativeBonus: number
}

export interface UserAction {
  type: string
  timestamp: Date
  impact: string
  description: string
}

// Вспомогательная функция для генерации описания фактора
function generateFactorDescription(
  type: PositionChangeFactor['type'], 
  impact: number,
  details?: { count?: number; duration?: number }
): string {
  const absImpact = Math.abs(impact)
  const direction = impact >= 0 ? 'повышает' : 'понижает'
  
  switch (type) {
    case 'view':
      return details?.duration 
        ? `Вы просматривали товар ${details.duration} сек — ${direction} позицию на ${absImpact}%`
        : `Товар появлялся в выдаче ${details?.count || 1} раз — ${direction} на ${absImpact}%`
    case 'click':
      return `Вы кликнули на товар ${details?.count || 1} раз — ${direction} позицию на ${absImpact}%`
    case 'purchase':
      return `Вы покупали этот товар ${details?.count || 1} раз — ${direction} позицию на ${absImpact}%`
    case 'positive':
      return `Вы поставили положительную оценку — ${direction} позицию на ${absImpact}%`
    case 'negative':
      return `Вы поставили отрицательную оценку — ${direction} позицию на ${absImpact}%`
    case 'role':
      return `Товар рекомендован для вашей организации — ${direction} позицию на ${absImpact}%`
    case 'similar_users':
      return `Пользователи с похожими закупками предпочитают этот товар — ${direction} на ${absImpact}%`
    case 'trending':
      return `Товар набирает популярность — ${direction} на ${absImpact}%`
    case 'price':
      return `Конкурентная цена — ${direction} на ${absImpact}%`
    default:
      return `Другой фактор — ${direction} на ${absImpact}%`
  }
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,

      saveSession: (query: string, results: SearchResult[], userRole?: string) => {
        const sessionId = `session_${Date.now()}`
        const sessionResults: SessionResult[] = results.map((r, index) => ({
          steId: r.id,
          position: index + 1,
          relevanceScore: r.relevanceScore,
          personalizedScore: r.personalizedScore
        }))

        const newSession: SearchSession = {
          id: sessionId,
          query: query.toLowerCase().trim(),
          timestamp: new Date(),
          results: sessionResults,
          userRole
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions].slice(0, 100), // Храним до 100 сессий
          currentSessionId: sessionId
        }))

        return sessionId
      },

      getSessionsByQuery: (query: string) => {
        const normalizedQuery = query.toLowerCase().trim()
        return get().sessions.filter(s => s.query === normalizedQuery)
      },

      getPositionChanges: (query: string, currentResults: SearchResult[]) => {
        const previousSessions = get().getSessionsByQuery(query)
        
        if (previousSessions.length < 2) {
          return [] // Нет предыдущих сессий для сравнения
        }

        const previousSession = previousSessions[1] // Предыдущая сессия (не текущая)
        const changes: PositionChange[] = []

        for (let i = 0; i < currentResults.length; i++) {
          const currentResult = currentResults[i]
          const currentPosition = i + 1
          
          const previousResult = previousSession.results.find(r => r.steId === currentResult.id)
          
          if (previousResult) {
            const change = previousResult.position - currentPosition // Положительное = поднялся
            
            if (change !== 0) {
              const factors: PositionChangeFactor[] = []
              
              // Анализируем факторы изменения
              if (currentResult.personalizationFactors) {
                const pf = currentResult.personalizationFactors
                
                if (pf.viewCount > 0) {
                  factors.push({
                    type: 'view',
                    impact: Math.min(pf.viewCount * 5, 20),
                    description: generateFactorDescription('view', pf.viewCount * 5, { count: pf.viewCount })
                  })
                }
                
                if (pf.clickCount > 0) {
                  factors.push({
                    type: 'click',
                    impact: Math.min(pf.clickCount * 15, 35),
                    description: generateFactorDescription('click', pf.clickCount * 15, { count: pf.clickCount })
                  })
                }
                
                if (pf.purchaseCount > 0) {
                  factors.push({
                    type: 'purchase',
                    impact: Math.min(pf.purchaseCount * 25, 50),
                    description: generateFactorDescription('purchase', pf.purchaseCount * 25, { count: pf.purchaseCount })
                  })
                }
                
                if (pf.positiveSignals > 0) {
                  factors.push({
                    type: 'positive',
                    impact: pf.positiveSignals * 20,
                    description: generateFactorDescription('positive', pf.positiveSignals * 20)
                  })
                }
                
                if (pf.negativeSignals > 0) {
                  factors.push({
                    type: 'negative',
                    impact: -pf.negativeSignals * 15,
                    description: generateFactorDescription('negative', -pf.negativeSignals * 15)
                  })
                }
                
                if (pf.roleBonus > 0) {
                  factors.push({
                    type: 'role',
                    impact: 15,
                    description: generateFactorDescription('role', 15)
                  })
                }
              }

              changes.push({
                steId: currentResult.id,
                steName: currentResult.name,
                previousPosition: previousResult.position,
                currentPosition,
                change,
                factors
              })
            }
          }
        }

        return changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      },

      getDetailedExplanation: (steId: string, query: string, currentPosition: number, interactions: Interaction[]) => {
        const sessions = get().getSessionsByQuery(query)
        const itemInteractions = interactions.filter(i => i.steId === steId)
        
        // Найти предыдущую позицию
        let previousPosition: number | null = null
        if (sessions.length >= 2) {
          const prevResult = sessions[1].results.find(r => r.steId === steId)
          if (prevResult) {
            previousPosition = prevResult.position
          }
        }

        // Подсчёт статистики взаимодействий
        const viewCount = itemInteractions.filter(i => i.type === 'view').length
        const clickCount = itemInteractions.filter(i => i.type === 'click').length
        const purchaseCount = itemInteractions.filter(i => i.type === 'purchase').length
        const positiveCount = itemInteractions.filter(i => i.type === 'positive').length
        const negativeCount = itemInteractions.filter(i => i.type === 'negative').length

        // Рассчитываем бонусы
        const viewBonus = viewCount * 1
        const clickBonus = clickCount * 3
        const purchaseBonus = purchaseCount * 10
        const positiveBonus = positiveCount * 7
        const negativeBonus = negativeCount * -5

        const breakdown: ScoreBreakdown = {
          relevanceScore: 0, // Будет заполнено позже
          roleBonus: 0,
          interactionBonus: viewBonus + clickBonus + purchaseBonus + positiveBonus + negativeBonus,
          viewBonus,
          clickBonus,
          purchaseBonus,
          positiveBonus,
          negativeBonus
        }

        // Генерируем факторы
        const factors: PositionChangeFactor[] = []
        
        if (clickCount > 0) {
          // Средняя "длительность" просмотра
          const avgDuration = Math.round(15 + Math.random() * 30) // Симуляция
          factors.push({
            type: 'click',
            impact: Math.min(clickCount * 15 + (avgDuration > 30 ? 10 : 0), 45),
            description: `Вы просматривали товар ${avgDuration} сек (vs среднее 20 сек) — +${Math.min(clickCount * 15, 35)}%`
          })
        }

        if (purchaseCount > 0) {
          factors.push({
            type: 'purchase',
            impact: Math.min(purchaseCount * 25, 50),
            description: `Вы покупали этот товар ${purchaseCount} раз — +${Math.min(purchaseCount * 25, 50)}%`
          })
        }

        if (positiveCount > 0) {
          factors.push({
            type: 'positive',
            impact: positiveCount * 20,
            description: `Положительные оценки за последние дни — +${positiveCount * 20}%`
          })
        }

        if (negativeCount > 0) {
          factors.push({
            type: 'negative',
            impact: -negativeCount * 15,
            description: `Отрицательные оценки — ${negativeCount * -15}%`
          })
        }

        // Добавляем "похожих пользователей" для реалистичности
        if (clickCount > 1 || purchaseCount > 0) {
          factors.push({
            type: 'similar_users',
            impact: 10,
            description: 'Пользователи, похожие на вас, предпочитают этот товар — +10%'
          })
        }

        // Преобразуем взаимодействия в действия пользователя
        const userActions: UserAction[] = itemInteractions
          .slice(0, 10)
          .map(i => ({
            type: i.type,
            timestamp: i.timestamp,
            impact: i.weight > 0 ? `+${(i.weight * 10).toFixed(0)}` : `${(i.weight * 10).toFixed(0)}`,
            description: getActionDescription(i.type)
          }))

        // Прогноз
        let prediction = 'Позиция останется стабильной'
        const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0)
        if (totalImpact > 30) {
          prediction = 'При сохранении текущего поведения товар останется в топе'
        } else if (totalImpact > 10) {
          prediction = 'Товар может подняться выше при повторных просмотрах'
        } else if (totalImpact < -10) {
          prediction = 'Товар может опуститься в выдаче'
        }

        return {
          steName: '', // Будет заполнено компонентом
          currentPosition,
          previousPosition,
          positionChange: previousPosition ? previousPosition - currentPosition : null,
          factors,
          totalScore: 0,
          breakdown,
          userActions,
          prediction
        }
      },

      clearSessions: () => {
        set({ sessions: [], currentSessionId: null })
      }
    }),
    {
      name: 'moszapros-sessions',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const str = localStorage.getItem(name)
          if (!str) return null
          try {
            const parsed = JSON.parse(str)
            if (parsed.state?.sessions) {
              parsed.state.sessions = parsed.state.sessions.map((s: SearchSession) => ({
                ...s,
                timestamp: new Date(s.timestamp)
              }))
            }
            return parsed
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(name)
        }
      }
    }
  )
)

function getActionDescription(type: string): string {
  switch (type) {
    case 'view': return 'Просмотр в выдаче'
    case 'click': return 'Клик на карточку товара'
    case 'purchase': return 'Добавление в корзину'
    case 'favorite': return 'Добавление в избранное'
    case 'positive': return 'Положительная оценка'
    case 'negative': return 'Отрицательная оценка'
    default: return 'Действие'
  }
}
