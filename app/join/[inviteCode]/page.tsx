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
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // If user is authenticated, redirect to study room
  if (user) {
    redirect(`/study-room/${room.id}`)
  }

  // If not authenticated, show join page with sign in options
  return <JoinRoomClient room={room} inviteCode={inviteCode} />
}
