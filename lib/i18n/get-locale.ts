import { cookies, headers } from 'next/headers'
import { defaultLocale, type Locale, locales } from '@/i18n'

export async function getLocale(): Promise<Locale> {
  // Try to get locale from cookie first
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined

  if (localeCookie && locales.includes(localeCookie)) {
    return localeCookie
  }

  // Fall back to Accept-Language header
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')

  if (acceptLanguage) {
    // Parse the Accept-Language header
    const languages = acceptLanguage.split(',').map(lang => {
      const [locale] = lang.trim().split(';')
      return locale.toLowerCase()
    })

    // Try to find an exact match
    for (const lang of languages) {
      const match = locales.find(l => l.toLowerCase() === lang)
      if (match) return match
    }

    // Try to find a language match (e.g., 'en-US' -> 'en')
    for (const lang of languages) {
      const langCode = lang.split('-')[0]
      const match = locales.find(l => l.toLowerCase().startsWith(langCode))
      if (match) return match
    }
  }

  return defaultLocale
}
