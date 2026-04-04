import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/about" className="text-[#2D4A7C] underline hover:text-[#1a3a5c]">
              О сервисе
            </Link>
            <Link href="/#how-it-works" className="text-[#2D4A7C] underline hover:text-[#1a3a5c]">
              Как это работает
            </Link>
            <Link href="/support" className="text-[#2D4A7C] underline hover:text-[#1a3a5c]">
              Центр поддержки
            </Link>
            <a 
              href="https://zakupki.mos.ru" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#2D4A7C] underline hover:text-[#1a3a5c]"
            >
              Портал поставщиков Москвы
            </a>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/accessibility" className="text-[#2D4A7C] underline hover:text-[#1a3a5c]">
              Версия для слабовидящих
            </Link>
            <Link href="/developers" className="text-[#2D4A7C] underline hover:text-[#1a3a5c]">
              Доступ для разработчиков
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-[#C93535] p-1">
              <svg viewBox="0 0 40 40" className="h-full w-full text-white">
                <rect x="5" y="8" width="30" height="24" fill="currentColor" rx="2" />
                <rect x="10" y="12" width="8" height="16" fill="#C93535" />
                <rect x="22" y="12" width="8" height="16" fill="#C93535" />
              </svg>
            </div>
            <div className="text-xs font-medium leading-tight">
              <div className="font-bold text-[#C93535]">ДЕПАРТАМЕНТ</div>
              <div>ГОРОДА МОСКВЫ</div>
              <div className="text-muted-foreground">ПО КОНКУРЕНТНОЙ</div>
              <div className="text-muted-foreground">ПОЛИТИКЕ</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-[#2D4A7C] p-1">
              <svg viewBox="0 0 40 40" className="h-full w-full text-white">
                <rect x="5" y="5" width="30" height="30" fill="currentColor" rx="4" />
                <circle cx="20" cy="20" r="8" fill="#2D4A7C" />
                <rect x="15" y="15" width="10" height="10" fill="white" rx="2" />
              </svg>
            </div>
            <div className="text-xs font-medium leading-tight">
              <div className="font-bold text-[#2D4A7C]">ДЕПАРТАМЕНТ</div>
              <div className="font-bold text-[#C93535]">ИНФОРМАЦИОННЫХ</div>
              <div className="font-bold text-[#C93535]">ТЕХНОЛОГИЙ</div>
              <div>ГОРОДА МОСКВЫ</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link 
            href="/agreement" 
            className="text-sm text-[#2D4A7C] underline hover:text-[#1a3a5c]"
          >
            Соглашение о пользовании информационными системами города Москвы
          </Link>
        </div>
      </div>

      <div className="bg-[#2D4A7C] py-4 text-center text-sm text-white">
        © МосЗапрос. 2026
      </div>
    </footer>
  )
}
