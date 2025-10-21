import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split('; ').map(cookie => {
            const [name, value] = cookie.split('=')
            return { name, value }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = `${name}=${value}; path=/; ${options?.maxAge ? `max-age=${options.maxAge};` : ''} ${process.env.NODE_ENV === 'production' ? 'secure;' : ''} samesite=lax`
          })
        },
      },
    }
  )
}
