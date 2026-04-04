"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar 
} from 'recharts'
import { TrendingUp, Target, Award, Users, CheckCircle, Info } from 'lucide-react'

// Simulated metrics data
const ndcgData = [
  { day: 'День 1', before: 0.45, after: 0.52 },
  { day: 'День 2', before: 0.47, after: 0.58 },
  { day: 'День 3', before: 0.46, after: 0.63 },
  { day: 'День 4', before: 0.48, after: 0.68 },
  { day: 'День 5', before: 0.45, after: 0.72 },
  { day: 'День 6', before: 0.47, after: 0.76 },
  { day: 'День 7', before: 0.46, after: 0.81 },
]

const precisionRecallData = [
  { k: 'K=1', precision: 0.85, recall: 0.12 },
  { k: 'K=3', precision: 0.78, recall: 0.28 },
  { k: 'K=5', precision: 0.72, recall: 0.42 },
  { k: 'K=10', precision: 0.65, recall: 0.68 },
  { k: 'K=20', precision: 0.55, recall: 0.85 },
]

const radarData = [
  { metric: 'NDCG@10', value: 0.81, fullMark: 1 },
  { metric: 'MAP', value: 0.74, fullMark: 1 },
  { metric: 'Precision@5', value: 0.72, fullMark: 1 },
  { metric: 'Recall@10', value: 0.68, fullMark: 1 },
  { metric: 'Персонализация', value: 0.85, fullMark: 1 },
  { metric: 'CTR', value: 0.78, fullMark: 1 },
]

const engagementData = [
  { category: 'Канцелярия', ctr: 12.5, conversions: 8.2 },
  { category: 'Мебель', ctr: 9.8, conversions: 5.4 },
  { category: 'Компьютеры', ctr: 15.2, conversions: 10.1 },
  { category: 'Медицина', ctr: 18.5, conversions: 12.8 },
  { category: 'Стройматериалы', ctr: 11.3, conversions: 7.5 },
]

const metrics = [
  {
    name: 'NDCG@10',
    value: '0.81',
    change: '+36%',
    description: 'Normalized Discounted Cumulative Gain — оценивает качество ранжирования с учётом позиции релевантных результатов',
    icon: TrendingUp
  },
  {
    name: 'MAP',
    value: '0.74',
    change: '+28%',
    description: 'Mean Average Precision — средняя точность по всем запросам',
    icon: Target
  },
  {
    name: 'Precision@5',
    value: '0.72',
    change: '+24%',
    description: 'Доля релевантных результатов в топ-5',
    icon: Award
  },
  {
    name: 'Personalization Lift',
    value: '+45%',
    change: '',
    description: 'Улучшение качества выдачи благодаря персонализации',
    icon: Users
  }
]

export default function MetricsPage() {
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
              Метрики качества поиска
            </h1>
            <p className="text-muted-foreground">
              Анализ эффективности персонализированного поиска СТЕ
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.name} className="border-border bg-background">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.name}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                        {metric.change && (
                          <Badge className="bg-green-100 text-green-700">{metric.change}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="rounded-full bg-[#EDF1F7] p-2">
                      <metric.icon className="h-5 w-5 text-[#2D4A7C]" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="ndcg" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex">
              <TabsTrigger value="ndcg">NDCG Динамика</TabsTrigger>
              <TabsTrigger value="precision">Precision/Recall</TabsTrigger>
              <TabsTrigger value="radar">Обзор метрик</TabsTrigger>
              <TabsTrigger value="engagement">Вовлечённость</TabsTrigger>
            </TabsList>

            <TabsContent value="ndcg">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>NDCG@10: До и после персонализации</CardTitle>
                  <CardDescription>
                    Сравнение качества ранжирования без персонализации (синий) и с персонализацией (красный)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ndcgData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 1]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="before" 
                          name="Без персонализации"
                          stroke="#2D4A7C" 
                          strokeWidth={2}
                          dot={{ fill: '#2D4A7C' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="after" 
                          name="С персонализацией"
                          stroke="#C93535" 
                          strokeWidth={2}
                          dot={{ fill: '#C93535' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 rounded-lg bg-[#EDF1F7] p-4">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2D4A7C]" />
                      <div>
                        <p className="font-medium text-foreground">Интерпретация результатов</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          NDCG (Normalized Discounted Cumulative Gain) оценивает качество ранжирования с учётом позиции 
                          релевантных результатов. Значение 0.81 означает, что система показывает наиболее релевантные 
                          товары на первых позициях в 81% случаев. Рост на 36% по сравнению с базовым поиском 
                          демонстрирует эффективность персонализации.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="precision">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>Precision@K и Recall@K</CardTitle>
                  <CardDescription>
                    Баланс между точностью и полнотой результатов поиска
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={precisionRecallData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="k" />
                        <YAxis domain={[0, 1]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="precision" name="Precision" fill="#2D4A7C" />
                        <Bar dataKey="recall" name="Recall" fill="#C93535" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-[#EDF1F7] p-4">
                      <p className="font-medium text-foreground">Precision@K</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Доля релевантных результатов среди первых K позиций. При K=5 точность составляет 72%, 
                        что означает, что почти 4 из 5 показанных товаров соответствуют запросу пользователя.
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#EDF1F7] p-4">
                      <p className="font-medium text-foreground">Recall@K</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Доля найденных релевантных результатов от всех релевантных в базе. При K=10 полнота 
                        составляет 68%, система находит большинство подходящих товаров.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="radar">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>Комплексная оценка качества</CardTitle>
                  <CardDescription>
                    Радарная диаграмма всех ключевых метрик системы
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis domain={[0, 1]} />
                        <Radar 
                          name="Текущие показатели" 
                          dataKey="value" 
                          stroke="#C93535" 
                          fill="#C93535" 
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 grid gap-3">
                    {radarData.map((item) => (
                      <div key={item.metric} className="flex items-center justify-between rounded-lg bg-[#EDF1F7] p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-foreground">{item.metric}</span>
                        </div>
                        <Badge variant="secondary" className="bg-[#2D4A7C] text-white">
                          {(item.value * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>User Engagement по категориям</CardTitle>
                  <CardDescription>
                    CTR (кликабельность) и конверсия в добавление в корзину
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={engagementData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" unit="%" />
                        <YAxis dataKey="category" type="category" width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="ctr" name="CTR (%)" fill="#2D4A7C" />
                        <Bar dataKey="conversions" name="Конверсия (%)" fill="#C93535" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 rounded-lg bg-[#EDF1F7] p-4">
                    <p className="font-medium text-foreground">Выводы</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Наибольшая вовлечённость наблюдается в категории «Медицинское оборудование» (CTR 18.5%), 
                      что объясняется точностью персонализированных рекомендаций для медицинских учреждений. 
                      Средний CTR по всем категориям составляет 13.5%, что на 42% выше среднерыночного показателя.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
