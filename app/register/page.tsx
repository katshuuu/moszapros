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

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organization: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов')
      return
    }

    setIsLoading(true)

    try {
      const success = await register({
        fullName: formData.fullName,
        email: formData.email,
        organization: formData.organization,
        password: formData.password
      })
      
      if (success) {
        toast.success('Регистрация успешна! Добро пожаловать!')
        router.push('/search')
      } else {
        toast.error('Ошибка при регистрации')
      }
    } catch {
      toast.error('Произошла ошибка при регистрации')
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
              Регистрация
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm text-foreground">
                  ФИО:
                </label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="border-border"
                  placeholder="Иванов Иван Иванович"
                />
              </div>

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
                  placeholder="email@example.ru"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="organization" className="text-sm text-foreground">
                  Организация:
                </label>
                <Input
                  id="organization"
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  required
                  className="border-border"
                  placeholder='ООО "Название компании"'
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
                  placeholder="Минимум 6 символов"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm text-foreground">
                  Подтвердите пароль:
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  className="border-border"
                  placeholder="Повторите пароль"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#C93535] py-6 text-lg font-medium text-white hover:bg-[#B02E2E]"
                >
                  {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </Button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-sm text-[#C93535] hover:underline"
                >
                  Уже есть аккаунт? Войти
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
