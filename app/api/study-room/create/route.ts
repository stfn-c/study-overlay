import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Generate a unique 8-character invite code like "STUDY-XY7K"
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'STUDY-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, roomImageUrl } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    // Generate unique invite code with retry logic
    let inviteCode = generateInviteCode();
    let attempts = 0;
    let roomCreated = false;
    let roomData = null;

    while (!roomCreated && attempts < 10) {
      const { data, error } = await supabase
        .from('study_rooms')
        .insert({
          name: name.trim(),
          creator_id: user.id,
          invite_code: inviteCode,
          room_image_url: roomImageUrl || null,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a unique constraint violation
        if (error.code === '23505') {
          // Generate new code and retry
          inviteCode = generateInviteCode();
          attempts++;
          continue;
        }
        throw error;
      }

      roomData = data;
      roomCreated = true;
    }

    if (!roomCreated) {
      return NextResponse.json({ error: 'Failed to generate unique invite code' }, { status: 500 });
    }

    // Automatically add creator as participant
    const { data: { user: userData } } = await supabase.auth.getUser();
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    await supabase
      .from('room_participants')
      .insert({
        room_id: roomData.id,
        user_id: user.id,
        display_name: userProfile?.full_name || 'Anonymous',
        avatar_url: userProfile?.avatar_url || null,
        custom_status: null,
        is_active: 1,
        last_ping_at: new Date().toISOString(),
      });

    return NextResponse.json({
      room: roomData,
      message: 'Room created successfully'
    });
  } catch (error) {
    console.error('Failed to create study room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
