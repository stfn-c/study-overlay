import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    // Get room details
    const { data: room, error: roomError } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (participantsError) throw participantsError;

    // Calculate active/away status based on last_ping_at
    const now = Date.now();
    const processedParticipants = (participants || []).map(p => {
      const lastPing = new Date(p.last_ping_at).getTime();
      const secondsSinceLastPing = (now - lastPing) / 1000;

      return {
        ...p,
        is_active: secondsSinceLastPing <= 30 ? 1 : 0,
      };
    });

    // Update participants that have gone away (>30 seconds since last ping)
    // This ensures the database stays in sync
    const participantsToMarkAway = processedParticipants
      .filter(p => p.is_active === 0)
      .map(p => p.id);

    if (participantsToMarkAway.length > 0) {
      await supabase
        .from('room_participants')
        .update({ is_active: 0 })
        .in('id', participantsToMarkAway);
    }

    return NextResponse.json({
      room,
      participants: processedParticipants,
    });
  } catch (error) {
    console.error('Failed to get room data:', error);
    return NextResponse.json({ error: 'Failed to get room data' }, { status: 500 });
  }
}
