"use client"

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/lib/store'
import { useDatabaseHealth, useStats } from '@/hooks/use-database'
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Server,
  HardDrive,
  Users,
  FileText,
  TrendingUp
} from 'lucide-react'

export default function DatabaseSettingsPage() {
  const { usePostgres, setUsePostgres } = useAuthStore()
  const { isConnected, database, timestamp, isLoading: healthLoading, isError } = useDatabaseHealth()
  const { stats, isLoading: statsLoading } = useStats()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetch('/api/health')
    } catch (error) {
      console.log('[v0] Health check failed:', error)
    }
    setIsRefreshing(false)
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#2D4A7C] mb-2">
            Настройки базы данных
          </h1>
          <p className="text-muted-foreground mb-8">
            Управление подключением к PostgreSQL и просмотр статистики
          </p>

          <div className="grid gap-6">
            {/* Connection Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-[#2D4A7C]" />
                    <div>
                      <CardTitle>Статус подключения</CardTitle>
                      <CardDescription>PostgreSQL база данных</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={isConnected ? "default" : "destructive"}
                    className={isConnected ? "bg-green-600" : ""}
                  >
                    {healthLoading ? 'Проверка...' : isConnected ? 'Подключено' : 'Отключено'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">База данных</p>
                        <p className="text-sm text-muted-foreground">
                          {database || 'Не определено'}
                        </p>
                      </div>
                    </div>
                    {isConnected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Использовать PostgreSQL</p>
                        <p className="text-sm text-muted-foreground">
                          {usePostgres 
                            ? 'Данные загружаются из PostgreSQL' 
                            : 'Используются демо-данные'
                          }
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={usePostgres}
                      onCheckedChange={setUsePostgres}
                    />
                  </div>

                  {timestamp && (
                    <p className="text-xs text-muted-foreground text-center">
                      Последняя проверка: {new Date(timestamp).toLocaleString('ru-RU')}
                    </p>
                  )}

                  <Button 
                    onClick={handleRefresh}
                    variant="outline"
                    className="w-full"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Проверить подключение
                  </Button>

                  {isError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        Не удалось подключиться к базе данных. Проверьте переменную окружения DATABASE_URL.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Database Statistics */}
            {isConnected && stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Статистика базы данных
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-700">
                        {stats.ste_count.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-600">СТЕ позиций</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <Database className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-700">
                        {stats.contract_count.toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600">Контрактов</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-700">
                        {stats.user_count.toLocaleString()}
                      </p>
                      <p className="text-sm text-purple-600">Пользователей</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg text-center">
                      <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-700">
                        {(stats.total_contract_value / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-sm text-orange-600">Сумма контрактов</p>
                    </div>
                  </div>

                  {stats.categories && stats.categories.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Категории товаров</h4>
                      <div className="flex flex-wrap gap-2">
                        {stats.categories.slice(0, 10).map((cat) => (
                          <Badge key={cat.category} variant="secondary">
                            {cat.category}: {cat.count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Connection Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Инструкция по подключению</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium mb-2">1. Создайте .env.local файл</h4>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`DATABASE_URL=postgresql://user:password@localhost:5432/contracts_db`}
                  </pre>
                </div>
                
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium mb-2">2. Инициализируйте базу данных</h4>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`psql -U postgres -d contracts_db -f scripts/init-db.sql`}
                  </pre>
                </div>

                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium mb-2">3. Перезапустите приложение</h4>
                  <p className="text-sm text-muted-foreground">
                    После добавления переменных окружения перезапустите dev-сервер для применения изменений.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
