import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emailService } from '@/lib/services/email'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    // Check if this is a new user and send welcome email
    if (session?.user) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single()

      const isNewUser = !existingUser

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

  // Redirect to home page after successful login
  return NextResponse.redirect(`${origin}/`)
}
