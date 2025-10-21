'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '@/lib/db/schema';
import { User } from '@supabase/supabase-js';

interface Participant {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  custom_status: string | null;
  is_active: number;
  last_ping_at: string;
  joined_at: string;
}

interface Room {
  id: string;
  name: string;
  creator_id: string;
  invite_code: string;
  room_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface StudyRoomClientProps {
  widget: Widget;
  isEditable?: boolean;
  user: User | null;
}

const AVATAR_PRESETS = [
  '😀', '😎', '🤓', '🥳', '🤠', '🧑‍💻', '👨‍🎓', '👩‍🎓', '🦊', '🐱',
  '🐶', '🐼', '🦁', '🐸', '🦄', '🌟', '⚡', '🔥', '💎', '🎯'
];

export default function StudyRoomClient({ widget, isEditable = false, user }: StudyRoomClientProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [showStatusInput, setShowStatusInput] = useState(false);
  const [hasSetProfile, setHasSetProfile] = useState(false);

  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = widget.config as any;
  const roomId = config.roomId;

  // Fetch room data and participants
  const fetchRoomData = useCallback(async () => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/study-room/${roomId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch room data');
      }

      const data = await response.json();
      setRoom(data.room);
      setParticipants(data.participants || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError('Failed to load room');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Send ping to keep user active
  const sendPing = useCallback(async () => {
    if (!roomId || !user) return;

    try {
      await fetch('/api/study-room/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
    } catch (err) {
      console.error('Failed to ping room:', err);
    }
  }, [roomId, user]);

  // Update user profile info
  const updateProfile = useCallback(async () => {
    if (!roomId || !user || !displayName.trim()) return;

    try {
      const response = await fetch('/api/study-room/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          displayName: displayName.trim(),
          avatarUrl: avatarUrl || null,
          customStatus: showStatusInput ? customStatus.trim() : null,
        }),
      });

      if (response.ok) {
        setHasSetProfile(true);
        setShowProfileSetup(false);
        fetchRoomData();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  }, [roomId, user, displayName, avatarUrl, customStatus, showStatusInput, fetchRoomData]);

  // Check if user needs to set up profile on first load
  useEffect(() => {
    if (user && !hasSetProfile) {
      const myParticipant = participants.find(p => p.user_id === user.id);
      if (!myParticipant || myParticipant.display_name === 'Anonymous') {
        setShowProfileSetup(true);
      } else {
        setHasSetProfile(true);
      }
    }
  }, [participants, user, hasSetProfile]);

  // Initial fetch and setup intervals
  useEffect(() => {
    fetchRoomData();

    // Set up ping interval (every 15 seconds to stay well under 30s timeout)
    if (user && hasSetProfile) {
      pingIntervalRef.current = setInterval(sendPing, 15000);
    }

    // Set up fetch interval (every 5 seconds to show live updates)
    fetchIntervalRef.current = setInterval(fetchRoomData, 5000);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [fetchRoomData, sendPing, user, hasSetProfile]);

  // Profile setup modal
  if (showProfileSetup && user) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6" style={{ backgroundColor: config.backgroundColor || '#1a1a1a' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Join the Room!</h2>
          <p className="text-sm text-slate-600 mb-6">Set up your profile so others can see you studying</p>

          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                maxLength={30}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-2 block">Choose Avatar</label>
              <div className="grid grid-cols-10 gap-2">
                {AVATAR_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarUrl(emoji)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      avatarUrl === emoji
                        ? 'bg-emerald-100 ring-2 ring-emerald-500'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Toggle */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStatusInput}
                  onChange={(e) => setShowStatusInput(e.target.checked)}
                  className="rounded accent-emerald-600"
                />
                Add a custom status
              </label>
            </div>

            {/* Custom Status */}
            {showStatusInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="Studying Math 📐"
                  maxLength={50}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                />
              </motion.div>
            )}

            <button
              onClick={updateProfile}
              disabled={!displayName.trim()}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Join Room
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-gray-400 text-sm">Loading room...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-red-400 text-sm">{error || 'Room not found'}</div>
      </div>
    );
  }

  const activeParticipants = participants.filter(p => p.is_active === 1);

  // Filter away participants based on auto-hide settings
  let awayParticipants = participants.filter(p => p.is_active === 0);

  if (config.autoHideAwayUsers && config.showAwayUsers !== false) {
    const hideAfterMs = ((config.hideAfterHours || 0) * 60 * 60 * 1000) + ((config.hideAfterMinutes || 5) * 60 * 1000);
    const now = Date.now();

    awayParticipants = awayParticipants.filter(p => {
      const lastPing = new Date(p.last_ping_at).getTime();
      const timeSinceLastPing = now - lastPing;
      return timeSinceLastPing <= hideAfterMs;
    });
  }

  // Style configurations
  const style = config.style || 'compact';
  const showAvatars = config.showAvatars !== false;
  const showStatus = config.showStatus !== false;
  const showStats = config.showStats !== false;
  const backgroundColor = config.backgroundColor || '#1a1a1a';
  const textColor = config.textColor || '#ffffff';
  const accentColor = config.accentColor || '#10b981';

  return (
    <div
      className="p-6 rounded-lg h-full overflow-y-auto"
      style={{ backgroundColor }}
    >
      {/* Room Header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: textColor }}
        >
          {room.name}
        </h2>
        {showStats && (
          <div className="text-sm opacity-70" style={{ color: textColor }}>
            {activeParticipants.length} active • {participants.length} total
          </div>
        )}
      </div>

      {/* Active Participants */}
      {activeParticipants.length > 0 && (
        <div className="mb-6">
          <h3
            className="text-sm font-semibold mb-3 uppercase tracking-wider"
            style={{ color: accentColor }}
          >
            Studying Now
          </h3>
          <AnimatePresence mode="popLayout">
            {activeParticipants.map((participant) => (
              <motion.div
                key={participant.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center gap-3 mb-3 ${
                  style === 'spacious' ? 'p-3 rounded-lg bg-white/5' : ''
                } ${style === 'cards' ? 'p-4 rounded-xl bg-white/10 backdrop-blur-sm' : ''}`}
              >
                {showAvatars && (
                  <div className="relative">
                    {participant.avatar_url ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-white/10">
                        {participant.avatar_url}
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: accentColor }}
                      >
                        {participant.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Active indicator */}
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                      style={{ backgroundColor: accentColor, borderColor: backgroundColor }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium truncate"
                    style={{ color: textColor }}
                  >
                    {participant.display_name}
                  </div>
                  {showStatus && participant.custom_status && (
                    <div
                      className="text-sm truncate opacity-70"
                      style={{ color: textColor }}
                    >
                      {participant.custom_status}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Away Participants */}
      {awayParticipants.length > 0 && config.showAwayUsers !== false && (
        <div>
          <h3
            className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-50"
            style={{ color: textColor }}
          >
            Away
          </h3>
          <AnimatePresence mode="popLayout">
            {awayParticipants.map((participant) => (
              <motion.div
                key={participant.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center gap-3 mb-3 opacity-50 ${
                  style === 'spacious' ? 'p-3 rounded-lg bg-white/5' : ''
                } ${style === 'cards' ? 'p-4 rounded-xl bg-white/10 backdrop-blur-sm' : ''}`}
              >
                {showAvatars && (
                  <div className="relative">
                    {participant.avatar_url ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-white/10 grayscale">
                        {participant.avatar_url}
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-gray-600"
                      >
                        {participant.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Away indicator */}
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 rounded-full border-2"
                      style={{ borderColor: backgroundColor }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium truncate"
                    style={{ color: textColor }}
                  >
                    {participant.display_name}
                  </div>
                  {showStatus && participant.custom_status && (
                    <div
                      className="text-sm truncate opacity-70"
                      style={{ color: textColor }}
                    >
                      {participant.custom_status}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {participants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 opacity-50">
          <div className="text-4xl mb-3">👥</div>
          <div className="text-sm" style={{ color: textColor }}>
            No one here yet
          </div>
          <div className="text-xs mt-1" style={{ color: textColor }}>
            Share code: <span className="font-mono font-bold">{room.invite_code}</span>
          </div>
        </div>
      )}

      {/* Edit Profile Button (only for current user) */}
      {user && hasSetProfile && (
        <button
          onClick={() => setShowProfileSetup(true)}
          className="mt-6 w-full py-2 px-4 rounded-lg text-sm opacity-30 hover:opacity-100 transition-opacity"
          style={{ backgroundColor: `${accentColor}20`, color: textColor }}
        >
          Edit My Profile
        </button>
      )}
    </div>
  );
}
