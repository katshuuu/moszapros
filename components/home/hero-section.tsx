"use client"

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function HeroSection() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const handleSearch = () => {
    if (isAuthenticated) {
      router.push('/search')
    } else {
      router.push('/login')
    }
  }

  return (
    <section className="relative overflow-hidden bg-[#2D4A7C] py-16 md:py-24">
      {/* Background pattern - scattered text like in design */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-8 overflow-hidden text-white" style={{ transform: 'rotate(-15deg)' }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <span key={i} className="whitespace-nowrap text-sm md:text-base" style={{ opacity: Math.random() * 0.5 + 0.3 }}>
              {['строительство', 'канцелярия', 'медицина', 'техника', 'мебель', 'офис', 'поставки', 'закупки'][i % 8]}
            </span>
          ))}
        </div>
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
          Интеллектуальный поиск СТЕ
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-base text-white/80 md:text-lg">
          Система обучается на ваших предпочтениях и улучшается с каждым поиском.
        </p>
        
        <Button
          onClick={handleSearch}
          size="lg"
          className="gap-2 bg-[#C93535] px-8 py-6 text-lg text-white hover:bg-[#B02E2E]"
        >
          <Search className="h-5 w-5" />
          {isAuthenticated ? 'Начать поиск' : 'Войти и начать поиск'}
        </Button>

        {/* Demo accounts info */}
        <div className="mt-8 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
          <p className="mb-2 text-sm font-medium text-white">Демо-аккаунты для тестирования:</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/90">
            <span className="rounded bg-white/20 px-2 py-1">office@demo.ru (офис)</span>
            <span className="rounded bg-white/20 px-2 py-1">medical@demo.ru (медицина)</span>
            <span className="rounded bg-white/20 px-2 py-1">construction@demo.ru (строительство)</span>
            <span className="rounded bg-white/20 px-2 py-1">Пароль: demo123</span>
          </div>
        </div>
      </div>
    </section>
  )
}
