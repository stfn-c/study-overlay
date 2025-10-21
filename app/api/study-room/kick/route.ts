import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, participantId } = body;

    if (!roomId || !participantId) {
      return NextResponse.json({ error: 'Room ID and participant ID are required' }, { status: 400 });
    }

    // Democratic removal - anyone can kick anyone
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('id', participantId)
      .eq('room_id', roomId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove participant:', error);
    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 });
  }
}
