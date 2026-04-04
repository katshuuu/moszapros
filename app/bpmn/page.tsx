"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, User, Cpu, Search, Sparkles, Brain, RefreshCw, Database, ThumbsUp } from 'lucide-react'

const userSteps = [
  { id: 1, title: 'Ввод запроса', description: 'Пользователь вводит текст запроса', icon: Search },
  { id: 2, title: 'Просмотр результатов', description: 'Анализ предложенных товаров', icon: User },
  { id: 3, title: 'Взаимодействие', description: 'Клик, покупка, добавление в избранное', icon: ThumbsUp },
  { id: 4, title: 'Обратная связь', description: 'Оценка релевантности результатов', icon: RefreshCw },
]

const systemSteps = [
  { id: 1, title: 'Препроцессинг', description: 'Исправление опечаток, расширение синонимов', icon: Sparkles },
  { id: 2, title: 'Генерация эмбеддинга', description: 'Векторизация запроса для семантического поиска', icon: Database },
  { id: 3, title: 'Гибридный поиск', description: 'Full-text + pgvector cosine similarity', icon: Cpu },
  { id: 4, title: 'Персонализация', description: 'Reranking на основе профиля пользователя', icon: Brain },
]

export default function BpmnPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#f5f5f5] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              BPMN-схема процесса поиска
            </h1>
            <p className="text-muted-foreground">
              Визуализация бизнес-процесса персонализированного поиска СТЕ
            </p>
          </div>

          <Card className="mb-8 border-border bg-background">
            <CardHeader>
              <CardTitle>Диаграмма процесса</CardTitle>
              <CardDescription>
                Два параллельных потока: действия пользователя и обработка системой
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {/* BPMN Diagram */}
              <div className="min-w-[800px] p-4">
                {/* User Swimlane */}
                <div className="mb-6 rounded-lg border-2 border-[#2D4A7C] bg-blue-50/50">
                  <div className="border-b-2 border-[#2D4A7C] bg-[#2D4A7C] px-4 py-2">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-white" />
                      <span className="font-bold text-white">Пользователь</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6">
                    {/* Start Event */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-600 bg-green-100">
                      <div className="h-4 w-4 rounded-full bg-green-600" />
                    </div>
                    
                    {userSteps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-4">
                        <ArrowRight className="h-6 w-6 flex-shrink-0 text-[#2D4A7C]" />
                        <div className="flex flex-col items-center">
                          <div className="flex h-16 w-40 items-center justify-center rounded-lg border-2 border-[#2D4A7C] bg-white p-2 text-center">
                            <div>
                              <step.icon className="mx-auto mb-1 h-5 w-5 text-[#2D4A7C]" />
                              <span className="text-xs font-medium text-foreground">{step.title}</span>
                            </div>
                          </div>
                          <span className="mt-1 max-w-[140px] text-center text-xs text-muted-foreground">
                            {step.description}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <ArrowRight className="h-6 w-6 flex-shrink-0 text-[#2D4A7C]" />
                    
                    {/* End Event */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-4 border-[#C93535]">
                      <div className="h-4 w-4 rounded-full bg-[#C93535]" />
                    </div>
                  </div>
                </div>

                {/* Vertical connectors */}
                <div className="flex justify-around px-20 py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="h-6 w-0.5 bg-gray-400" />
                      <ArrowRight className="h-4 w-4 rotate-90 text-gray-400" />
                    </div>
                  ))}
                </div>

                {/* System Swimlane */}
                <div className="rounded-lg border-2 border-[#C93535] bg-red-50/50">
                  <div className="border-b-2 border-[#C93535] bg-[#C93535] px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-white" />
                      <span className="font-bold text-white">Система SmartSTE</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6">
                    {/* Start Event */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-400 bg-gray-100">
                      <div className="h-4 w-4 rounded-full border-2 border-gray-400" />
                    </div>
                    
                    {systemSteps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-4">
                        <ArrowRight className="h-6 w-6 flex-shrink-0 text-[#C93535]" />
                        <div className="flex flex-col items-center">
                          <div className="flex h-16 w-40 items-center justify-center rounded-lg border-2 border-[#C93535] bg-white p-2 text-center">
                            <div>
                              <step.icon className="mx-auto mb-1 h-5 w-5 text-[#C93535]" />
                              <span className="text-xs font-medium text-foreground">{step.title}</span>
                            </div>
                          </div>
                          <span className="mt-1 max-w-[140px] text-center text-xs text-muted-foreground">
                            {step.description}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <ArrowRight className="h-6 w-6 flex-shrink-0 text-[#C93535]" />
                    
                    {/* Loop back */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border-2 border-[#C93535] bg-orange-100">
                      <RefreshCw className="h-5 w-5 text-[#C93535]" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Steps */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border bg-background">
              <CardHeader className="bg-[#2D4A7C] text-white">
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5" />
                  Действия пользователя
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {userSteps.map((step, index) => (
                    <div key={step.id} className="flex gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2D4A7C] text-sm font-bold text-white">
                        {step.id}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardHeader className="bg-[#C93535] text-white">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Cpu className="h-5 w-5" />
                  Обработка системой
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {systemSteps.map((step, index) => (
                    <div key={step.id} className="flex gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#C93535] text-sm font-bold text-white">
                        {step.id}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Details */}
          <Card className="mt-6 border-border bg-background">
            <CardHeader>
              <CardTitle>Техническая реализация</CardTitle>
              <CardDescription>
                Детали реализации каждого этапа процесса
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-[#EDF1F7] p-4">
                  <Badge className="mb-2 bg-[#2D4A7C] text-white">Препроцессинг</Badge>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Levenshtein distance для опечаток</li>
                    <li>• Словарь синонимов</li>
                    <li>• Нормализация запроса</li>
                    <li>• Токенизация</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-[#EDF1F7] p-4">
                  <Badge className="mb-2 bg-[#2D4A7C] text-white">Векторизация</Badge>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Embeddings (768 dim)</li>
                    <li>• pgvector extension</li>
                    <li>• HNSW индекс</li>
                    <li>• Cosine similarity</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-[#EDF1F7] p-4">
                  <Badge className="mb-2 bg-[#2D4A7C] text-white">Гибридный поиск</Badge>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• PostgreSQL FTS</li>
                    <li>• to_tsvector + to_tsquery</li>
                    <li>• pg_trgm для fuzzy</li>
                    <li>• RRF fusion</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-[#EDF1F7] p-4">
                  <Badge className="mb-2 bg-[#C93535] text-white">Персонализация</Badge>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• User profile vector</li>
                    <li>• Interaction weights</li>
                    <li>• Real-time reranking</li>
                    <li>• A/B тестирование</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
