"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Search, Brain, Trophy, Target } from 'lucide-react'

const steps = [
  {
    number: 1,
    icon: Search,
    title: 'Введите запрос',
    description: 'Система сама исправит опечатки и найдёт синонимы.',
    color: 'bg-[#C93535]'
  },
  {
    number: 2,
    icon: Brain,
    title: 'Система анализирует',
    description: 'Искусственный интеллект учитывает историю ваших закупок и поведенческие сигналы.',
    color: 'bg-[#C93535]'
  },
  {
    number: 3,
    icon: Trophy,
    title: 'Персонализированное ранжирование',
    description: 'Товары сортируются не просто по совпадению, а по релевантности именно для вас.',
    color: 'bg-[#C93535]'
  },
  {
    number: 4,
    icon: Target,
    title: 'Точная выдача',
    description: 'Получите топ подходящих позиций с пояснением, почему система выбрала именно их.',
    color: 'bg-[#C93535]'
  }
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[#EDF1F7] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-2xl font-bold text-foreground md:text-3xl">
          Как это работает
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.number} className="relative overflow-hidden border-border bg-card">
              <CardContent className="p-6">
                {/* Step number badge */}
                <div className={`absolute -left-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full ${step.color} text-lg font-bold text-white shadow-md`}>
                  {step.number}
                </div>

                <div className="flex items-start gap-6 pl-8">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-bold text-[#2D4A7C]">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  
                  {/* Icon illustration */}
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-[#EDF1F7]">
                    <step.icon className="h-12 w-12 text-[#2D4A7C]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
