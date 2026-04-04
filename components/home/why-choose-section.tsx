"use client"

import { Search, KeyRound, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Search,
    title: 'Гибридный поиск',
    description: 'Семантический поиск с автоматическим исправлением опечаток и пониманием синонимов.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Group%202682-hKlkkjgXo9D1MmnKONFFCopCUFUpwY.png'
  },
  {
    icon: KeyRound,
    title: 'Персонализация',
    description: 'Система обучается на вашей истории и показывает наиболее релевантные товары.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Group%202682-hKlkkjgXo9D1MmnKONFFCopCUFUpwY.png'
  },
  {
    icon: BarChart3,
    title: 'Высокое качество',
    description: 'Метрики NDCG, MAP, Precision@K подтверждают качество ранжирования перепиши текст на более презентабельный.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Group%202682-hKlkkjgXo9D1MmnKONFFCopCUFUpwY.png'
  }
]

export function WhyChooseSection() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-2xl font-bold text-foreground md:text-3xl">
          Почему выбирают МосЗапрос ?
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden border-border bg-card transition-shadow hover:shadow-lg">
              <div className="flex aspect-[4/3] items-center justify-center bg-[#EDF1F7] p-6">
                <div className="relative h-full w-full">
                  {/* Illustration placeholder */}
                  <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
                        <feature.icon className="h-10 w-10 text-[#2D4A7C]" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#C93535]" />
                        <div className="h-3 w-3 rounded-full bg-[#2D4A7C]" />
                        <div className="h-3 w-3 rounded-full bg-[#4A7C2D]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-bold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
