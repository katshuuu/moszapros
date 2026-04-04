"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Clock, ArrowRight, History as HistoryIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function HistoryPage() {
  const router = useRouter()
  const { isAuthenticated, searchHistory } = useAuthStore()

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
              История поисков
            </h1>
            <p className="text-muted-foreground">
              Ваши последние поисковые запросы
            </p>
          </div>

          <Card className="border-border bg-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="h-5 w-5" />
                Последние запросы
              </CardTitle>
              <CardDescription>
                Нажмите на запрос, чтобы повторить поиск
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchHistory.length > 0 ? (
                <div className="space-y-3">
                  {searchHistory.map((item) => (
                    <Link
                      key={item.id}
                      href={`/search?q=${encodeURIComponent(item.query)}`}
                      className="group flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-[#EDF1F7]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF1F7] group-hover:bg-white">
                          <Search className="h-5 w-5 text-[#2D4A7C]" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.query}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(item.timestamp), { 
                              addSuffix: true,
                              locale: ru 
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-[#EDF1F7] text-[#2D4A7C]">
                          {item.resultsCount} результатов
                        </Badge>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EDF1F7]">
                    <Search className="h-8 w-8 text-[#2D4A7C]" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-foreground">
                    История пуста
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Вы ещё не выполняли поисковых запросов
                  </p>
                  <Link href="/search">
                    <Button className="bg-[#C93535] text-white hover:bg-[#B02E2E]">
                      Начать поиск
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
