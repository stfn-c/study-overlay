import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emailService } from '@/lib/services/email'
import { PostHog } from 'posthog-node'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get('next') ?? '/'

  // Initialize PostHog for server-side tracking
  const posthog = new PostHog(
    process.env.NEXT_PUBLIC_POSTHOG_KEY!,
    { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
  )

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }

    // Check if this is a new user and send welcome email
    if (session?.user) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single()

      const isNewUser = !existingUser

      // Identify user in PostHog
      posthog.identify({
        distinctId: session.user.id,
        properties: {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
        }
      })

      // Track sign in event
      posthog.capture({
        distinctId: session.user.id,
        event: isNewUser ? 'user_signed_up' : 'user_signed_in',
        properties: {
          provider: 'google',
          email: session.user.email,
        }
      })

      // Create user record if new
      if (isNewUser && session.user.email) {
        await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
          })

        // Send welcome email
        try {
          await emailService.sendWelcomeEmail(
            session.user.email,
            session.user.user_metadata?.name?.split(' ')[0] ||
            session.user.email.split('@')[0]
          )
        } catch (error) {
          console.error('Failed to send welcome email:', error)
          // Don't fail the auth flow if email fails
        }
      }
    }
  }

  // Flush PostHog events before redirecting
  await posthog.shutdown()

  // Redirect to home page after successful login
  return NextResponse.redirect(new URL(next, origin))
}
