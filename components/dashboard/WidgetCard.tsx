'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OverlayItem, overlayTag } from '@/lib/types/widget';
import { widgetsService } from '@/lib/services/widgets';
import { createClient } from '@/lib/supabase/client';

interface WidgetCardProps {
  widget: OverlayItem;
  onCopyLink: (link: string, id: string) => void;
  onDelete?: (id: string) => void;
  copiedLinkId: string | null;
}

export function WidgetCard({ widget, onCopyLink, onDelete, copiedLinkId }: WidgetCardProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [widgetState, setWidgetState] = useState({
    isPaused: false,
    isWorking: true,
    ...widget.state
  });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const supabase = createClient();

  // Poll for state updates every 5 seconds
  useEffect(() => {
    const fetchWidgetState = async () => {
      try {
        const { data, error } = await supabase
          .from('widgets')
          .select('state')
          .eq('id', widget.id)
          .single();

        if (error) throw error;

        if (data?.state) {
          setWidgetState(data.state);
        }
      } catch (error) {
        console.error('Failed to fetch widget state:', error);
      }
    };

    // Fetch immediately
    fetchWidgetState();

    // Then poll every 5 seconds
    const interval = setInterval(fetchWidgetState, 5000);

    return () => clearInterval(interval);
  }, [widget.id, supabase]);

  // Update current time for local time widgets
  useEffect(() => {
    if (widget.type !== 'local') return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [widget.type]);

  // Calculate current time for Pomodoro widgets based on last action
  useEffect(() => {
    if (widget.type !== 'pomodoro') return;

    const workTime = (widget.config?.workingTime || 25) * 60 * 1000;
    const breakTime = (widget.config?.restTime || 5) * 60 * 1000;

    const calculateTimeLeft = () => {
      const defaultTimeLeft = widgetState.isWorking ? workTime : breakTime;

      if (widgetState.isPaused) {
        return widgetState.lastActionTimeLeft ?? defaultTimeLeft;
      }

      const lastActionTime = widgetState.lastActionTime || Date.now();
      const lastActionTimeLeft = widgetState.lastActionTimeLeft ?? defaultTimeLeft;
      const elapsed = Date.now() - lastActionTime;
      return Math.max(0, lastActionTimeLeft - elapsed);
    };

    const updateTime = () => {
      setTimeLeft(calculateTimeLeft());
    };

    // Update immediately
    updateTime();

    // Then update every 100ms for smooth countdown
    const interval = setInterval(updateTime, 100);

    return () => clearInterval(interval);
  }, [widget.type, widget.config?.workingTime, widget.config?.restTime, widgetState.isPaused, widgetState.isWorking, widgetState.lastActionTime, widgetState.lastActionTimeLeft]);

  const togglePause = async () => {
    if (!widgetState || widget.type !== 'pomodoro') return;
    setIsUpdating(true);

    const newPausedState = !widgetState.isPaused;
    const now = Date.now();

    // Optimistic update
    setWidgetState(prev => ({
      ...prev,
      isPaused: newPausedState,
      lastActionTime: now,
      lastActionTimeLeft: timeLeft ?? undefined
    }));

    try {
      await widgetsService.updateWidgetState(widget.id, {
        ...widgetState,
        isPaused: newPausedState,
        lastActionTime: now,
        lastActionTimeLeft: timeLeft
      });
    } catch (error) {
      console.error('Failed to toggle pause:', error);
      // Revert on error
      setWidgetState(prev => ({ ...prev, isPaused: !newPausedState }));
    } finally {
      setIsUpdating(false);
    }
  };

  const adjustTime = async (minutes: number) => {
    if (!widgetState || widget.type !== 'pomodoro') return;

    const newTimeLeft = Math.max(0, (timeLeft || 0) + (minutes * 60 * 1000));
    const now = Date.now();

    // Optimistically update both timeLeft and widgetState
    setTimeLeft(newTimeLeft);
    setWidgetState(prev => ({
      ...prev,
      lastActionTime: now,
      lastActionTimeLeft: newTimeLeft
    }));

    try {
      await widgetsService.updateWidgetState(widget.id, {
        ...widgetState,
        lastActionTime: now,
        lastActionTimeLeft: newTimeLeft
      });
    } catch (error) {
      console.error('Failed to adjust time:', error);
    }
  };

  const skipStage = async () => {
    if (!widgetState || widget.type !== 'pomodoro') return;

    const nextIsWorking = !widgetState.isWorking;
    const workTime = (widget.config?.workingTime || 25) * 60 * 1000;
    const breakTime = (widget.config?.restTime || 5) * 60 * 1000;
    const nextTimeLeft = nextIsWorking ? workTime : breakTime;
    const now = Date.now();

    // If completing a work session, increment pomodoros completed
    const newPomodorosCompleted = widgetState.isWorking
      ? (widgetState.pomodorosCompleted || 0) + 1
      : (widgetState.pomodorosCompleted || 0);

    setWidgetState(prev => ({
      ...prev,
      isWorking: nextIsWorking,
      pomodorosCompleted: newPomodorosCompleted,
      lastActionTime: now,
      lastActionTimeLeft: nextTimeLeft
    }));
    setTimeLeft(nextTimeLeft);

    try {
      await widgetsService.updateWidgetState(widget.id, {
        ...widgetState,
        isWorking: nextIsWorking,
        lastActionTime: now,
        lastActionTimeLeft: nextTimeLeft,
        pomodorosCompleted: newPomodorosCompleted
      });
    } catch (error) {
      console.error('Failed to skip stage:', error);
    }
  };

  const formatTime = (ms: number | null) => {
    if (ms === null) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.li
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer"
      onClick={() => router.push(`/widget-edit?widgetId=${widget.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(`/widget-edit?widgetId=${widget.id}`);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <Card className="h-full border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-200">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-slate-900">
                {widget.name}
              </CardTitle>
              <Badge
                variant="default"
                className={cn(
                  'text-xs font-medium',
                  widget.type === 'pomodoro' && 'bg-purple-100 text-purple-700',
                  widget.type === 'spotify' && 'bg-green-100 text-green-700',
                  widget.type === 'local' && 'bg-blue-100 text-blue-700',
                  widget.type === 'quote' && 'bg-amber-100 text-amber-700'
                )}
              >
                {overlayTag(widget.type)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Live Preview Section */}
          {widget.type === 'pomodoro' && (
            <motion.div
              className="mb-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 space-y-3"
              animate={{ opacity: widgetState.isPaused ? 0.7 : 1 }}
            >
              {/* Progress */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    widgetState.isPaused
                      ? "bg-amber-500"
                      : widgetState.isWorking
                        ? "bg-purple-600 animate-pulse"
                        : "bg-blue-500 animate-pulse"
                  )} />
                  <span className="font-medium text-purple-700">
                    {widgetState.isPaused
                      ? 'Paused'
                      : widgetState.isWorking
                        ? 'Focus Time'
                        : 'Break Time'}
                  </span>
                </div>
                {((widgetState.pomodorosCompleted || 0) > 0 || widget.config?.pomodoroGoal) && (
                  <span className="font-semibold text-purple-800">
                    {widget.config?.pomodoroGoal
                      ? `${widgetState.pomodorosCompleted || 0} / ${widget.config.pomodoroGoal}`
                      : `${widgetState.pomodorosCompleted || 0}`
                    }
                  </span>
                )}
              </div>

              {/* Timer & Main Control */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-purple-900 font-mono">
                  {formatTime(timeLeft)}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePause();
                  }}
                  disabled={isUpdating}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-medium transition-all",
                    widgetState.isPaused
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-white text-purple-600 border border-purple-300 hover:bg-purple-50"
                  )}
                >
                  {isUpdating ? '...' : widgetState.isPaused ? 'Resume' : 'Pause'}
                </motion.button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-purple-200">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustTime(-5);
                  }}
                  className="flex-1 px-2 py-1.5 rounded text-xs font-medium bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 transition-all"
                >
                  -5
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustTime(5);
                  }}
                  className="flex-1 px-2 py-1.5 rounded text-xs font-medium bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 transition-all"
                >
                  +5
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    skipStage();
                  }}
                  className="flex-1 px-2 py-1.5 rounded text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all"
                >
                  Skip →
                </motion.button>
              </div>
            </motion.div>
          )}

          {widget.type === 'spotify' && widgetState.currentTrack && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
                  <span className="text-white text-lg">♫</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-900 truncate">
                    {widgetState.currentTrack.name || 'No track playing'}
                  </p>
                  <p className="text-xs text-green-700 truncate">
                    {widgetState.currentTrack.artist || 'Unknown artist'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {widget.type === 'local' && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 font-mono">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Quote Widget Preview */}
          {widget.type === 'quote' && (
            <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
              <div className="text-center">
                <p className="text-sm italic text-amber-900 mb-2 line-clamp-2">
                  "Daily motivational quote changes every day"
                </p>
                <p className="text-xs text-amber-700 font-semibold">— Quote of the Day</p>
              </div>
            </div>
          )}

          {/* Widget URL */}
          <div className="text-xs text-slate-500 mb-3">
            <span className="font-mono break-all line-clamp-1">{widget.link}</span>
          </div>
        </CardContent>

        <CardFooter className="p-0 pt-3 flex flex-wrap gap-2 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onCopyLink(widget.link, widget.id);
            }}
            className="text-xs h-8"
          >
            {copiedLinkId === widget.id ? '✓ Copied' : 'Copy link'}
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs h-8">
            <Link
              href={`/widget-edit?widgetId=${widget.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              Edit settings
            </Link>
          </Button>
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                if (confirm('Delete this widget?')) {
                  onDelete(widget.id);
                }
              }}
              className="ml-auto text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.li>
  );
}