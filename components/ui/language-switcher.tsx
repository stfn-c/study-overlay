'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

const languageNames: Record<Locale, { native: string; english: string; flag: string }> = {
  'en': { native: 'English', english: 'English', flag: '🇬🇧' },
  'es': { native: 'Español', english: 'Spanish', flag: '🇪🇸' },
  'pt-BR': { native: 'Português', english: 'Portuguese', flag: '🇧🇷' },
  'fr': { native: 'Français', english: 'French', flag: '🇫🇷' },
  'de': { native: 'Deutsch', english: 'German', flag: '🇩🇪' },
  'ru': { native: 'Русский', english: 'Russian', flag: '🇷🇺' },
  'ko': { native: '한국어', english: 'Korean', flag: '🇰🇷' },
  'ja': { native: '日本語', english: 'Japanese', flag: '🇯🇵' },
  'zh-CN': { native: '简体中文', english: 'Chinese (Simplified)', flag: '🇨🇳' },
  'zh-TW': { native: '繁體中文', english: 'Chinese (Traditional)', flag: '🇹🇼' },
  'hi': { native: 'हिन्दी', english: 'Hindi', flag: '🇮🇳' },
  'bn': { native: 'বাংলা', english: 'Bengali', flag: '🇧🇩' },
  'ta': { native: 'தமிழ்', english: 'Tamil', flag: '🇮🇳' },
  'te': { native: 'తెలుగు', english: 'Telugu', flag: '🇮🇳' },
}

interface LanguageSwitcherProps {
  currentLocale: Locale
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false)
      return
    }

    startTransition(() => {
      // Set locale cookie and refresh the page
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`

      // Refresh the current page to apply new locale
      router.refresh()
      setIsOpen(false)
    })
  }

  const currentLanguage = languageNames[currentLocale]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">{currentLanguage.native}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px] max-h-[400px] overflow-y-auto">
        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
          Select Language
        </div>
        {locales.map((locale) => {
          const lang = languageNames[locale]
          const isActive = locale === currentLocale

          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={`cursor-pointer ${isActive ? 'bg-slate-100' : ''}`}
            >
              <span className="mr-2">{lang.flag}</span>
              <div className="flex flex-col">
                <span className="font-medium">{lang.native}</span>
                <span className="text-xs text-slate-500">{lang.english}</span>
              </div>
              {isActive && (
                <span className="ml-auto text-emerald-600">✓</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
