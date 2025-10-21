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
    const { roomId, customStatus, displayName, avatarUrl } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const updateData: any = {};

    if (customStatus !== undefined) {
      updateData.custom_status = customStatus;
    }
    if (displayName !== undefined) {
      updateData.display_name = displayName;
    }
    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl;
    }

    const { error } = await supabase
      .from('room_participants')
      .update(updateData)
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update participant status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
