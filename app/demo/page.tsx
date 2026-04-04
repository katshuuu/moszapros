"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'
import { performSearch, russianStem, correctTypos, expandWithSynonyms } from '@/lib/search-engine'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRight, Search, Sparkles, Brain, History, 
  ThumbsUp, ThumbsDown, Eye, ShoppingCart, RefreshCw
} from 'lucide-react'

export default function DemoPage() {
  const router = useRouter()
  const { isAuthenticated, user, interactions, addInteraction } = useAuthStore()
  const [testWord, setTestWord] = useState('бумаги')
  const [testQuery, setTestQuery] = useState('бумга офисная')
  const [searchQuery, setSearchQuery] = useState('бумага')
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Demo: Stemming
  const stemmingResult = useMemo(() => {
    return russianStem(testWord)
  }, [testWord])

  // Demo: Typo correction
  const typoResult = useMemo(() => {
    return correctTypos(testQuery)
  }, [testQuery])

  // Demo: Synonym expansion
  const synonymResult = useMemo(() => {
    return expandWithSynonyms(testQuery)
  }, [testQuery])

  // Demo: Search with personalization
  const searchResult = useMemo(() => {
    if (!searchQuery.trim()) return null
    return performSearch(searchQuery, 'Все категории', user?.role, interactions)
  }, [searchQuery, user?.role, interactions])

  // Interaction statistics
  const interactionStats = useMemo(() => {
    const stats = {
      views: interactions.filter(i => i.type === 'view').length,
      clicks: interactions.filter(i => i.type === 'click').length,
      purchases: interactions.filter(i => i.type === 'purchase').length,
      positive: interactions.filter(i => i.type === 'positive').length,
      negative: interactions.filter(i => i.type === 'negative').length,
    }
    return stats
  }, [interactions])

  // Simulate interaction for demo
  const simulateInteraction = (type: 'view' | 'click' | 'purchase' | 'positive' | 'negative') => {
    if (searchResult && searchResult.results.length > 0) {
      const randomItem = searchResult.results[Math.floor(Math.random() * Math.min(3, searchResult.results.length))]
      addInteraction(randomItem.id, type)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#f5f5f5] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-[#1a1a1a] md:text-3xl">
              Демонстрация алгоритмов
            </h1>
            <p className="text-[#666666]">
              Интерактивная демонстрация морфологии, синонимов, опечаток и персонализации
            </p>
          </div>

          <Tabs defaultValue="morphology" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex">
              <TabsTrigger value="morphology">Морфология</TabsTrigger>
              <TabsTrigger value="typos">Опечатки</TabsTrigger>
              <TabsTrigger value="synonyms">Синонимы</TabsTrigger>
              <TabsTrigger value="personalization">Персонализация</TabsTrigger>
            </TabsList>

            <TabsContent value="morphology">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-[#2D4A7C]" />
                    Морфологический анализ (Стемминг)
                  </CardTitle>
                  <CardDescription>
                    Алгоритм приводит слова к их основе (стемму) для поиска по всем словоформам.
                    Реализован упрощённый алгоритм Портера для русского языка.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Input
                      value={testWord}
                      onChange={(e) => setTestWord(e.target.value)}
                      placeholder="Введите слово..."
                      className="max-w-xs"
                    />
                    <ArrowRight className="h-5 w-5 text-[#666666]" />
                    <Badge className="bg-[#2D4A7C] px-4 py-2 text-lg">
                      {stemmingResult}
                    </Badge>
                  </div>

                  <div className="rounded-lg bg-[#EDF1F7] p-4">
                    <p className="font-medium text-[#2D4A7C]">Примеры работы стеммера:</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ['бумага', 'бумаг'],
                        ['бумаги', 'бумаг'],
                        ['бумагой', 'бумаг'],
                        ['офисная', 'офисн'],
                        ['офисные', 'офисн'],
                        ['принтеры', 'принтер'],
                        ['медицинское', 'медицинск'],
                        ['строительные', 'строительн'],
                        ['канцелярия', 'канцеляр'],
                      ].map(([word, stem]) => (
                        <div key={word} className="flex items-center gap-2 text-sm">
                          <span className="text-[#666666]">{word}</span>
                          <ArrowRight className="h-3 w-3 text-[#666666]" />
                          <span className="font-medium text-[#2D4A7C]">{russianStem(word)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#2D4A7C]/20 bg-white p-4">
                    <p className="text-sm text-[#666666]">
                      <strong>Как это работает:</strong> Когда вы ищете «бумаги», система находит 
                      все товары со словами «бумага», «бумагой», «бумажная» и т.д., потому что 
                      все эти слова приводятся к одной основе «бумаг».
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#C93535]" />
                    Исправление опечаток
                  </CardTitle>
                  <CardDescription>
                    Алгоритм Левенштейна находит ближайшее слово в словаре по минимальному 
                    количеству изменений (вставка, удаление, замена символа).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Input
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      placeholder="Введите запрос с опечатками..."
                      className="max-w-md"
                    />
                    <ArrowRight className="hidden h-5 w-5 text-[#666666] sm:block" />
                    <div className="flex items-center gap-2">
                      {typoResult.wasChanged ? (
                        <>
                          <Badge variant="outline" className="border-[#C93535] text-[#C93535]">
                            <s>{typoResult.original}</s>
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-[#666666]" />
                          <Badge className="bg-[#C93535] px-4 py-2">
                            {typoResult.corrected}
                          </Badge>
                        </>
                      ) : (
                        <Badge className="bg-green-600 px-4 py-2">
                          Опечаток не найдено
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#FFF3CD] p-4">
                    <p className="font-medium text-[#856404]">Примеры исправления:</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[
                        ['бумга', 'бумага'],
                        ['принтре', 'принтер'],
                        ['монитро', 'монитор'],
                        ['шпиц', 'шприц'],
                        ['цимент', 'цемент'],
                        ['кирпичь', 'кирпич'],
                      ].map(([typo, correct]) => {
                        const result = correctTypos(typo)
                        return (
                          <div key={typo} className="flex items-center gap-2 text-sm">
                            <span className="text-[#856404] line-through">{typo}</span>
                            <ArrowRight className="h-3 w-3 text-[#856404]" />
                            <span className="font-medium text-[#856404]">{result.corrected}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="synonyms">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-[#2D4A7C]" />
                    Расширение синонимами
                  </CardTitle>
                  <CardDescription>
                    Система автоматически расширяет запрос синонимами для более полной выдачи.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Input
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      placeholder="Введите запрос..."
                      className="max-w-md"
                    />
                    
                    {synonymResult.synonymsUsed.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-[#666666]">Добавлены синонимы:</span>
                        {synonymResult.synonymsUsed.map((syn, i) => (
                          <Badge key={i} className="bg-[#D1ECF1] text-[#0C5460]">
                            {syn}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-[#D1ECF1] p-4">
                    <p className="font-medium text-[#0C5460]">Словарь синонимов:</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        ['компьютер', ['пк', 'эвм', 'системный блок']],
                        ['принтер', ['мфу', 'печатающее устройство']],
                        ['бумага', ['бумага офисная', 'листы']],
                        ['стол', ['столы', 'рабочее место']],
                      ].map(([term, syns]) => (
                        <div key={term as string} className="text-sm">
                          <span className="font-medium text-[#0C5460]">{term as string}:</span>
                          <span className="ml-2 text-[#0C5460]">{(syns as string[]).join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personalization">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-[#2D4A7C]" />
                      Динамическая персонализация
                    </CardTitle>
                    <CardDescription>
                      Система учитывает ваши действия в реальном времени для адаптации выдачи.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Interaction stats */}
                    <div className="grid gap-4 sm:grid-cols-5">
                      <div className="rounded-lg bg-[#EDF1F7] p-4 text-center">
                        <Eye className="mx-auto h-5 w-5 text-[#2D4A7C]" />
                        <div className="mt-2 text-2xl font-bold text-[#2D4A7C]">{interactionStats.views}</div>
                        <div className="text-xs text-[#666666]">Просмотров</div>
                      </div>
                      <div className="rounded-lg bg-[#EDF1F7] p-4 text-center">
                        <Search className="mx-auto h-5 w-5 text-[#2D4A7C]" />
                        <div className="mt-2 text-2xl font-bold text-[#2D4A7C]">{interactionStats.clicks}</div>
                        <div className="text-xs text-[#666666]">Переходов</div>
                      </div>
                      <div className="rounded-lg bg-[#EDF1F7] p-4 text-center">
                        <ShoppingCart className="mx-auto h-5 w-5 text-[#2D4A7C]" />
                        <div className="mt-2 text-2xl font-bold text-[#2D4A7C]">{interactionStats.purchases}</div>
                        <div className="text-xs text-[#666666]">Покупок</div>
                      </div>
                      <div className="rounded-lg bg-green-100 p-4 text-center">
                        <ThumbsUp className="mx-auto h-5 w-5 text-green-600" />
                        <div className="mt-2 text-2xl font-bold text-green-600">{interactionStats.positive}</div>
                        <div className="text-xs text-[#666666]">Положит.</div>
                      </div>
                      <div className="rounded-lg bg-red-100 p-4 text-center">
                        <ThumbsDown className="mx-auto h-5 w-5 text-red-600" />
                        <div className="mt-2 text-2xl font-bold text-red-600">{interactionStats.negative}</div>
                        <div className="text-xs text-[#666666]">Отрицат.</div>
                      </div>
                    </div>

                    {/* Simulate interactions */}
                    <div className="rounded-lg border border-[#2D4A7C]/20 p-4">
                      <p className="mb-3 font-medium text-[#1a1a1a]">Симулировать взаимодействие:</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => simulateInteraction('view')}>
                          <Eye className="mr-1 h-4 w-4" /> Просмотр (+1)
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => simulateInteraction('click')}>
                          <Search className="mr-1 h-4 w-4" /> Переход (+3)
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => simulateInteraction('purchase')}>
                          <ShoppingCart className="mr-1 h-4 w-4" /> Покупка (+10)
                        </Button>
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => simulateInteraction('positive')}>
                          <ThumbsUp className="mr-1 h-4 w-4" /> Полезно (+7)
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => simulateInteraction('negative')}>
                          <ThumbsDown className="mr-1 h-4 w-4" /> Неполезно (-5)
                        </Button>
                      </div>
                    </div>

                    {/* Search demo */}
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Поиск для демонстрации персонализации..."
                          className="flex-1"
                        />
                        <Button onClick={() => setSearchQuery(searchQuery)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Обновить
                        </Button>
                      </div>

                      {searchResult && searchResult.results.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm text-[#666666]">
                            Топ-5 результатов с учётом персонализации:
                          </p>
                          {searchResult.results.slice(0, 5).map((item, idx) => (
                            <div 
                              key={item.id}
                              className="flex items-center justify-between rounded-lg border border-[#e0e0e0] bg-white p-3"
                            >
                              <div className="flex items-center gap-3">
                                <Badge className="bg-[#2D4A7C]">#{idx + 1}</Badge>
                                <div>
                                  <p className="font-medium text-[#1a1a1a]">{item.name}</p>
                                  <p className="text-xs text-[#666666]">{item.steCode}</p>
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div className="text-[#666666]">
                                  Релевантность: <span className="font-medium">{item.relevanceScore.toFixed(1)}</span>
                                </div>
                                <div className="text-[#2D4A7C]">
                                  Персонал.: <span className="font-bold">{item.personalizedScore.toFixed(1)}</span>
                                </div>
                                {item.personalizationFactors.explanation.length > 0 && (
                                  <div className="mt-1 text-xs text-green-600">
                                    {item.personalizationFactors.explanation[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
