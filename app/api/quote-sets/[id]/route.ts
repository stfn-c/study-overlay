import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name, description } = await request.json()

    const { data: updatedQuoteSet, error } = await supabase
      .from('quote_sets')
      .update({
        name,
        description,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(updatedQuoteSet)
  } catch (error) {
    console.error('Failed to update quote set:', error)
    return NextResponse.json(
      { error: 'Failed to update quote set' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // First delete all quotes in the set
    await supabase
      .from('quotes')
      .delete()
      .eq('quote_set_id', id)

    // Then delete the quote set
    const { error } = await supabase
      .from('quote_sets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete quote set:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote set' },
      { status: 500 }
    )
  }
}
