import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuoteManagement from './quote-management-client'

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <QuoteManagement user={user} />
}
