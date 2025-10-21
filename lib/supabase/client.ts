import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Guard against server-side rendering
  if (typeof document === 'undefined') {
    throw new Error('createClient() from @/lib/supabase/client can only be used in Client Components. Use @/lib/supabase/server instead.')
  }

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
