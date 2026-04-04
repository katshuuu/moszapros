"use client"

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { steItems } from '@/lib/ste-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, Building, Mail, Activity, Heart, ShoppingCart, 
  TrendingUp, Clock, Star, Download, Zap 
} from 'lucide-react'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = {
  office: 'Офисные поставки',
  medical: 'Медицинское оборудование',
  construction: 'Строительные материалы'
}

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated, user, interactions, favorites, searchHistory, addInteraction } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Calculate stats
  const stats = useMemo(() => {
    const views = interactions.filter(i => i.type === 'view').length
    const clicks = interactions.filter(i => i.type === 'click').length
    const purchases = interactions.filter(i => i.type === 'purchase').length
    const positiveFeedback = interactions.filter(i => i.type === 'positive').length
    const negativeFeedback = interactions.filter(i => i.type === 'negative').length

    return { views, clicks, purchases, positiveFeedback, negativeFeedback }
  }, [interactions])

  // Get favorite items
  const favoriteItems = useMemo(() => {
    return steItems.filter(item => favorites.includes(item.id))
  }, [favorites])

  // Get purchased items (simulated from interactions)
  const purchasedItems = useMemo(() => {
    const purchaseIds = [...new Set(interactions.filter(i => i.type === 'purchase').map(i => i.steId))]
    return steItems.filter(item => purchaseIds.includes(item.id))
  }, [interactions])

  // Simulate interaction for demo
  const simulateInteraction = () => {
    const randomItem = steItems[Math.floor(Math.random() * steItems.length)]
    const types: Array<'view' | 'click' | 'purchase' | 'positive'> = ['view', 'click', 'purchase', 'positive']
    const randomType = types[Math.floor(Math.random() * types.length)]
    
    addInteraction(randomItem.id, randomType)
    toast.success(`Симуляция: ${randomType === 'view' ? 'Просмотр' : randomType === 'click' ? 'Клик' : randomType === 'purchase' ? 'Покупка' : 'Позитивный отзыв'} товара "${randomItem.name}"`)
  }

  // Export to Excel (simulated)
  const exportToExcel = () => {
    toast.success('Данные экспортированы в Excel (демо)')
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#f5f5f5] py-8">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <Card className="mb-8 border-border bg-background">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2D4A7C] text-2xl font-bold text-white">
                    {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{user.fullName}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {user.organization}
                      </span>
                    </div>
                    <Badge className="mt-2 bg-[#EDF1F7] text-[#2D4A7C]">
                      {roleLabels[user.role] || 'Пользователь'}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={simulateInteraction}
                    className="gap-2 bg-[#C93535] text-white hover:bg-[#B02E2E]"
                  >
                    <Zap className="h-4 w-4" />
                    Симулировать взаимодействие
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToExcel}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Экспорт в Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-border bg-background">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.views}</p>
                    <p className="text-xs text-muted-foreground">Просмотров</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-100 p-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.clicks}</p>
                    <p className="text-xs text-muted-foreground">Кликов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.purchases}</p>
                    <p className="text-xs text-muted-foreground">Покупок</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2">
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{favorites.length}</p>
                    <p className="text-xs text-muted-foreground">В избранном</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-yellow-100 p-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.positiveFeedback}</p>
                    <p className="text-xs text-muted-foreground">Позитивных оценок</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="favorites" className="space-y-6">
            <TabsList>
              <TabsTrigger value="favorites">Избранное</TabsTrigger>
              <TabsTrigger value="purchases">История покупок</TabsTrigger>
              <TabsTrigger value="preferences">Мои предпочтения</TabsTrigger>
            </TabsList>

            <TabsContent value="favorites">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>Избранные товары</CardTitle>
                  <CardDescription>
                    Товары, которые вы добавили в избранное
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favoriteItems.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {favoriteItems.map((item) => (
                        <div key={item.id} className="rounded-lg border border-border p-4">
                          <Badge variant="secondary" className="mb-2 bg-[#EDF1F7] text-[#2D4A7C]">
                            {item.category}
                          </Badge>
                          <h4 className="font-medium text-foreground">{item.name}</h4>
                          <p className="text-sm text-[#2D4A7C]">{item.steCode}</p>
                          <p className="mt-2 text-sm font-bold text-[#2D4A7C]">
                            {item.priceMin.toLocaleString('ru-RU')} — {item.priceMax.toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      Вы ещё не добавили товары в избранное
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>История покупок</CardTitle>
                  <CardDescription>
                    Товары, которые вы добавляли в корзину
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {purchasedItems.length > 0 ? (
                    <div className="space-y-4">
                      {purchasedItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                          <div>
                            <h4 className="font-medium text-foreground">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.steCode} · {item.category}</p>
                          </div>
                          <p className="font-bold text-[#2D4A7C]">
                            {item.priceMin.toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      История покупок пуста. Попробуйте симулировать взаимодействие!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card className="border-border bg-background">
                <CardHeader>
                  <CardTitle>Мои предпочтения</CardTitle>
                  <CardDescription>
                    Система анализирует ваши взаимодействия для персонализации
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="rounded-lg bg-[#EDF1F7] p-4">
                      <h4 className="mb-2 font-medium text-foreground">Профиль организации</h4>
                      <p className="text-sm text-muted-foreground">
                        На основе профиля «{user.organization}» система определила вашу основную сферу деятельности: 
                        <strong className="text-[#2D4A7C]"> {roleLabels[user.role]}</strong>
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-3 font-medium text-foreground">Весовые коэффициенты взаимодействий</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <span className="text-sm text-foreground">Просмотр товара</span>
                          <Badge variant="outline">+0.1</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <span className="text-sm text-foreground">Клик на товар</span>
                          <Badge variant="outline">+0.3</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <span className="text-sm text-foreground">Добавление в избранное</span>
                          <Badge variant="outline">+0.5</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <span className="text-sm text-foreground">Позитивный отзыв</span>
                          <Badge variant="outline">+0.7</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <span className="text-sm text-foreground">Покупка</span>
                          <Badge className="bg-green-100 text-green-700">+1.0</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <span className="text-sm text-foreground">Негативный отзыв</span>
                          <Badge className="bg-red-100 text-red-700">-0.5</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#EDF1F7] p-4">
                      <h4 className="mb-2 font-medium text-foreground">Как это работает</h4>
                      <p className="text-sm text-muted-foreground">
                        Каждое ваше взаимодействие с системой влияет на персонализированную выдачу. 
                        Чем больше вы взаимодействуете с определёнными товарами или категориями, 
                        тем выше они будут ранжироваться в ваших результатах поиска.
                      </p>
                    </div>
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
