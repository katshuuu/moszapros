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
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  searchHistory: SearchHistoryItem[]
  interactions: Interaction[]
  favorites: string[]
  login: (email: string, password: string) => Promise<boolean>
  register: (data: { fullName: string; email: string; organization: string; password: string }) => Promise<boolean>
  logout: () => void
  addSearchHistory: (query: string, resultsCount: number) => void
  addInteraction: (steId: string, type: Interaction['type']) => void
  toggleFavorite: (steId: string) => void
}

// Demo users with different purchase histories
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

      login: async (email: string, password: string) => {
        const user = demoUsers[email.toLowerCase()]
        if (user && user.password === password) {
          const { password: _, ...userData } = user
          set({ user: userData, isAuthenticated: true })
          return true
        }
        return false
      },

      register: async (data) => {
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
        set({ user: null, isAuthenticated: false })
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

      addInteraction: (steId: string, type: Interaction['type']) => {
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
        set((state) => ({
          interactions: [newInteraction, ...state.interactions]
        }))
      },

      toggleFavorite: (steId: string) => {
        set((state) => {
          const isFavorite = state.favorites.includes(steId)
          if (isFavorite) {
            return { favorites: state.favorites.filter(id => id !== steId) }
          }
          return { favorites: [...state.favorites, steId] }
        })
      }
    }),
    {
      name: 'moszapros-auth',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
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
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        }
      }
    }
  )
)
