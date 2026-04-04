"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

interface CartItem {
  id: string
  name: string
  category: string
  price: number
  quantity: number
  unit: string
}

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Загрузка корзины из localStorage (в реальном приложении - из API)
    const savedCart = localStorage.getItem('moszapros-cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
    setIsLoading(false)
  }, [isAuthenticated, router])

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    const updated = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    )
    setCartItems(updated)
    localStorage.setItem('moszapros-cart', JSON.stringify(updated))
  }

  const removeItem = (id: string) => {
    const updated = cartItems.filter(item => item.id !== id)
    setCartItems(updated)
    localStorage.setItem('moszapros-cart', JSON.stringify(updated))
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('moszapros-cart')
  }

  const totalSum = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
        <Header />
        <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-8">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#2D4A7C] border-t-transparent"></div>
            <p className="mt-4 text-[#666666]">Загрузка...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <Header />
      
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/search">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              К поиску
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Корзина</h1>
        </div>

        {cartItems.length === 0 ? (
          <Card className="border-[#e0e0e0] bg-white">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="mb-4 h-16 w-16 text-[#666666]" />
              <h2 className="mb-2 text-xl font-semibold text-[#1a1a1a]">Корзина пуста</h2>
              <p className="mb-6 text-center text-[#666666]">
                Добавьте товары из каталога для оформления заказа
              </p>
              <Link href="/search">
                <Button className="bg-[#C93535] text-white hover:bg-[#B02E2E]">
                  Перейти к поиску
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Список товаров */}
            <div className="lg:col-span-2">
              <Card className="border-[#e0e0e0] bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-[#e0e0e0]">
                  <CardTitle className="text-lg text-[#1a1a1a]">
                    Товары ({totalItems})
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearCart}
                    className="text-[#C93535] hover:text-[#B02E2E]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Очистить
                  </Button>
                </CardHeader>
                <CardContent className="divide-y divide-[#e0e0e0] p-0">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#EDF1F7]">
                        <Package className="h-8 w-8 text-[#2D4A7C]" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-[#1a1a1a]">{item.name}</h3>
                        <p className="text-sm text-[#666666]">{item.category}</p>
                        <p className="text-sm font-semibold text-[#2D4A7C]">
                          {item.price.toLocaleString('ru-RU')} ₽ / {item.unit}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="h-8 w-16 text-center"
                          min={1}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="w-28 text-right">
                        <p className="font-semibold text-[#1a1a1a]">
                          {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-[#C93535] hover:bg-[#C93535]/10 hover:text-[#C93535]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Итого */}
            <div>
              <Card className="sticky top-24 border-[#e0e0e0] bg-white">
                <CardHeader className="border-b border-[#e0e0e0]">
                  <CardTitle className="text-lg text-[#1a1a1a]">Итого</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666666]">Товаров:</span>
                    <span className="font-medium text-[#1a1a1a]">{totalItems} шт.</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666666]">Позиций:</span>
                    <span className="font-medium text-[#1a1a1a]">{cartItems.length}</span>
                  </div>
                  <div className="border-t border-[#e0e0e0] pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-[#1a1a1a]">Сумма:</span>
                      <span className="text-xl font-bold text-[#C93535]">
                        {totalSum.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                  <Button className="w-full bg-[#C93535] text-white hover:bg-[#B02E2E]">
                    Оформить заказ
                  </Button>
                  <p className="text-center text-xs text-[#666666]">
                    Нажимая кнопку, вы соглашаетесь с условиями использования сервиса
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
