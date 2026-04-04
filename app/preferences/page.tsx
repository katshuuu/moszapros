"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Network, User, Tag, Star, ShoppingCart, Eye, 
  TrendingUp, Package, Building2, RefreshCw 
} from 'lucide-react'

interface PreferenceNode {
  id: string
  type: 'user' | 'category' | 'brand' | 'characteristic' | 'ste'
  label: string
  weight: number
}

interface PreferenceEdge {
  source: string
  target: string
  weight: number
  interactionType: string
  count: number
}

interface PreferenceGraph {
  nodes: PreferenceNode[]
  edges: PreferenceEdge[]
  summary: {
    topCategories: { name: string; weight: number; count: number }[]
    topBrands: { name: string; weight: number; count: number }[]
    topCharacteristics: { name: string; weight: number }[]
    totalInteractions: number
    personalizationStrength: number
  }
}

const nodeColors: Record<string, string> = {
  user: '#C93535',
  category: '#2D4A7C',
  brand: '#4CAF50',
  characteristic: '#FF9800',
  ste: '#9C27B0'
}

const nodeIcons: Record<string, React.ElementType> = {
  user: Building2,
  category: Tag,
  brand: Star,
  characteristic: TrendingUp,
  ste: Package
}

export default function PreferencesPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [graph, setGraph] = useState<PreferenceGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<PreferenceNode | null>(null)

  const fetchPreferences = useCallback(async () => {
    if (!user?.inn) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/preferences?inn=${user.inn}`)
      if (response.ok) {
        const data = await response.json()
        setGraph(data.graph)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.inn])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchPreferences()
  }, [isAuthenticated, router, fetchPreferences])

  if (!isAuthenticated) {
    return null
  }

  const getConnectedNodes = (nodeId: string) => {
    if (!graph) return []
    return graph.edges
      .filter(e => e.source === nodeId || e.target === nodeId)
      .map(e => {
        const connectedId = e.source === nodeId ? e.target : e.source
        const node = graph.nodes.find(n => n.id === connectedId)
        return { ...node, edge: e }
      })
      .filter(Boolean)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#f5f5f5] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
                Граф предпочтений
              </h1>
              <p className="text-muted-foreground">
                Визуализация связей: категории, бренды и характеристики
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchPreferences}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>

          {/* Информация о пользователе */}
          <Card className="mb-6 border-[#2D4A7C]/20 bg-[#2D4A7C]/5">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2D4A7C]">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{user?.organization}</p>
                <p className="text-sm text-muted-foreground">
                  ИНН: {user?.inn} | {user?.region}
                </p>
              </div>
              {graph && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2D4A7C]">
                    {Math.round(graph.summary.personalizationStrength * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Сила персонализации</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="graph" className="space-y-6">
            <TabsList>
              <TabsTrigger value="graph">Визуализация графа</TabsTrigger>
              <TabsTrigger value="categories">Категории</TabsTrigger>
              <TabsTrigger value="brands">Бренды</TabsTrigger>
              <TabsTrigger value="stats">Статистика</TabsTrigger>
            </TabsList>

            <TabsContent value="graph">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Граф связей
                  </CardTitle>
                  <CardDescription>
                    Нажмите на узел для просмотра связей
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex h-[400px] items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : graph ? (
                    <div className="grid gap-6 lg:grid-cols-3">
                      {/* Визуализация узлов */}
                      <div className="lg:col-span-2">
                        <div className="rounded-lg border bg-white p-4">
                          <div className="mb-4 flex flex-wrap gap-2">
                            {Object.entries(nodeColors).map(([type, color]) => {
                              const Icon = nodeIcons[type]
                              return (
                                <Badge 
                                  key={type}
                                  variant="outline"
                                  className="gap-1"
                                  style={{ borderColor: color, color }}
                                >
                                  <Icon className="h-3 w-3" />
                                  {type === 'user' ? 'Организация' :
                                   type === 'category' ? 'Категория' :
                                   type === 'brand' ? 'Бренд' :
                                   type === 'characteristic' ? 'Характеристика' : 'СТЕ'}
                                </Badge>
                              )
                            })}
                          </div>
                          
                          {/* Упрощенная визуализация графа */}
                          <div className="relative min-h-[350px]">
                            {/* Центральный узел (пользователь) */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                              <button
                                onClick={() => setSelectedNode(graph.nodes.find(n => n.type === 'user') || null)}
                                className="flex h-16 w-16 items-center justify-center rounded-full border-4 transition-transform hover:scale-110"
                                style={{ 
                                  backgroundColor: nodeColors.user,
                                  borderColor: selectedNode?.type === 'user' ? '#fff' : nodeColors.user
                                }}
                              >
                                <User className="h-8 w-8 text-white" />
                              </button>
                            </div>
                            
                            {/* Категории (первый круг) */}
                            {graph.nodes
                              .filter(n => n.type === 'category')
                              .slice(0, 6)
                              .map((node, i, arr) => {
                                const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2
                                const radius = 120
                                const x = Math.cos(angle) * radius
                                const y = Math.sin(angle) * radius
                                const Icon = nodeIcons[node.type]
                                
                                return (
                                  <button
                                    key={node.id}
                                    onClick={() => setSelectedNode(node)}
                                    className="absolute flex items-center justify-center rounded-full border-2 transition-all hover:scale-110"
                                    style={{
                                      left: `calc(50% + ${x}px)`,
                                      top: `calc(50% + ${y}px)`,
                                      transform: 'translate(-50%, -50%)',
                                      width: `${40 + node.weight * 20}px`,
                                      height: `${40 + node.weight * 20}px`,
                                      backgroundColor: nodeColors[node.type],
                                      borderColor: selectedNode?.id === node.id ? '#fff' : nodeColors[node.type],
                                      boxShadow: selectedNode?.id === node.id ? '0 0 0 3px rgba(45,74,124,0.3)' : 'none'
                                    }}
                                  >
                                    <Icon className="h-4 w-4 text-white" />
                                  </button>
                                )
                              })}
                            
                            {/* СТЕ (внешний круг) */}
                            {graph.nodes
                              .filter(n => n.type === 'ste')
                              .slice(0, 8)
                              .map((node, i, arr) => {
                                const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 4
                                const radius = 180
                                const x = Math.cos(angle) * radius
                                const y = Math.sin(angle) * radius
                                const Icon = nodeIcons[node.type]
                                
                                return (
                                  <button
                                    key={node.id}
                                    onClick={() => setSelectedNode(node)}
                                    className="absolute flex items-center justify-center rounded-full border transition-all hover:scale-110"
                                    style={{
                                      left: `calc(50% + ${x}px)`,
                                      top: `calc(50% + ${y}px)`,
                                      transform: 'translate(-50%, -50%)',
                                      width: `${30 + node.weight * 15}px`,
                                      height: `${30 + node.weight * 15}px`,
                                      backgroundColor: nodeColors[node.type],
                                      borderColor: selectedNode?.id === node.id ? '#fff' : nodeColors[node.type]
                                    }}
                                  >
                                    <Icon className="h-3 w-3 text-white" />
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Информация о выбранном узле */}
                      <div>
                        <Card className="sticky top-4">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">
                              {selectedNode ? selectedNode.label : 'Выберите узел'}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedNode ? (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    style={{ backgroundColor: nodeColors[selectedNode.type] }}
                                  >
                                    {selectedNode.type === 'user' ? 'Организация' :
                                     selectedNode.type === 'category' ? 'Категория' :
                                     selectedNode.type === 'brand' ? 'Бренд' :
                                     selectedNode.type === 'characteristic' ? 'Характеристика' : 'СТЕ'}
                                  </Badge>
                                </div>
                                
                                <div>
                                  <p className="mb-1 text-sm text-muted-foreground">Вес в графе</p>
                                  <Progress value={selectedNode.weight * 100} className="h-2" />
                                  <p className="mt-1 text-right text-xs text-muted-foreground">
                                    {(selectedNode.weight * 100).toFixed(0)}%
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="mb-2 text-sm font-medium">Связанные узлы:</p>
                                  <div className="space-y-2">
                                    {getConnectedNodes(selectedNode.id).slice(0, 5).map((conn: { id?: string; label?: string; type?: string; edge?: { interactionType: string; count: number } }) => (
                                      <div 
                                        key={conn.id}
                                        className="flex items-center justify-between rounded-lg bg-muted p-2 text-sm"
                                      >
                                        <span className="truncate">{conn.label}</span>
                                        <Badge variant="outline" className="ml-2 shrink-0">
                                          {conn.edge?.count || 0}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Нажмите на любой узел графа, чтобы увидеть детальную информацию о связях
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">Нет данных</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Предпочитаемые категории
                  </CardTitle>
                  <CardDescription>
                    Категории СТЕ, которые организация закупает чаще всего
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {graph ? (
                    <div className="space-y-4">
                      {graph.summary.topCategories.map((cat, i) => (
                        <div key={cat.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                                style={{ backgroundColor: nodeColors.category }}
                              >
                                {i + 1}
                              </div>
                              <span className="font-medium">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline">
                                <ShoppingCart className="mr-1 h-3 w-3" />
                                {cat.count} контрактов
                              </Badge>
                              <span className="font-semibold text-[#2D4A7C]">
                                {(cat.weight * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <Progress value={cat.weight * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Загрузка...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="brands">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Предпочитаемые бренды
                  </CardTitle>
                  <CardDescription>
                    Бренды и производители, которым организация отдает предпочтение
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {graph && graph.summary.topBrands.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {graph.summary.topBrands.map((brand) => (
                        <Card key={brand.name} className="border-[#4CAF50]/20">
                          <CardContent className="flex items-center gap-4 p-4">
                            <div 
                              className="flex h-12 w-12 items-center justify-center rounded-full"
                              style={{ backgroundColor: nodeColors.brand }}
                            >
                              <Star className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{brand.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {brand.count} закупок
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold" style={{ color: nodeColors.brand }}>
                                {(brand.weight * 100).toFixed(0)}%
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Данные о брендах будут доступны после накопления истории закупок
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Характеристики */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Важные характеристики
                  </CardTitle>
                  <CardDescription>
                    Характеристики товаров, на которые организация обращает внимание
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {graph && graph.summary.topCharacteristics.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {graph.summary.topCharacteristics.map((char) => (
                        <Badge 
                          key={char.name}
                          variant="outline"
                          className="px-4 py-2 text-sm"
                          style={{ 
                            borderColor: nodeColors.characteristic,
                            backgroundColor: `${nodeColors.characteristic}10`
                          }}
                        >
                          <span style={{ color: nodeColors.characteristic }}>
                            {char.name}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {(char.weight * 100).toFixed(0)}%
                          </span>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Данные о характеристиках будут доступны после накопления истории
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-[#2D4A7C]/10 p-3">
                        <ShoppingCart className="h-6 w-6 text-[#2D4A7C]" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{graph?.summary.totalInteractions || 0}</p>
                        <p className="text-sm text-muted-foreground">Всего взаимодействий</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-[#4CAF50]/10 p-3">
                        <Tag className="h-6 w-6 text-[#4CAF50]" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{graph?.summary.topCategories.length || 0}</p>
                        <p className="text-sm text-muted-foreground">Категорий</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-[#FF9800]/10 p-3">
                        <Star className="h-6 w-6 text-[#FF9800]" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{graph?.summary.topBrands.length || 0}</p>
                        <p className="text-sm text-muted-foreground">Брендов</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-[#C93535]/10 p-3">
                        <Eye className="h-6 w-6 text-[#C93535]" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {graph ? `${Math.round(graph.summary.personalizationStrength * 100)}%` : '0%'}
                        </p>
                        <p className="text-sm text-muted-foreground">Персонализация</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Как это влияет на поиск?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Граф предпочтений</strong> — это модель поведения 
                      вашей организации, построенная на основе истории контрактов и взаимодействий с каталогом СТЕ.
                    </p>
                    <p>
                      При поиске система автоматически учитывает ваши предпочтения и показывает 
                      наиболее релевантные товары выше в результатах. Например, если вы часто закупаете 
                      медицинское оборудование, при поиске «перчатки» на первых позициях будут 
                      медицинские перчатки, а не строительные.
                    </p>
                    <p>
                      <strong className="text-foreground">Сила персонализации {graph ? `${Math.round(graph.summary.personalizationStrength * 100)}%` : ''}</strong> показывает, 
                      насколько система «понимает» ваши предпочтения. Чем больше взаимодействий, 
                      тем точнее персонализация.
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
