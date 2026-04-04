"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  fullName: string
  organization: string
  role: 'office' | 'medical' | 'construction'
}

export interface SearchHistoryItem {
  id: string
  query: string
  timestamp: Date
  resultsCount: number
}

export interface Interaction {
  steId: string
  type: 'view' | 'click' | 'purchase' | 'favorite' | 'positive' | 'negative'
  timestamp: Date
  weight: number
  duration?: number // время просмотра в секундах
}

export interface SessionResult {
  steId: string
  position: number
  relevanceScore: number
  personalizedScore: number
}

export interface SearchSession {
  id: string
  query: string
  timestamp: Date
  results: SessionResult[]
  userRole?: string
}

export interface PositionChange {
  steId: string
  steName: string
  previousPosition: number
  currentPosition: number
  change: number // положительное = поднялся, отрицательное = опустился
  factors: PositionChangeFactor[]
}

export interface PositionChangeFactor {
  type: 'view' | 'click' | 'purchase' | 'positive' | 'negative' | 'role' | 'similar_users' | 'trending' | 'price'
  impact: number // процент влияния
  description: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  searchHistory: SearchHistoryItem[]
  interactions: Interaction[]
  favorites: string[]
  usePostgres: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: { fullName: string; email: string; organization: string; password: string }) => Promise<boolean>
  logout: () => void
  addSearchHistory: (query: string, resultsCount: number) => void
  addInteraction: (steId: string, type: Interaction['type']) => void
  toggleFavorite: (steId: string) => void
  syncWithDatabase: () => Promise<void>
  setUsePostgres: (value: boolean) => void
}

// Demo users with different purchase histories (fallback when no DB)
const demoUsers: Record<string, User & { password: string }> = {
  'office@demo.ru': {
    id: '1',
    email: 'office@demo.ru',
    fullName: 'Иванов Иван Иванович',
    organization: 'ООО "Офисные решения"',
    role: 'office',
    password: 'demo123'
  },
  'medical@demo.ru': {
    id: '2',
    email: 'medical@demo.ru',
    fullName: 'Петрова Мария Сергеевна',
    organization: 'ГБУЗ "Городская больница №5"',
    role: 'medical',
    password: 'demo123'
  },
  'construction@demo.ru': {
    id: '3',
    email: 'construction@demo.ru',
    fullName: 'Сидоров Алексей Петрович',
    organization: 'ООО "СтройМастер"',
    role: 'construction',
    password: 'demo123'
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      searchHistory: [],
      interactions: [],
      favorites: [],
      usePostgres: true,

      setUsePostgres: (value: boolean) => {
        set({ usePostgres: value })
      },

      login: async (email: string, password: string) => {
        const { usePostgres } = get()
        
        if (usePostgres) {
          try {
            const response = await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'login', email, password })
            })
            
            if (response.ok) {
              const data = await response.json()
              if (data.user) {
                set({ user: data.user, isAuthenticated: true })
                // Sync interactions from database
                await get().syncWithDatabase()
                return true
              }
            }
          } catch (error) {
            console.log('[v0] PostgreSQL login failed, falling back to demo users:', error)
          }
        }
        
        // Fallback to demo users
        const user = demoUsers[email.toLowerCase()]
        if (user && user.password === password) {
          const { password: _, ...userData } = user
          set({ user: userData, isAuthenticated: true })
          return true
        }
        return false
      },

      register: async (data) => {
        const { usePostgres } = get()
        
        if (usePostgres) {
          try {
            const response = await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                action: 'register',
                ...data 
              })
            })
            
            if (response.ok) {
              const result = await response.json()
              if (result.user) {
                set({ user: result.user, isAuthenticated: true })
                return true
              }
            }
          } catch (error) {
            console.log('[v0] PostgreSQL register failed, using local storage:', error)
          }
        }
        
        // Fallback to local storage
        const newUser: User = {
          id: Date.now().toString(),
          email: data.email,
          fullName: data.fullName,
          organization: data.organization,
          role: 'office'
        }
        set({ user: newUser, isAuthenticated: true })
        return true
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, searchHistory: [], interactions: [] })
      },

      addSearchHistory: (query: string, resultsCount: number) => {
        const newItem: SearchHistoryItem = {
          id: Date.now().toString(),
          query,
          timestamp: new Date(),
          resultsCount
        }
        set((state) => ({
          searchHistory: [newItem, ...state.searchHistory].slice(0, 50)
        }))
      },

      addInteraction: async (steId: string, type: Interaction['type']) => {
        const { user, usePostgres } = get()
        const weights: Record<Interaction['type'], number> = {
          view: 0.1,
          click: 0.3,
          purchase: 1.0,
          favorite: 0.5,
          positive: 0.7,
          negative: -0.5
        }
        const newInteraction: Interaction = {
          steId,
          type,
          timestamp: new Date(),
          weight: weights[type]
        }
        
        // Update local state
        set((state) => ({
          interactions: [newInteraction, ...state.interactions]
        }))
        
        // Sync to PostgreSQL if enabled
        if (usePostgres && user) {
          try {
            await fetch('/api/interactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                steId,
                interactionType: type,
                weight: weights[type]
              })
            })
          } catch (error) {
            console.log('[v0] Failed to sync interaction to PostgreSQL:', error)
          }
        }
      },

      toggleFavorite: (steId: string) => {
        const state = get()
        const isFavorite = state.favorites.includes(steId)
        
        if (isFavorite) {
          set({ favorites: state.favorites.filter(id => id !== steId) })
          state.addInteraction(steId, 'negative')
        } else {
          set({ favorites: [...state.favorites, steId] })
          state.addInteraction(steId, 'favorite')
        }
      },

      syncWithDatabase: async () => {
        const { user, usePostgres } = get()
        if (!usePostgres || !user) return
        
        try {
          const response = await fetch(`/api/interactions?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.interactions) {
              const interactions: Interaction[] = data.interactions.map((i: {
                ste_id: string
                interaction_type: Interaction['type']
                created_at: string
                weight: number
              }) => ({
                steId: i.ste_id,
                type: i.interaction_type,
                timestamp: new Date(i.created_at),
                weight: i.weight
              }))
              set({ interactions })
            }
          }
        } catch (error) {
          console.log('[v0] Failed to sync from PostgreSQL:', error)
        }
      }
    }),
    {
      name: 'moszapros-auth',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const str = localStorage.getItem(name)
          if (!str) return null
          try {
            const parsed = JSON.parse(str)
            // Restore Date objects
            if (parsed.state?.searchHistory) {
              parsed.state.searchHistory = parsed.state.searchHistory.map((item: SearchHistoryItem) => ({
                ...item,
                timestamp: new Date(item.timestamp)
              }))
            }
            if (parsed.state?.interactions) {
              parsed.state.interactions = parsed.state.interactions.map((item: Interaction) => ({
                ...item,
                timestamp: new Date(item.timestamp)
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
