import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; quoteId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: quoteSetId, quoteId } = await params
    const { text, author } = await request.json()

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

    const { data: updatedQuote, error } = await supabase
      .from('quotes')
      .update({
        text,
        author,
      })
      .eq('id', quoteId)
      .eq('quote_set_id', quoteSetId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error('Failed to update quote:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; quoteId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: quoteSetId, quoteId } = await params

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

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('quote_set_id', quoteSetId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete quote:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}
