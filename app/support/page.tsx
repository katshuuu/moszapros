"use client"

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  MessageSquare, Phone, Mail, Clock, HelpCircle, 
  FileText, Video, Book, Send 
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

const faqItems = [
  {
    question: 'Как работает персонализированный поиск?',
    answer: 'Система анализирует ваши взаимодействия: клики, покупки, добавления в избранное. На основе этих данных формируется персональный профиль, который влияет на ранжирование результатов поиска.'
  },
  {
    question: 'Как исправляются опечатки?',
    answer: 'Мы используем алгоритм Левенштейна для определения похожих слов и автоматически предлагаем исправленный вариант запроса.'
  },
  {
    question: 'Что такое СТЕ?',
    answer: 'СТЕ (Стандартная Товарная Единица) — это унифицированный классификатор товаров и услуг, используемый в системе закупок города Москвы.'
  },
  {
    question: 'Как сбросить историю взаимодействий?',
    answer: 'Вы можете выйти из системы и войти заново, либо обратиться в службу поддержки для полного сброса данных профиля.'
  }
]

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Ваше обращение отправлено! Мы свяжемся с вами в ближайшее время.')
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#f5f5f5] py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
              Центр поддержки
            </h1>
            <p className="text-muted-foreground">
              Мы готовы помочь вам в любое время
            </p>
          </div>

          {/* Contact Options */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-background text-center">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1F7]">
                  <Phone className="h-6 w-6 text-[#2D4A7C]" />
                </div>
                <h3 className="font-medium text-foreground">Телефон</h3>
                <p className="mt-1 text-sm text-[#2D4A7C]">+7 (495) 123-45-67</p>
                <p className="text-xs text-muted-foreground">Пн-Пт, 9:00-18:00</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background text-center">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1F7]">
                  <Mail className="h-6 w-6 text-[#2D4A7C]" />
                </div>
                <h3 className="font-medium text-foreground">Email</h3>
                <p className="mt-1 text-sm text-[#2D4A7C]">support@moszapros.ru</p>
                <p className="text-xs text-muted-foreground">Ответ в течение 24 часов</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background text-center">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1F7]">
                  <MessageSquare className="h-6 w-6 text-[#2D4A7C]" />
                </div>
                <h3 className="font-medium text-foreground">Онлайн-чат</h3>
                <p className="mt-1 text-sm text-[#2D4A7C]">Лис Стёпа</p>
                <p className="text-xs text-muted-foreground">Круглосуточно</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-background text-center">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1F7]">
                  <Clock className="h-6 w-6 text-[#2D4A7C]" />
                </div>
                <h3 className="font-medium text-foreground">Время ответа</h3>
                <p className="mt-1 text-sm text-[#2D4A7C]">~15 минут</p>
                <p className="text-xs text-muted-foreground">В рабочее время</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* FAQ */}
            <Card className="border-border bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Частые вопросы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="rounded-lg bg-[#EDF1F7] p-4">
                    <h4 className="font-medium text-foreground">{item.question}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card className="border-border bg-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Написать нам
                </CardTitle>
                <CardDescription>
                  Опишите вашу проблему или предложение
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm text-foreground">
                      Ваше имя
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm text-foreground">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm text-foreground">
                      Сообщение
                    </label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#C93535] text-white hover:bg-[#B02E2E]"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Отправить
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resources */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-foreground">Полезные ресурсы</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border bg-background">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-[#EDF1F7] p-3">
                    <Book className="h-6 w-6 text-[#2D4A7C]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Документация</h3>
                    <p className="text-sm text-muted-foreground">Руководство пользователя</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-background">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-[#EDF1F7] p-3">
                    <Video className="h-6 w-6 text-[#2D4A7C]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Видеоуроки</h3>
                    <p className="text-sm text-muted-foreground">Обучающие материалы</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-background">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-[#EDF1F7] p-3">
                    <FileText className="h-6 w-6 text-[#2D4A7C]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">API Документация</h3>
                    <p className="text-sm text-muted-foreground">Для разработчиков</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
