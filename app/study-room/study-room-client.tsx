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

export default function StudyRoomClient({ widget, isEditable = false, user }: StudyRoomClientProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Initial fetch and setup intervals
  useEffect(() => {
    fetchRoomData();

    // Set up ping interval (every 15 seconds to stay well under 30s timeout)
    if (user) {
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
  }, [fetchRoomData, sendPing, user]);

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
  const awayParticipants = participants.filter(p => p.is_active === 0);

  // Style configurations
  const style = config.style || 'compact';
  const showAvatars = config.showAvatars !== false;
  const showStatus = config.showStatus !== false;
  const backgroundColor = config.backgroundColor || '#1a1a1a';
  const textColor = config.textColor || '#ffffff';
  const accentColor = config.accentColor || '#10b981';

  return (
    <div
      className="p-6 rounded-lg h-full"
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
        <div className="text-sm opacity-70" style={{ color: textColor }}>
          {activeParticipants.length} active • {participants.length} total
        </div>
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
                }`}
              >
                {showAvatars && (
                  <div className="relative">
                    {participant.avatar_url ? (
                      <img
                        src={participant.avatar_url}
                        alt={participant.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
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
      {awayParticipants.length > 0 && (
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
                }`}
              >
                {showAvatars && (
                  <div className="relative">
                    {participant.avatar_url ? (
                      <img
                        src={participant.avatar_url}
                        alt={participant.display_name}
                        className="w-10 h-10 rounded-full object-cover grayscale"
                      />
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
    </div>
  );
}
