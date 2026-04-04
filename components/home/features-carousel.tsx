"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    title: 'Чат с ассистентом',
    description: 'Лис Стёпа поймёт даже неточные формулировки и предложит лучшие варианты.',
    mascot: true
  },
  {
    title: 'Умные рекомендации',
    description: 'Система анализирует ваши закупки и предлагает наиболее подходящие товары.',
    mascot: false
  },
  {
    title: 'История и аналитика',
    description: 'Отслеживайте историю поисков и анализируйте эффективность закупок.',
    mascot: false
  }
]

export function FeaturesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length)
  }

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-2xl font-bold text-foreground md:text-3xl">
          Возможности сервиса
        </h2>

        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden border-border bg-[#EDF1F7]">
            <CardContent className="p-0">
              <div className="flex flex-col items-center gap-6 p-8 md:flex-row md:gap-12 md:p-12">
                {/* Mascot illustration */}
                <div className="flex h-64 w-64 flex-shrink-0 items-center justify-center">
                  {features[currentIndex].mascot ? (
                    <div className="relative">
                      {/* Fox mascot - simplified SVG representation */}
                      <svg viewBox="0 0 200 200" className="h-full w-full">
                        {/* Body */}
                        <ellipse cx="100" cy="140" rx="50" ry="40" fill="#C93535" />
                        {/* Head */}
                        <circle cx="100" cy="80" r="45" fill="#FF6B35" />
                        {/* Ears */}
                        <polygon points="60,50 75,20 90,50" fill="#FF6B35" />
                        <polygon points="140,50 125,20 110,50" fill="#FF6B35" />
                        <polygon points="65,45 75,25 85,45" fill="#FFE4C4" />
                        <polygon points="135,45 125,25 115,45" fill="#FFE4C4" />
                        {/* Face */}
                        <ellipse cx="100" cy="95" rx="25" ry="20" fill="#FFE4C4" />
                        {/* Eyes */}
                        <circle cx="80" cy="75" r="8" fill="white" />
                        <circle cx="120" cy="75" r="8" fill="white" />
                        <circle cx="82" cy="75" r="4" fill="#333" />
                        <circle cx="122" cy="75" r="4" fill="#333" />
                        {/* Glasses */}
                        <circle cx="80" cy="75" r="12" fill="none" stroke="#C93535" strokeWidth="3" />
                        <circle cx="120" cy="75" r="12" fill="none" stroke="#C93535" strokeWidth="3" />
                        <line x1="92" y1="75" x2="108" y2="75" stroke="#C93535" strokeWidth="3" />
                        {/* Nose */}
                        <ellipse cx="100" cy="90" rx="6" ry="4" fill="#333" />
                        {/* Smile */}
                        <path d="M 90 100 Q 100 110 110 100" fill="none" stroke="#333" strokeWidth="2" />
                        {/* Tail */}
                        <ellipse cx="160" cy="150" rx="30" ry="15" fill="#FF6B35" transform="rotate(-30 160 150)" />
                        <ellipse cx="175" cy="140" rx="15" ry="8" fill="#FFE4C4" transform="rotate(-30 175 140)" />
                        {/* Boxes behind */}
                        <rect x="30" y="130" width="40" height="40" fill="#D4A574" rx="2" />
                        <rect x="35" y="135" width="30" height="30" fill="#C4956A" rx="2" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-white/50">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2D4A7C]">
                          <span className="text-2xl text-white">✨</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="mb-4 text-xl font-bold text-[#2D4A7C] md:text-2xl">
                    {features[currentIndex].title}
                  </h3>
                  <p className="text-base text-muted-foreground md:text-lg">
                    {features[currentIndex].description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-[#2D4A7C]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
