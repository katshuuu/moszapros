"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Building2, User } from 'lucide-react'

interface BuyerInfo {
  inn: string
  name: string
  region: string
  contractsCount: number
  totalAmount: number
}

export default function LoginPage() {
  const router = useRouter()
  const { loginByINN } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [inn, setInn] = useState('')
  const [availableBuyers, setAvailableBuyers] = useState<BuyerInfo[]>([])
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(true)

  // Загрузка списка доступных ИНН из базы данных
  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const response = await fetch('/api/buyers')
        if (response.ok) {
          const data = await response.json()
          setAvailableBuyers(data.buyers || [])
        }
      } catch (error) {
        console.error('Failed to fetch buyers:', error)
      } finally {
        setIsLoadingBuyers(false)
      }
    }
    fetchBuyers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inn.trim()) {
      toast.error('Введите ИНН организации')
      return
    }

    setIsLoading(true)

    try {
      const success = await loginByINN(inn.trim())
      if (success) {
        toast.success('Вы успешно вошли в систему')
        router.push('/search')
      } else {
        toast.error('ИНН не найден в базе данных контрактов')
      }
    } catch {
      toast.error('Произошла ошибка при входе')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectBuyer = (selectedInn: string) => {
    setInn(selectedInn)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-[#2D4A7C] py-6 text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Авторизация
            </CardTitle>
            <p className="mt-2 text-sm text-white/80">
              Войдите по ИНН вашей организации
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="inn" className="text-sm font-medium text-foreground">
                  ИНН организации:
                </label>
                <Input
                  id="inn"
                  type="text"
                  value={inn}
                  onChange={(e) => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  required
                  className="border-border text-lg"
                  placeholder="Введите ИНН (10 или 12 цифр)"
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground">
                  Система автоматически загрузит историю контрактов для персонализации поиска
                </p>
              </div>

              <div className="border-t border-border pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || inn.length < 10}
                  className="w-full bg-[#C93535] py-6 text-lg font-medium text-white hover:bg-[#B02E2E]"
                >
                  {isLoading ? 'Вход...' : 'Войти'}
                </Button>
              </div>
            </form>

            {/* Список доступных ИНН для демонстрации */}
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#2D4A7C]" />
                <h3 className="font-semibold text-foreground">Доступные организации для демо:</h3>
              </div>
              
              {isLoadingBuyers ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2D4A7C] border-t-transparent"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Загрузка...</span>
                </div>
              ) : availableBuyers.length > 0 ? (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {availableBuyers.slice(0, 10).map((buyer) => (
                    <button
                      key={buyer.inn}
                      type="button"
                      onClick={() => handleSelectBuyer(buyer.inn)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        inn === buyer.inn 
                          ? 'border-[#C93535] bg-[#C93535]/5' 
                          : 'border-border hover:border-[#2D4A7C] hover:bg-[#EDF1F7]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[#2D4A7C]" />
                            <span className="font-medium text-foreground">{buyer.name}</span>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            ИНН: <span className="font-mono">{buyer.inn}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {buyer.region}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#2D4A7C]">
                            {buyer.contractsCount} контрактов
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(buyer.totalAmount / 1000000).toFixed(1)} млн ₽
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-[#EDF1F7] p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    База данных не подключена. Подключите PostgreSQL для загрузки списка организаций.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/register"
                className="text-sm text-[#C93535] hover:underline"
              >
                Нет в базе? Зарегистрироваться
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
