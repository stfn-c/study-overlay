import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get all default quote sets and user's custom sets with their quotes
    const { data: quoteSets, error } = await supabase
      .from('quote_sets')
      .select(`
        id,
        name,
        description,
        user_id,
        is_default,
        created_at,
        quotes (
          id,
          text,
          author
        )
      `)
      .or(`is_default.eq.1,user_id.eq.${user?.id || 'null'}`)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(quoteSets || [])
  } catch (error) {
    console.error('Failed to fetch quote sets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote sets' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const { data: newQuoteSet, error } = await supabase
      .from('quote_sets')
      .insert({
        name,
        description,
        user_id: user.id,
        is_default: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(newQuoteSet)
  } catch (error) {
    console.error('Failed to create quote set:', error)
    return NextResponse.json(
      { error: 'Failed to create quote set' },
      { status: 500 }
    )
  }
}
