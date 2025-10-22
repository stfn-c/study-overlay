import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JoinRoomClient from './join-room-client'

export default async function JoinRoomPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Look up the room by invite code
  const { data: room, error } = await supabase
    .from('study_rooms')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Room Not Found</h1>
          <p className="text-slate-600 mb-6">
            The invite code <span className="font-mono font-semibold">{inviteCode}</span> is invalid or the room no longer exists.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  // If user is authenticated, find or create their study room widget and join
  if (user) {
    // Find user's study room widget
    const { data: widget } = await supabase
      .from('widgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'study-room')
      .single()

    // If they don't have a study room widget, redirect to home to create one
    if (!widget) {
      redirect(`/?joinRoom=${room.id}`)
    }

    // Check if user is already in this room
    const { data: existingParticipant } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single()

    // If not in room, add them
    if (!existingParticipant) {
      const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'

      await supabase
        .from('room_participants')
        .insert({
          room_id: room.id,
          user_id: user.id,
          display_name: displayName,
          avatar_url: '😀',
          custom_status: null,
        })

      // Update widget config with room info
      await supabase
        .from('widgets')
        .update({
          config: {
            ...widget.config,
            roomId: room.id,
            inviteCode: room.invite_code,
            userDisplayName: displayName,
            userAvatar: '😀',
          }
        })
        .eq('id', widget.id)
    }

    // Redirect to their study room widget
    redirect(`/study-room?id=${widget.id}`)
  }

  // If not authenticated, show join page with sign in options
  return <JoinRoomClient room={room} inviteCode={inviteCode} />
}
