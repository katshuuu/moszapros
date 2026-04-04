"use client"

import useSWR from 'swr'
import { useAuthStore } from '@/lib/store'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch')
  }
  return res.json()
}

export interface STEItem {
  id: string
  ste_code: string
  name: string
  description: string
  category: string
  unit: string
  price: number
  okpd2_code: string
  ktru_code: string
  created_at: string
}

export interface Contract {
  id: string
  contract_number: string
  ste_id: string
  ste_name: string
  quantity: number
  total_price: number
  supplier: string
  customer: string
  contract_date: string
  status: string
}

export interface Stats {
  ste_count: number
  contract_count: number
  user_count: number
  total_contract_value: number
  categories: Array<{ category: string; count: number }>
  monthly_contracts: Array<{ month: string; count: number; value: number }>
}

export function useSTEItems(category?: string, search?: string) {
  const { usePostgres } = useAuthStore()
  
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  
  const url = usePostgres 
    ? `/api/ste?${params.toString()}`
    : null

  const { data, error, isLoading, mutate } = useSWR<{ items: STEItem[] }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  )

  return {
    items: data?.items || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useContracts(userId?: string, steId?: string) {
  const { usePostgres } = useAuthStore()
  
  const params = new URLSearchParams()
  if (userId) params.set('userId', userId)
  if (steId) params.set('steId', steId)
  
  const url = usePostgres 
    ? `/api/contracts?${params.toString()}`
    : null

  const { data, error, isLoading, mutate } = useSWR<{ contracts: Contract[] }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  )

  return {
    contracts: data?.contracts || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useStats() {
  const { usePostgres } = useAuthStore()
  
  const url = usePostgres ? '/api/stats' : null

  const { data, error, isLoading } = useSWR<Stats>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  )

  return {
    stats: data,
    isLoading,
    isError: error
  }
}

export function useDatabaseHealth() {
  const { data, error, isLoading } = useSWR<{
    status: string
    database: string
    timestamp: string
  }>(
    '/api/health',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000 // Check every minute
    }
  )

  return {
    isConnected: data?.status === 'healthy',
    database: data?.database,
    timestamp: data?.timestamp,
    isLoading,
    isError: error
  }
}

export function useSearchWithDB(query: string, userId?: string) {
  const { usePostgres } = useAuthStore()
  
  const params = new URLSearchParams()
  params.set('q', query)
  if (userId) params.set('userId', userId)
  
  const url = usePostgres && query 
    ? `/api/search?${params.toString()}`
    : null

  const { data, error, isLoading } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000
    }
  )

  return {
    results: data?.results || [],
    corrections: data?.corrections || [],
    synonymsUsed: data?.synonymsUsed || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    isError: error
  }
}
