"use client"

import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { User, LogOut, Search, History, BarChart3, FileText } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#C93535]">
              <Search className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline">
              <span className="text-lg font-bold text-[#C93535]">МОС</span>
              <span className="text-lg font-bold text-[#2D4A7C]">Запрос</span>
            </div>
          </Link>
          <span className="hidden text-sm text-muted-foreground md:inline-block">
            | Портал поставщиков Москвы
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/search" className="hidden md:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Search className="h-4 w-4" />
                  Поиск СТЕ
                </Button>
              </Link>
              <Link href="/metrics" className="hidden md:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Метрики
                </Button>
              </Link>
              <Link href="/bpmn" className="hidden md:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  BPMN
                </Button>
              </Link>
              <Link href="/demo" className="hidden lg:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Search className="h-4 w-4" />
                  Демо
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{user?.fullName.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex cursor-pointer items-center gap-2">
                      <User className="h-4 w-4" />
                      Личный кабинет
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="flex cursor-pointer items-center gap-2">
                      <History className="h-4 w-4" />
                      История поисков
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[#C93535] text-white hover:bg-[#B02E2E]">
                  Зарегистрироваться
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
