"use client"

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Code, Key, BookOpen, Terminal, Zap, Shield, Copy } from 'lucide-react'
import { toast } from 'sonner'

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/ste/search',
    description: 'Поиск СТЕ по запросу с персонализацией',
    params: ['query', 'category', 'limit', 'user_id']
  },
  {
    method: 'GET',
    path: '/api/v1/ste/{id}',
    description: 'Получить детали СТЕ по ID',
    params: ['id']
  },
  {
    method: 'POST',
    path: '/api/v1/interactions',
    description: 'Записать взаимодействие пользователя',
    params: ['user_id', 'ste_id', 'type', 'weight']
  },
  {
    method: 'GET',
    path: '/api/v1/recommendations',
    description: 'Получить персонализированные рекомендации',
    params: ['user_id', 'limit']
  }
]

const codeExample = `// Пример использования API
const response = await fetch(
  'https://api.moszapros.ru/v1/ste/search?query=бумага&limit=10',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data.results);`

export default function DevelopersPage() {
  const copyCode = () => {
    navigator.clipboard.writeText(codeExample)
    toast.success('Код скопирован в буфер обмена')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#f5f5f5] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Badge className="mb-2 bg-[#2D4A7C] text-white">API v1</Badge>
            <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              Доступ для разработчиков
            </h1>
            <p className="text-muted-foreground">
              Интегрируйте поиск СТЕ в ваши приложения
            </p>
          </div>

          {/* Quick Start */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-background">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1F7]">
                  <Key className="h-6 w-6 text-[#2D4A7C]" />
                </div>
                <h3 className="font-medium text-foreground">1. Получите ключ</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Зарегистрируйтесь и получите API ключ
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1F7]">
                  <BookOpen className="h-6 w-6 text-[#2D4A7C]" />
                </div>
                <h3 className="font-medium text-foreground">2. Изучите документацию</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ознакомьтесь с эндпоинтами API
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1F7]">
                  <Terminal className="h-6 w-6 text-[#2D4A7C]" />
                </div>
                <h3 className="font-medium text-foreground">3. Протестируйте</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Используйте песочницу для тестов
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1F7]">
                  <Zap className="h-6 w-6 text-[#2D4A7C]" />
                </div>
                <h3 className="font-medium text-foreground">4. Интегрируйте</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Добавьте в ваше приложение
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Endpoints */}
            <Card className="border-border bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Эндпоинты
                </CardTitle>
                <CardDescription>
                  Доступные методы API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={endpoint.method === 'GET' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                        }
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono text-[#2D4A7C]">{endpoint.path}</code>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{endpoint.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {endpoint.params.map((param) => (
                        <Badge key={param} variant="outline" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Code Example */}
            <Card className="border-border bg-background">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Пример кода
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={copyCode}>
                    <Copy className="mr-1 h-4 w-4" />
                    Копировать
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                  <code>{codeExample}</code>
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Rate Limits & Security */}
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <Card className="border-border bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Лимиты запросов
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-[#EDF1F7] p-4">
                    <div>
                      <p className="font-medium text-foreground">Бесплатный план</p>
                      <p className="text-sm text-muted-foreground">Для тестирования</p>
                    </div>
                    <Badge variant="secondary">100 запросов/день</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#EDF1F7] p-4">
                    <div>
                      <p className="font-medium text-foreground">Стандартный план</p>
                      <p className="text-sm text-muted-foreground">Для небольших проектов</p>
                    </div>
                    <Badge className="bg-[#2D4A7C] text-white">10,000 запросов/день</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-[#EDF1F7] p-4">
                    <div>
                      <p className="font-medium text-foreground">Корпоративный план</p>
                      <p className="text-sm text-muted-foreground">Без ограничений</p>
                    </div>
                    <Badge className="bg-[#C93535] text-white">Безлимит</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Безопасность
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg bg-[#EDF1F7] p-4">
                    <p className="font-medium text-foreground">HTTPS обязателен</p>
                    <p className="text-sm text-muted-foreground">
                      Все запросы должны использовать защищённое соединение
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#EDF1F7] p-4">
                    <p className="font-medium text-foreground">Bearer токен</p>
                    <p className="text-sm text-muted-foreground">
                      Аутентификация через заголовок Authorization
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#EDF1F7] p-4">
                    <p className="font-medium text-foreground">IP Whitelisting</p>
                    <p className="text-sm text-muted-foreground">
                      Ограничение доступа по IP-адресам (опционально)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <Card className="mt-8 border-border bg-[#2D4A7C] text-white">
            <CardContent className="flex flex-col items-center justify-between gap-4 p-8 md:flex-row">
              <div>
                <h3 className="text-xl font-bold">Готовы начать?</h3>
                <p className="text-white/80">
                  Получите API ключ и начните интеграцию прямо сейчас
                </p>
              </div>
              <Button className="bg-[#C93535] text-white hover:bg-[#B02E2E]">
                <Key className="mr-2 h-4 w-4" />
                Получить API ключ
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
