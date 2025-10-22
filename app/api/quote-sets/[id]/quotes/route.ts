import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: quoteSetId } = await params
    const { text, author } = await request.json()

    if (!text || !author) {
      return NextResponse.json(
        { error: 'Text and author are required' },
        { status: 400 }
      )
    }

    // Verify the quote set belongs to the user
    const { data: quoteSet } = await supabase
      .from('quote_sets')
      .select('id')
      .eq('id', quoteSetId)
      .eq('user_id', user.id)
      .single()

    if (!quoteSet) {
      return NextResponse.json(
        { error: 'Quote set not found or unauthorized' },
        { status: 404 }
      )
    }

    const { data: newQuote, error } = await supabase
      .from('quotes')
      .insert({
        quote_set_id: quoteSetId,
        text,
        author,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(newQuote)
  } catch (error) {
    console.error('Failed to create quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
