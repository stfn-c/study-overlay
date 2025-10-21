import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Update participant's last ping time and set as active
    // Using atomic UPDATE to avoid race conditions
    const { error } = await supabase
      .from('room_participants')
      .update({
        last_ping_at: new Date().toISOString(),
        is_active: 1,
      })
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to ping room:', error);
    return NextResponse.json({ error: 'Failed to ping room' }, { status: 500 });
  }
}
