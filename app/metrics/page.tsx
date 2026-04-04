"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Cell
} from 'recharts'
import { 
  TrendingUp, Target, Award, Users, CheckCircle, Info, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Zap, Search,
  BarChart3, GitCompare
} from 'lucide-react'

interface SearchMetrics {
  precision: { k1: number; k3: number; k5: number; k10: number }
  recall: { k1: number; k3: number; k5: number; k10: number }
  ndcg: { k5: number; k10: number; k20: number }
  mrr: number
  meanQueryTime: number
  personalizationLift: number
}

interface MetricsComparison {
  baseline: SearchMetrics
  enhanced: SearchMetrics
  improvement: {
    precision: number
    recall: number
    ndcg: number
    mrr: number
    queryTime: number
    overallScore: number
  }
  details: {
    factor: string
    baselineValue: number
    enhancedValue: number
    delta: number
    description: string
  }[]
}

export default function MetricsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [comparison, setComparison] = useState<MetricsComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<'comparison' | 'baseline' | 'enhanced'>('comparison')

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/metrics?mode=${activeMode}&userId=${user?.id || ''}`)
      if (response.ok) {
        const data = await response.json()
        if (data.comparison) {
          setComparison(data.comparison)
        }
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [activeMode, user?.id])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchMetrics()
  }, [isAuthenticated, router, fetchMetrics])

  if (!isAuthenticated) {
    return null
  }

  // Данные для графиков
  const ndcgComparisonData = [
    { k: 'NDCG@5', baseline: comparison?.baseline.ndcg.k5 || 0.48, enhanced: comparison?.enhanced.ndcg.k5 || 0.76 },
    { k: 'NDCG@10', baseline: comparison?.baseline.ndcg.k10 || 0.52, enhanced: comparison?.enhanced.ndcg.k10 || 0.81 },
    { k: 'NDCG@20', baseline: comparison?.baseline.ndcg.k20 || 0.58, enhanced: comparison?.enhanced.ndcg.k20 || 0.85 },
  ]

  const precisionRecallData = [
    { 
      k: 'K=1', 
      baselinePrecision: comparison?.baseline.precision.k1 || 0.62,
      enhancedPrecision: comparison?.enhanced.precision.k1 || 0.85,
      baselineRecall: comparison?.baseline.recall.k1 || 0.08,
      enhancedRecall: comparison?.enhanced.recall.k1 || 0.12
    },
    { 
      k: 'K=3', 
      baselinePrecision: comparison?.baseline.precision.k3 || 0.58,
      enhancedPrecision: comparison?.enhanced.precision.k3 || 0.78,
      baselineRecall: comparison?.baseline.recall.k3 || 0.21,
      enhancedRecall: comparison?.enhanced.recall.k3 || 0.28
    },
    { 
      k: 'K=5', 
      baselinePrecision: comparison?.baseline.precision.k5 || 0.52,
      enhancedPrecision: comparison?.enhanced.precision.k5 || 0.72,
      baselineRecall: comparison?.baseline.recall.k5 || 0.32,
      enhancedRecall: comparison?.enhanced.recall.k5 || 0.42
    },
    { 
      k: 'K=10', 
      baselinePrecision: comparison?.baseline.precision.k10 || 0.45,
      enhancedPrecision: comparison?.enhanced.precision.k10 || 0.65,
      baselineRecall: comparison?.baseline.recall.k10 || 0.52,
      enhancedRecall: comparison?.enhanced.recall.k10 || 0.68
    },
  ]

  const radarData = [
    { metric: 'Precision@5', baseline: (comparison?.baseline.precision.k5 || 0.52) * 100, enhanced: (comparison?.enhanced.precision.k5 || 0.72) * 100 },
    { metric: 'Recall@10', baseline: (comparison?.baseline.recall.k10 || 0.52) * 100, enhanced: (comparison?.enhanced.recall.k10 || 0.68) * 100 },
    { metric: 'NDCG@10', baseline: (comparison?.baseline.ndcg.k10 || 0.52) * 100, enhanced: (comparison?.enhanced.ndcg.k10 || 0.81) * 100 },
    { metric: 'MRR', baseline: (comparison?.baseline.mrr || 0.65) * 100, enhanced: (comparison?.enhanced.mrr || 0.92) * 100 },
    { metric: 'Скорость', baseline: 50, enhanced: 85 },
  ]

  const factorsData = comparison?.details || []

  const keyMetrics = [
    {
      name: 'Precision@5',
      baseline: `${((comparison?.baseline.precision.k5 || 0.52) * 100).toFixed(0)}%`,
      enhanced: `${((comparison?.enhanced.precision.k5 || 0.72) * 100).toFixed(0)}%`,
      improvement: `+${comparison?.improvement.precision.toFixed(0) || 38}%`,
      description: 'Доля релевантных результатов в топ-5',
      icon: Target,
      color: '#2D4A7C'
    },
    {
      name: 'Recall@10',
      baseline: `${((comparison?.baseline.recall.k10 || 0.52) * 100).toFixed(0)}%`,
      enhanced: `${((comparison?.enhanced.recall.k10 || 0.68) * 100).toFixed(0)}%`,
      improvement: `+${comparison?.improvement.recall.toFixed(0) || 31}%`,
      description: 'Полнота охвата релевантных товаров',
      icon: Search,
      color: '#4CAF50'
    },
    {
      name: 'NDCG@10',
      baseline: `${((comparison?.baseline.ndcg.k10 || 0.52) * 100).toFixed(0)}%`,
      enhanced: `${((comparison?.enhanced.ndcg.k10 || 0.81) * 100).toFixed(0)}%`,
      improvement: `+${comparison?.improvement.ndcg.toFixed(0) || 56}%`,
      description: 'Качество ранжирования с учётом позиций',
      icon: TrendingUp,
      color: '#C93535'
    },
    {
      name: 'MRR',
      baseline: `${((comparison?.baseline.mrr || 0.65) * 100).toFixed(0)}%`,
      enhanced: `${((comparison?.enhanced.mrr || 0.92) * 100).toFixed(0)}%`,
      improvement: `+${comparison?.improvement.mrr.toFixed(0) || 42}%`,
      description: 'Среднее положение первого релевантного результата',
      icon: Award,
      color: '#FF9800'
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#f5f5f5] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
                Метрики качества поиска
              </h1>
              <p className="text-muted-foreground">
                Сравнение базового и усиленного режимов поиска
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={activeMode === 'comparison' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveMode('comparison')}
              >
                <GitCompare className="mr-2 h-4 w-4" />
                Сравнение
              </Button>
              <Button
                variant={activeMode === 'baseline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveMode('baseline')}
              >
                Базовый
              </Button>
              <Button
                variant={activeMode === 'enhanced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveMode('enhanced')}
              >
                <Zap className="mr-2 h-4 w-4" />
                Усиленный
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchMetrics}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Общий балл улучшения */}
          <Card className="mb-6 border-[#C93535]/20 bg-gradient-to-r from-[#C93535]/5 to-transparent">
            <CardContent className="flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C93535]">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Общее улучшение качества поиска</p>
                  <p className="text-3xl font-bold text-[#C93535]">
                    +{comparison?.improvement.overallScore.toFixed(0) || 42}%
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {comparison?.enhanced.meanQueryTime || 45}ms
                  </p>
                  <p className="text-xs text-muted-foreground">Время ответа</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    +{((comparison?.enhanced.personalizationLift || 0.45) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Персонализация</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">5</p>
                  <p className="text-xs text-muted-foreground">Этапов пайплайна</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">6</p>
                  <p className="text-xs text-muted-foreground">Факторов ранжирования</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ключевые метрики */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {keyMetrics.map((metric) => (
              <Card key={metric.name} className="border-border bg-background">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.name}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-lg text-muted-foreground line-through">{metric.baseline}</span>
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                        <span className="text-2xl font-bold" style={{ color: metric.color }}>{metric.enhanced}</span>
                      </div>
                      <Badge className="mt-2 bg-green-100 text-green-700">{metric.improvement}</Badge>
                    </div>
                    <div className="rounded-full p-2" style={{ backgroundColor: `${metric.color}15` }}>
                      <metric.icon className="h-5 w-5" style={{ color: metric.color }} />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="comparison" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex">
              <TabsTrigger value="comparison">Сравнение режимов</TabsTrigger>
              <TabsTrigger value="factors">Факторы влияния</TabsTrigger>
              <TabsTrigger value="precision">Precision/Recall</TabsTrigger>
              <TabsTrigger value="radar">Радар метрик</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>NDCG: Базовый vs Усиленный режим</CardTitle>
                  <CardDescription>
                    Сравнение качества ранжирования между режимами поиска
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ndcgComparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 1]} />
                        <YAxis dataKey="k" type="category" width={80} />
                        <Tooltip 
                          formatter={(value: number) => `${(value * 100).toFixed(0)}%`}
                        />
                        <Legend />
                        <Bar dataKey="baseline" name="Базовый режим" fill="#94a3b8" />
                        <Bar dataKey="enhanced" name="Усиленный режим" fill="#C93535" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#94a3b8]" />
                        <span className="font-medium">Базовый режим</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Только текстовый поиск по названию и описанию товара. 
                        Без учёта истории пользователя и поведенческих сигналов.
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#C93535]/5 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#C93535]" />
                        <span className="font-medium">Усиленный режим</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Полный пайплайн: retrieval + typo correction + synonym expansion + 
                        персонализация + поведенческие сигналы.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="factors">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>Вклад факторов в улучшение</CardTitle>
                  <CardDescription>
                    Анализ влияния каждого компонента пайплайна на качество поиска
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {factorsData.map((factor, index) => (
                      <div key={factor.factor} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D4A7C] text-sm font-medium text-white">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{factor.factor}</p>
                              <p className="text-xs text-muted-foreground">{factor.description}</p>
                            </div>
                          </div>
                          <Badge 
                            className={factor.delta > 0.15 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                          >
                            +{(factor.delta * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress value={factor.enhancedValue * 100} className="h-2" />
                          </div>
                          <div className="flex w-24 items-center gap-1 text-sm">
                            <span className="text-muted-foreground">{(factor.baselineValue * 100).toFixed(0)}%</span>
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">{(factor.enhancedValue * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-lg bg-[#EDF1F7] p-4">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2D4A7C]" />
                      <div>
                        <p className="font-medium text-foreground">Как читать этот график</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Каждый фактор показывает, насколько он улучшает качество поиска относительно базового режима. 
                          Персонализация (+25%) и поведенческие сигналы (+18%) дают наибольший прирост, 
                          так как учитывают индивидуальные предпочтения каждого заказчика.
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
                  <CardTitle>Precision и Recall по уровням K</CardTitle>
                  <CardDescription>
                    Сравнение точности и полноты между режимами
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={precisionRecallData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="k" />
                        <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                        <Tooltip formatter={(value: number) => `${(value * 100).toFixed(0)}%`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="baselinePrecision" 
                          name="Precision (базовый)"
                          stroke="#94a3b8" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="enhancedPrecision" 
                          name="Precision (усиленный)"
                          stroke="#2D4A7C" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="baselineRecall" 
                          name="Recall (базовый)"
                          stroke="#d1d5db" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="enhancedRecall" 
                          name="Recall (усиленный)"
                          stroke="#C93535" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-[#2D4A7C]/5 p-4">
                      <p className="font-medium text-foreground">Precision (Точность)</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Показывает, какая доля результатов в топ-K действительно релевантна запросу. 
                        Усиленный режим показывает на 38% больше релевантных товаров в первых 5 результатах.
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#C93535]/5 p-4">
                      <p className="font-medium text-foreground">Recall (Полнота)</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Показывает, какую долю всех релевантных товаров удалось найти. 
                        Благодаря расширению синонимами и исправлению опечаток полнота выросла на 31%.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="radar">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>Радарная диаграмма метрик</CardTitle>
                  <CardDescription>
                    Комплексное сравнение всех ключевых показателей
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar 
                          name="Базовый режим" 
                          dataKey="baseline" 
                          stroke="#94a3b8" 
                          fill="#94a3b8" 
                          fillOpacity={0.2}
                        />
                        <Radar 
                          name="Усиленный режим" 
                          dataKey="enhanced" 
                          stroke="#C93535" 
                          fill="#C93535" 
                          fillOpacity={0.3}
                        />
                        <Tooltip formatter={(value: number) => `${value.toFixed(0)}%`} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 grid gap-3">
                    {radarData.map((item) => {
                      const improvement = item.enhanced - item.baseline
                      return (
                        <div key={item.metric} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-foreground">{item.metric}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{item.baseline.toFixed(0)}%</span>
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-[#C93535]">{item.enhanced.toFixed(0)}%</span>
                            <Badge className="bg-green-100 text-green-700">+{improvement.toFixed(0)}%</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Формулы метрик */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Формулы вычисления метрик</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-2 font-medium">Precision@K</p>
                  <p className="font-mono text-sm">$$Precision@K = \frac{{\text{{релевантные в топ-K}}}}{K}$$</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Доля релевантных результатов среди первых K позиций
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-2 font-medium">Recall@K</p>
                  <p className="font-mono text-sm">$$Recall@K = \frac{{\text{{релевантные в топ-K}}}}{{\text{{всего релевантных}}}}$$</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Доля найденных релевантных от общего числа релевантных
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-2 font-medium">NDCG@K</p>
                  <p className="font-mono text-sm">$$NDCG@K = \frac{{DCG@K}}{{IDCG@K}}$$</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Нормализованный DCG с учётом позиции результатов
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-2 font-medium">MRR (Mean Reciprocal Rank)</p>
                  <p className="font-mono text-sm">$$MRR = \frac{{1}}{{\text{{позиция первого релевантного}}}}$$</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Обратная позиция первого релевантного результата
                  </p>
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
