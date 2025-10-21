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
    const { inviteCode, displayName, avatarUrl, customStatus } = body;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Find room by invite code
    const { data: room, error: roomError } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if user is already in the room
    const { data: existingParticipant } = await supabase
      .from('room_participants')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single();

    if (existingParticipant) {
      // User already in room, just update their ping
      const { error: updateError } = await supabase
        .from('room_participants')
        .update({
          last_ping_at: new Date().toISOString(),
          is_active: 1,
        })
        .eq('id', existingParticipant.id);

      if (updateError) throw updateError;

      return NextResponse.json({
        room,
        message: 'Rejoined room successfully'
      });
    }

    // Get user profile for defaults
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Add user as new participant
    const { error: insertError } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName || userProfile?.full_name || 'Anonymous',
        avatar_url: avatarUrl || userProfile?.avatar_url || null,
        custom_status: customStatus || null,
        is_active: 1,
        last_ping_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      room,
      message: 'Joined room successfully'
    });
  } catch (error) {
    console.error('Failed to join study room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
