"use client"

import { useAuthStore } from '@/lib/store'
import { SmartSearchBar } from './smart-search-bar'

// Pre-computed opacities to avoid hydration mismatch
const opacities = [
  0.65, 0.42, 0.78, 0.35, 0.55, 0.48, 0.72, 0.38,
  0.58, 0.45, 0.68, 0.52, 0.75, 0.40, 0.62, 0.50,
  0.70, 0.43, 0.65, 0.55, 0.48, 0.72, 0.38, 0.60,
  0.45, 0.68, 0.52, 0.78, 0.40, 0.62, 0.50, 0.70,
  0.55, 0.42, 0.65, 0.48, 0.75, 0.35, 0.58, 0.52,
  0.68, 0.45, 0.72, 0.38, 0.62, 0.50, 0.78, 0.43,
  0.65, 0.55
]

const words = ['строительство', 'канцелярия', 'медицина', 'техника', 'мебель', 'офис', 'поставки', 'закупки']

export function HeroSection() {
  const { isAuthenticated } = useAuthStore()

  return (
    <section className="relative overflow-hidden bg-[#2D4A7C] py-16 md:py-24">
      {/* Background pattern - scattered text like in design */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-8 overflow-hidden text-white" style={{ transform: 'rotate(-15deg)' }}>
          {opacities.map((opacity, i) => (
            <span key={i} className="whitespace-nowrap text-sm md:text-base" style={{ opacity }}>
              {words[i % 8]}
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
        
        {/* Умная поисковая строка */}
        <SmartSearchBar />

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
