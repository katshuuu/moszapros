"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(formData.email, formData.password)
      if (success) {
        toast.success('Вы успешно вошли в систему')
        router.push('/search')
      } else {
        toast.error('Неверный email или пароль')
      }
    } catch {
      toast.error('Произошла ошибка при входе')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-[#2D4A7C] py-6 text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Авторизация
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-foreground">
                  E-mail:
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="border-border"
                  placeholder="Введите email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm text-foreground">
                  Пароль:
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="border-border"
                  placeholder="Введите пароль"
                />
              </div>

              <div className="border-t border-border pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#C93535] py-6 text-lg font-medium text-white hover:bg-[#B02E2E]"
                >
                  {isLoading ? 'Вход...' : 'Войти'}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/register"
                  className="text-sm text-[#C93535] hover:underline"
                >
                  Нет аккаунта?
                </Link>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#C93535] hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>
            </form>

            <div className="mt-6 rounded-lg bg-[#EDF1F7] p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Демо-аккаунты:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><strong>office@demo.ru</strong> — офисные поставки</p>
                <p><strong>medical@demo.ru</strong> — медицинское оборудование</p>
                <p><strong>construction@demo.ru</strong> — строительные материалы</p>
                <p className="mt-2">Пароль для всех: <strong>demo123</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
