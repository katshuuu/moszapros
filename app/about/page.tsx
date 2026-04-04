"use client"

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, Brain, TrendingUp, Users, Database, Shield, 
  Zap, Globe, Server, Code, CheckCircle, ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Гибридный поиск',
    description: 'Комбинация полнотекстового поиска PostgreSQL (FTS) и векторного семантического поиска (pgvector) для максимальной точности.'
  },
  {
    icon: Brain,
    title: 'Искусственный интеллект',
    description: 'Нейросетевые embeddings для понимания смысла запросов, а не только совпадения ключевых слов.'
  },
  {
    icon: TrendingUp,
    title: 'Персонализация',
    description: 'Динамический reranking на основе истории взаимодействий каждого пользователя.'
  },
  {
    icon: Users,
    title: 'Профилирование',
    description: 'Автоматическое определение сферы деятельности организации для точных рекомендаций.'
  }
]

const techStack = [
  { name: 'Next.js 15', description: 'App Router, Server Components, Server Actions' },
  { name: 'TypeScript', description: 'Строгая типизация для надёжности' },
  { name: 'Tailwind CSS', description: 'Современный адаптивный дизайн' },
  { name: 'shadcn/ui', description: 'Высококачественные UI компоненты' },
  { name: 'PostgreSQL + pgvector', description: 'Векторный поиск с HNSW индексом' },
  { name: 'Zustand', description: 'Легковесный state management' }
]

const scalingPlans = [
  {
    icon: Globe,
    title: 'Интеграция с API zakupki.mos.ru',
    description: 'Подключение к реальному API Портала поставщиков для получения актуальных данных СТЕ в реальном времени.'
  },
  {
    icon: Users,
    title: 'Collaborative Filtering',
    description: 'Рекомендации на основе поведения похожих пользователей ("Пользователи также смотрели...").'
  },
  {
    icon: Brain,
    title: 'LLM-анализ запросов',
    description: 'Использование больших языковых моделей для глубокого понимания сложных и многозначных запросов.'
  },
  {
    icon: Server,
    title: 'Кластеризация пользователей',
    description: 'Автоматическое выделение сегментов пользователей для более точной персонализации.'
  },
  {
    icon: Database,
    title: 'Real-time синхронизация',
    description: 'Мгновенное обновление индексов при изменении данных в базе СТЕ.'
  },
  {
    icon: Shield,
    title: 'A/B тестирование',
    description: 'Инфраструктура для тестирования различных алгоритмов ранжирования.'
  }
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#2D4A7C] py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-[#C93535] text-white">Хакатон 2026</Badge>
            <h1 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
              SmartSTE — МосЗапрос
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/80">
              Персонализированный умный поиск Стандартных Товарных Единиц 
              для Портала поставщиков города Москвы
            </p>
          </div>
        </section>

        {/* Problem & Solution */}
        <section className="bg-background py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-border bg-red-50">
                <CardHeader>
                  <CardTitle className="text-[#C93535]">Проблема</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>• Базовый поиск не понимает опечатки и синонимы</p>
                  <p>• Одинаковые результаты для всех пользователей</p>
                  <p>• Нет учёта истории взаимодействий</p>
                  <p>• Сложно найти релевантные товары среди тысяч позиций</p>
                  <p>• Отсутствие метрик качества поиска</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-700">Решение</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>• Гибридный поиск с исправлением опечаток</p>
                  <p>• Персонализированное ранжирование для каждого пользователя</p>
                  <p>• Обучение системы на взаимодействиях в реальном времени</p>
                  <p>• Семантический поиск понимает смысл запроса</p>
                  <p>• Прозрачные метрики: NDCG, MAP, Precision@K</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="bg-[#EDF1F7] py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground md:text-3xl">
              Ключевые возможности
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} className="border-border bg-background">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2D4A7C]">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 font-bold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="bg-background py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground md:text-3xl">
              Технологический стек
            </h2>
            <div className="mx-auto max-w-3xl">
              <div className="grid gap-4 md:grid-cols-2">
                {techStack.map((tech, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border border-border p-4"
                  >
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <div>
                      <p className="font-medium text-foreground">{tech.name}</p>
                      <p className="text-sm text-muted-foreground">{tech.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Scaling Plans */}
        <section className="bg-[#EDF1F7] py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-2 text-center text-2xl font-bold text-foreground md:text-3xl">
              Возможности масштабирования
            </h2>
            <p className="mb-8 text-center text-muted-foreground">
              Планы развития для production-среды
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scalingPlans.map((plan, index) => (
                <Card key={index} className="border-border bg-background">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#C93535]">
                      <plan.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="mb-2 font-bold text-foreground">{plan.title}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Accounts */}
        <section className="bg-background py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground md:text-3xl">
              Демо-аккаунты для тестирования
            </h2>
            <div className="mx-auto max-w-2xl">
              <Card className="border-border bg-[#EDF1F7]">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-background p-4">
                      <div>
                        <p className="font-medium text-foreground">office@demo.ru</p>
                        <p className="text-sm text-muted-foreground">Офисные поставки</p>
                      </div>
                      <Badge className="bg-[#2D4A7C] text-white">Канцелярия, мебель, техника</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-background p-4">
                      <div>
                        <p className="font-medium text-foreground">medical@demo.ru</p>
                        <p className="text-sm text-muted-foreground">Медицинское оборудование</p>
                      </div>
                      <Badge className="bg-[#2D4A7C] text-white">Медтехника, расходники</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-background p-4">
                      <div>
                        <p className="font-medium text-foreground">construction@demo.ru</p>
                        <p className="text-sm text-muted-foreground">Строительные материалы</p>
                      </div>
                      <Badge className="bg-[#2D4A7C] text-white">Стройматериалы, инструменты</Badge>
                    </div>
                    <div className="rounded-lg bg-[#C93535]/10 p-4 text-center">
                      <p className="text-sm text-[#C93535]">
                        Пароль для всех аккаунтов: <strong>demo123</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
