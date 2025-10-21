'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { widgetsService } from '@/lib/services/widgets';
import { createClient } from '@/lib/supabase/client';
import { OverlayItem } from '@/lib/types/widget';
import posthog from '@/instrumentation-client';

interface WidgetEditClientProps {
  widget: any;
  user: any;
  host: string;
}

export default function WidgetEditClient({ widget, user, host }: WidgetEditClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [config, setConfig] = useState(widget.config);
  const [name, setName] = useState(widget.name);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [widgetState, setWidgetState] = useState(widget.state || { isPaused: false, isWorking: true });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isUpdatingPause, setIsUpdatingPause] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const supabase = createClient();

  // Load Google Fonts for the font picker
  useEffect(() => {
    const fonts = [
      'Inter:wght@400;600;700',
      'Poppins:wght@400;600;700;900',
      'Space+Grotesk:wght@300;400;500;600',
      'Outfit:wght@400;600;700;800;900',
      'Roboto:wght@400;500;700',
      'Montserrat:wght@400;600;700',
      'Playfair+Display:wght@400;600;700',
      'Raleway:wght@400;600;700'
    ];

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f}`).join('&')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Build preview URL with current config for instant updates
  const getPreviewUrl = () => {
    const baseUrl = `${host}/widget?widgetId=${widget.id}`;

    // For Spotify, add style params for instant preview
    if (widget.type === 'spotify' && config.spotifyStyle) {
      const params = new URLSearchParams({
        preview: 'true',
        style: config.spotifyStyle,
      });

      // Add style settings
      if (config.styleSettings) {
        params.append('settings', JSON.stringify(config.styleSettings));
      }

      return `${baseUrl}&${params.toString()}`;
    }

    return baseUrl;
  };

  const widgetUrl = getPreviewUrl();

  const formatTime = (ms: number | null) => {
    if (ms === null) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePause = async () => {
    if (!widgetState || widget.type !== 'pomodoro') return;
    setIsUpdatingPause(true);

    const newPausedState = !widgetState.isPaused;
    const now = Date.now();

    // Optimistic update
    setWidgetState((prev: any) => ({
      ...prev,
      isPaused: newPausedState,
      lastActionTime: now,
      lastActionTimeLeft: timeLeft
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
      setWidgetState((prev: any) => ({ ...prev, isPaused: !newPausedState }));
    } finally {
      setIsUpdatingPause(false);
    }
  };

  const adjustTime = async (minutes: number) => {
    if (!widgetState || widget.type !== 'pomodoro') return;

    const newTimeLeft = Math.max(0, (timeLeft || 0) + (minutes * 60 * 1000));
    const now = Date.now();

    // Optimistically update both timeLeft and widgetState
    setTimeLeft(newTimeLeft);
    setWidgetState((prev: any) => ({
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
    const workTime = (config.workingTime || 25) * 60 * 1000;
    const breakTime = (config.restTime || 5) * 60 * 1000;
    const nextTimeLeft = nextIsWorking ? workTime : breakTime;
    const now = Date.now();

    // If completing a work session, increment pomodoros completed
    const newPomodorosCompleted = widgetState.isWorking
      ? (widgetState.pomodorosCompleted || 0) + 1
      : (widgetState.pomodorosCompleted || 0);

    setWidgetState((prev: NonNullable<OverlayItem['state']>) => ({
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

  const adjustPomodoroCount = async (adjustment: number) => {
    if (!widgetState || widget.type !== 'pomodoro') return;

    const newCount = Math.max(0, (widgetState.pomodorosCompleted || 0) + adjustment);

    // Optimistically update
    setWidgetState((prev: NonNullable<OverlayItem['state']>) => ({
      ...prev,
      pomodorosCompleted: newCount
    }));

    try {
      await widgetsService.updateWidgetState(widget.id, {
        ...widgetState,
        pomodorosCompleted: newCount
      });
    } catch (error) {
      console.error('Failed to adjust pomodoro count:', error);
      // Revert on error
      setWidgetState((prev: NonNullable<OverlayItem['state']>) => ({ ...prev, pomodorosCompleted: (widgetState.pomodorosCompleted || 0) }));
    }
  };

  const autoSave = async () => {
    setSaveStatus('saving');
    try {
      await widgetsService.updateWidget(widget.id, {
        name,
        config,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);

      // Track widget update
      posthog.capture('widget_updated', {
        widget_id: widget.id,
        widget_type: widget.type,
        widget_name: name,
      });
    } catch (error) {
      console.error('Failed to auto-save widget:', error);
      setSaveStatus('idle');
    }
  };

  // Auto-save with debounce when config or name changes
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, name]);

  const copyUrl = () => {
    navigator.clipboard.writeText(widgetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // Smoothly refresh preview when config changes with loading animation
  useEffect(() => {
    setIsPreviewLoading(true);
    const timer = setTimeout(() => {
      setPreviewKey(prev => prev + 1);
      // Hide loading after transition completes
      setTimeout(() => setIsPreviewLoading(false), 200);
    }, 300);
    return () => clearTimeout(timer);
  }, [config]);

  // Calculate current time for Pomodoro widgets based on last action
  useEffect(() => {
    if (widget.type !== 'pomodoro') return;

    const workTime = (config.workingTime || 25) * 60 * 1000;
    const breakTime = (config.restTime || 5) * 60 * 1000;

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
  }, [widget.type, config.workingTime, config.restTime, widgetState.isPaused, widgetState.isWorking, widgetState.lastActionTime, widgetState.lastActionTimeLeft]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-slate-200/50 backdrop-blur-xl bg-white/70"
      >
        <div className="max-w-[1800px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="group flex items-center gap-2">
                <motion.div
                  whileHover={{ x: -3 }}
                  className="text-slate-400 group-hover:text-slate-600 transition-colors"
                >
                  ←
                </motion.div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                  Back to Dashboard
                </span>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-lg font-semibold text-slate-900">
                {name}
              </h1>
              {widget.type === 'pomodoro' && widgetState.isPaused !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-medium"
                >
                  <div className={`h-2 w-2 rounded-full ${widgetState.isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-slate-700">
                    {widgetState.isPaused ? 'Paused' : 'Running'}
                  </span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                {saveStatus === 'saving' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-xs font-medium"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-blue-700">Saving...</span>
                  </motion.div>
                )}
                {saveStatus === 'saved' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-xs font-medium"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700">Saved</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="text-xs text-slate-500">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-[1800px] mx-auto px-8 py-8 grid grid-cols-[450px_1fr] gap-8 h-[calc(100vh-80px)]">
        {/* Left Panel - Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-6 h-full overflow-y-auto"
        >
          {/* Pomodoro Control Panel */}
          {widget.type === 'pomodoro' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 shadow-lg space-y-4"
            >
              {/* Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${
                    widgetState.isPaused
                      ? 'bg-amber-400'
                      : 'bg-emerald-400 animate-pulse'
                  }`} />
                  <span className="text-sm font-semibold text-white/90">
                    {widgetState.isPaused ? 'Paused' : widgetState.isWorking ? 'Focus Time' : 'Break Time'}
                  </span>
                </div>
                {(widgetState.pomodorosCompleted > 0 || config.pomodoroGoal) && (
                  <div className="text-sm font-semibold text-white/90">
                    {config.pomodoroGoal
                      ? `${widgetState.pomodorosCompleted || 0} / ${config.pomodoroGoal} pomodoros`
                      : `${widgetState.pomodorosCompleted || 0} pomodoros`
                    }
                  </div>
                )}
              </div>

              {/* Timer & Main Control */}
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <div className="text-4xl font-bold text-white font-mono tracking-tight">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-xs text-purple-100">
                    {widgetState.isWorking
                      ? `${config.workingTime || 25} min session`
                      : `${config.restTime || 5} min break`}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePause}
                  disabled={isUpdatingPause}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                    widgetState.isPaused
                      ? 'bg-white text-purple-600 hover:bg-purple-50'
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                  }`}
                >
                  {isUpdatingPause ? '...' : widgetState.isPaused ? 'Resume' : 'Pause'}
                </motion.button>
              </div>

              {/* Session Counter Adjustment */}
              {(widgetState.pomodorosCompleted > 0 || config.pomodoroGoal) && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <span className="text-xs text-purple-100 flex-1">Sessions</span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => adjustPomodoroCount(-1)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
                  >
                    -1
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => adjustPomodoroCount(1)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
                  >
                    +1
                  </motion.button>
                </div>
              )}

              {/* Time Adjustment & Skip Controls */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => adjustTime(-10)}
                    className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
                  >
                    -10
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => adjustTime(-5)}
                    className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
                  >
                    -5
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => adjustTime(-1)}
                    className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
                  >
                    -1
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => adjustTime(1)}
                    className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
                  >
                    +1
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => adjustTime(5)}
                    className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
                  >
                    +5
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => adjustTime(10)}
                    className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
                  >
                    +10
                  </motion.button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={skipStage}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all"
                >
                  Skip Stage →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* OBS Link */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                OBS Browser Source
              </h3>
              <button
                onClick={() => setShowHelpModal(true)}
                className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2"
              >
                Having issues?
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={widgetUrl}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-mono text-slate-600"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyUrl}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </motion.button>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p>• Width: 1920px</p>
                <p>• Height: 1080px</p>
                <p>• Refresh when scene becomes active: Yes</p>
              </div>
              <p className="text-xs text-slate-600 pt-2">
                Don't know how to use this? <button onClick={() => setShowHelpModal(true)} className="font-semibold text-slate-900 hover:underline">Click here for step-by-step instructions</button>
              </p>
            </div>
          </div>

          {/* Widget Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Widget Settings
            </h2>

            {/* Widget Name */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-medium text-slate-600">
                Widget Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                placeholder="My Widget"
              />
            </div>

            {/* Type-specific Settings */}
            {widget.type === 'pomodoro' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">
                    Focus Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={config.workingTime || '25'}
                      onChange={(e) => setConfig({ ...config, workingTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-16 text-sm font-medium text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      minutes
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Standard Pomodoro is 25 minutes
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">
                    Break Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={config.restTime || '5'}
                      onChange={(e) => setConfig({ ...config, restTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-16 text-sm font-medium text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      minutes
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Short breaks help maintain focus
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">
                    Daily Goal (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={config.pomodoroGoal || ''}
                      onChange={(e) => setConfig({ ...config, pomodoroGoal: e.target.value })}
                      placeholder="No limit"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-20 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      pomodoros
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Leave empty to count infinitely, or set a goal for a celebration
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-slate-600">
                        Sound Notifications
                      </label>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Play a ding when sessions complete
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, enableSound: !config.enableSound })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.enableSound ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.enableSound ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Visual Style Selector */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <label className="text-xs font-medium text-slate-600">
                    Visual Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'minimal', label: 'Minimal', icon: '⚪', desc: 'Clean & simple' },
                      { value: 'gradient', label: 'Gradient', icon: '🌈', desc: 'Colorful flow' },
                      { value: 'ambient', label: 'Ambient', icon: '✨', desc: 'Soft glow' },
                      { value: 'focus', label: 'Focus', icon: '🎯', desc: 'High contrast' },
                    ].map((styleOption) => (
                      <motion.button
                        key={styleOption.value}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setConfig({ ...config, pomodoroStyle: styleOption.value })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          (config.pomodoroStyle || 'minimal') === styleOption.value
                            ? 'border-purple-600 bg-purple-600 text-white shadow-lg'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{styleOption.icon}</span>
                          <span className="text-sm font-semibold">{styleOption.label}</span>
                        </div>
                        <p className={`text-xs ${
                          (config.pomodoroStyle || 'minimal') === styleOption.value
                            ? 'text-white/70'
                            : 'text-slate-500'
                        }`}>
                          {styleOption.desc}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Universal Settings for all Pomodoro styles */}
                {widget.type === 'pomodoro' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Layout & Display</h3>
                      <button
                        type="button"
                        onClick={() => setConfig({
                          ...config,
                          pomodoroStyleSettings: {}
                        })}
                        className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
                      >
                        Reset to defaults
                      </button>
                    </div>

                    {/* Time Format Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">Timer Format</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'colon', label: '0:53', desc: 'Default' },
                          { value: 'seconds', label: '53s', desc: 'Seconds' },
                          { value: 'units', label: '0m 53s', desc: 'With units' },
                        ].map((format) => (
                          <motion.button
                            key={format.value}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, timeFormat: format.value }
                            })}
                            className={`p-2 rounded-lg border-2 text-center transition-all ${
                              (config.pomodoroStyleSettings?.timeFormat || 'colon') === format.value
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-sm font-mono font-semibold">{format.label}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{format.desc}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Timer Font Selection with Visual Preview */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">Timer Font</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'Inter', 'Poppins', 'Space Grotesk', 'Outfit',
                          'Roboto', 'Montserrat', 'Playfair Display', 'Raleway'
                        ].map((fontName) => (
                          <motion.button
                            key={fontName}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, font: fontName }
                            })}
                            className={`p-2 rounded-lg border-2 text-left transition-all ${
                              (config.pomodoroStyleSettings?.font || (config.pomodoroStyle === 'minimal' ? 'Inter' : config.pomodoroStyle === 'gradient' ? 'Poppins' : config.pomodoroStyle === 'ambient' ? 'Space Grotesk' : 'Outfit')) === fontName
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                            style={{ fontFamily: fontName }}
                          >
                            <div className="text-xs font-semibold truncate">{fontName}</div>
                            <div className="text-lg font-bold">12:34</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Sub Text Font Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">Sub Text Font</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'Inter', 'Poppins', 'Space Grotesk', 'Outfit',
                          'Roboto', 'Montserrat', 'Playfair Display', 'Raleway'
                        ].map((fontName) => (
                          <motion.button
                            key={fontName}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, subFont: fontName }
                            })}
                            className={`p-2 rounded-lg border-2 text-left transition-all ${
                              (config.pomodoroStyleSettings?.subFont || config.pomodoroStyleSettings?.font || (config.pomodoroStyle === 'minimal' ? 'Inter' : config.pomodoroStyle === 'gradient' ? 'Poppins' : config.pomodoroStyle === 'ambient' ? 'Space Grotesk' : 'Outfit')) === fontName
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                            style={{ fontFamily: fontName }}
                          >
                            <div className="text-xs font-semibold truncate">{fontName}</div>
                            <div className="text-sm">Focus Time</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Timer Size */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Timer Size</span>
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.timerSize || 120}px</span>
                      </label>
                      <input
                        type="range"
                        min="60"
                        max="300"
                        value={config.pomodoroStyleSettings?.timerSize || 120}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, timerSize: parseInt(e.target.value) }
                        })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    {/* Vertical Position (Y) */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Vertical Position</span>
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.positionY || 50}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={config.pomodoroStyleSettings?.positionY || 50}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, positionY: parseInt(e.target.value) }
                        })}
                        className="w-full accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Top</span>
                        <span>Center</span>
                        <span>Bottom</span>
                      </div>
                    </div>

                    {/* Status Bar Size (pixels) */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Status Bar Size</span>
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.statusBarSize || 48}px</span>
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="120"
                        value={config.pomodoroStyleSettings?.statusBarSize || 48}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, statusBarSize: parseInt(e.target.value) }
                        })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    {/* Counter Size (pixels) */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Counter Size</span>
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.counterSize || 32}px</span>
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="80"
                        value={config.pomodoroStyleSettings?.counterSize || 32}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, counterSize: parseInt(e.target.value) }
                        })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    {/* Layout Direction */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">Layout Direction</label>
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setConfig({
                            ...config,
                            pomodoroStyleSettings: { ...config.pomodoroStyleSettings, layoutDirection: 'vertical' }
                          })}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            (config.pomodoroStyleSettings?.layoutDirection || 'vertical') === 'vertical'
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-semibold">Vertical</div>
                          <div className="text-lg mt-1">⬇️</div>
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setConfig({
                            ...config,
                            pomodoroStyleSettings: { ...config.pomodoroStyleSettings, layoutDirection: 'horizontal' }
                          })}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            config.pomodoroStyleSettings?.layoutDirection === 'horizontal'
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-semibold">Horizontal</div>
                          <div className="text-lg mt-1">↔️</div>
                        </motion.button>
                      </div>
                    </div>

                    {/* Progress Bar Width */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Progress Bar Width</span>
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.progressBarWidth || 300}px</span>
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="800"
                        value={config.pomodoroStyleSettings?.progressBarWidth || 300}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, progressBarWidth: parseInt(e.target.value) }
                        })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    {/* Progress Bar Height */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Progress Bar Height</span>
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.progressBarHeight || 24}px</span>
                      </label>
                      <input
                        type="range"
                        min="4"
                        max="40"
                        value={config.pomodoroStyleSettings?.progressBarHeight || 24}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, progressBarHeight: parseInt(e.target.value) }
                        })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    {/* Color Pickers */}
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Colors</h4>

                      {/* Timer Color */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Timer Color</label>
                        <div className="flex gap-2">
                          {['#FFFFFF', '#000000', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setConfig({
                                ...config,
                                pomodoroStyleSettings: { ...config.pomodoroStyleSettings, timerColor: color }
                              })}
                              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                (config.pomodoroStyleSettings?.timerColor || '#FFFFFF') === color
                                  ? 'border-slate-900 scale-110'
                                  : 'border-slate-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <input
                            type="color"
                            value={config.pomodoroStyleSettings?.timerColor || '#FFFFFF'}
                            onChange={(e) => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, timerColor: e.target.value }
                            })}
                            className="w-8 h-8 rounded-lg border-2 border-slate-200 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Status Color */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Status Color</label>
                        <div className="flex gap-2">
                          {['#FFFFFF', '#000000', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setConfig({
                                ...config,
                                pomodoroStyleSettings: { ...config.pomodoroStyleSettings, statusColor: color }
                              })}
                              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                (config.pomodoroStyleSettings?.statusColor || '#FFFFFF') === color
                                  ? 'border-slate-900 scale-110'
                                  : 'border-slate-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <input
                            type="color"
                            value={config.pomodoroStyleSettings?.statusColor || '#FFFFFF'}
                            onChange={(e) => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, statusColor: e.target.value }
                            })}
                            className="w-8 h-8 rounded-lg border-2 border-slate-200 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Counter Color */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Counter Color</label>
                        <div className="flex gap-2">
                          {['#FFFFFF', '#000000', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setConfig({
                                ...config,
                                pomodoroStyleSettings: { ...config.pomodoroStyleSettings, counterColor: color }
                              })}
                              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                (config.pomodoroStyleSettings?.counterColor || '#FFFFFF') === color
                                  ? 'border-slate-900 scale-110'
                                  : 'border-slate-200 hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <input
                            type="color"
                            value={config.pomodoroStyleSettings?.counterColor || '#FFFFFF'}
                            onChange={(e) => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, counterColor: e.target.value }
                            })}
                            className="w-8 h-8 rounded-lg border-2 border-slate-200 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Progress Bar Colors */}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-600">Progress Bar - Active (Fill)</label>
                          <div className="flex gap-2">
                            {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#FFFFFF', '#000000'].map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setConfig({
                                  ...config,
                                  pomodoroStyleSettings: { ...config.pomodoroStyleSettings, progressActiveColor: color }
                                })}
                                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                  config.pomodoroStyleSettings?.progressActiveColor === color
                                    ? 'border-slate-900 scale-110'
                                    : 'border-slate-200 hover:scale-105'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                            <input
                              type="color"
                              value={config.pomodoroStyleSettings?.progressActiveColor || '#10B981'}
                              onChange={(e) => setConfig({
                                ...config,
                                pomodoroStyleSettings: { ...config.pomodoroStyleSettings, progressActiveColor: e.target.value }
                              })}
                              className="w-8 h-8 rounded-lg border-2 border-slate-200 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-600">Progress Bar - Passive (Background)</label>
                          <div className="flex gap-2">
                            {['#FFFFFF', '#000000', '#1E293B', '#475569', '#94A3B8', '#CBD5E1', '#E2E8F0', '#F1F5F9'].map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setConfig({
                                  ...config,
                                  pomodoroStyleSettings: { ...config.pomodoroStyleSettings, progressPassiveColor: color }
                                })}
                                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                  config.pomodoroStyleSettings?.progressPassiveColor === color
                                    ? 'border-slate-900 scale-110'
                                    : 'border-slate-200 hover:scale-105'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                            <input
                              type="color"
                              value={config.pomodoroStyleSettings?.progressPassiveColor || '#FFFFFF'}
                              onChange={(e) => setConfig({
                                ...config,
                                pomodoroStyleSettings: { ...config.pomodoroStyleSettings, progressPassiveColor: e.target.value }
                              })}
                              className="w-8 h-8 rounded-lg border-2 border-slate-200 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Display Toggles */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">Show/Hide Elements</label>
                      <div className="space-y-2">
                        {[
                          { key: 'showProgress', label: 'Progress Bar' },
                          { key: 'showStatus', label: 'Status Label' },
                          { key: 'showCounter', label: 'Pomodoro Counter' },
                        ].map((toggle) => (
                          <label key={toggle.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <span className="text-sm text-slate-700">{toggle.label}</span>
                            <input
                              type="checkbox"
                              checked={config.pomodoroStyleSettings?.[toggle.key] !== false}
                              onChange={(e) => setConfig({
                                ...config,
                                pomodoroStyleSettings: { ...config.pomodoroStyleSettings, [toggle.key]: e.target.checked }
                              })}
                              className="w-4 h-4 accent-purple-600"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Font Weight Toggle */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">Font Weight</label>
                      <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <span className="text-sm text-slate-700">Bold Timer</span>
                        <input
                          type="checkbox"
                          checked={config.pomodoroStyleSettings?.boldTimer !== false}
                          onChange={(e) => setConfig({
                            ...config,
                            pomodoroStyleSettings: { ...config.pomodoroStyleSettings, boldTimer: e.target.checked }
                          })}
                          className="w-4 h-4 accent-purple-600"
                        />
                      </label>
                    </div>

                    {/* Background Settings */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Background</h3>

                      {/* Render Background Toggle */}
                      <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <span className="text-sm text-slate-700">Render Background</span>
                        <input
                          type="checkbox"
                          checked={config.pomodoroStyleSettings?.renderBackground === true}
                          onChange={(e) => setConfig({
                            ...config,
                            pomodoroStyleSettings: { ...config.pomodoroStyleSettings, renderBackground: e.target.checked }
                          })}
                          className="w-4 h-4 accent-purple-600"
                        />
                      </label>

                      {/* Background Color - Only show if render background is enabled */}
                      {config.pomodoroStyleSettings?.renderBackground && (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600">Background Color</label>
                            <div className="flex gap-2 flex-wrap">
                              {['#000000', '#1E293B', '#374151', '#4B5563', '#6B7280', '#FFFFFF'].map((color) => (
                                <motion.button
                                  key={color}
                                  type="button"
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setConfig({
                                    ...config,
                                    pomodoroStyleSettings: { ...config.pomodoroStyleSettings, backgroundColor: color }
                                  })}
                                  className="w-10 h-10 rounded-lg border-2 transition-all"
                                  style={{
                                    backgroundColor: color,
                                    borderColor: (config.pomodoroStyleSettings?.backgroundColor || '#000000') === color ? '#8B5CF6' : 'transparent'
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Horizontal Padding */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600 flex justify-between">
                              <span>Horizontal Padding</span>
                              <span className="text-slate-400">{config.pomodoroStyleSettings?.paddingX || 32}px</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={config.pomodoroStyleSettings?.paddingX || 32}
                              onChange={(e) => setConfig({
                                ...config,
                                pomodoroStyleSettings: { ...config.pomodoroStyleSettings, paddingX: parseInt(e.target.value) }
                              })}
                              className="w-full accent-purple-600"
                            />
                          </div>

                          {/* Vertical Padding */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600 flex justify-between">
                              <span>Vertical Padding</span>
                              <span className="text-slate-400">{config.pomodoroStyleSettings?.paddingY || 24}px</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={config.pomodoroStyleSettings?.paddingY || 24}
                              onChange={(e) => setConfig({
                                ...config,
                                pomodoroStyleSettings: { ...config.pomodoroStyleSettings, paddingY: parseInt(e.target.value) }
                              })}
                              className="w-full accent-purple-600"
                            />
                          </div>

                          {/* Border Radius */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600 flex justify-between">
                              <span>Border Radius</span>
                              <span className="text-slate-400">{config.pomodoroStyleSettings?.borderRadius || 16}px</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              value={config.pomodoroStyleSettings?.borderRadius || 16}
                              onChange={(e) => setConfig({
                                ...config,
                                pomodoroStyleSettings: { ...config.pomodoroStyleSettings, borderRadius: parseInt(e.target.value) }
                              })}
                              className="w-full accent-purple-600"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Minimal Style Settings */}
                {(config.pomodoroStyle === 'minimal' || !config.pomodoroStyle) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-slate-200"
                  >
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Minimal Style</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">Accent Color</label>
                      <div className="flex gap-2">
                        {['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'].map((color) => (
                          <motion.button
                            key={color}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, accentColor: color }
                            })}
                            className="w-10 h-10 rounded-lg border-2 transition-all"
                            style={{
                              backgroundColor: color,
                              borderColor: config.pomodoroStyleSettings?.accentColor === color ? '#000' : 'transparent'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Gradient Style Settings */}
                {(config.pomodoroStyle === 'gradient') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-slate-200"
                  >
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Gradient Style</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">
                        Color Scheme
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'purple-pink', colors: ['#8B5CF6', '#EC4899'], label: 'Purple-Pink' },
                          { value: 'blue-cyan', colors: ['#3B82F6', '#06B6D4'], label: 'Blue-Cyan' },
                          { value: 'orange-red', colors: ['#F59E0B', '#EF4444'], label: 'Orange-Red' },
                          { value: 'green-teal', colors: ['#10B981', '#14B8A6'], label: 'Green-Teal' },
                        ].map((scheme) => (
                          <motion.button
                            key={scheme.value}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, gradientScheme: scheme.value }
                            })}
                            className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center text-xs font-semibold text-white ${
                              config.pomodoroStyleSettings?.gradientScheme === scheme.value ? 'border-black' : 'border-transparent'
                            }`}
                            style={{
                              background: `linear-gradient(135deg, ${scheme.colors[0]}, ${scheme.colors[1]})`,
                            }}
                          >
                            {scheme.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Animation Speed</span>
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.animationSpeed || 8}s</span>
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="15"
                        value={config.pomodoroStyleSettings?.animationSpeed || 8}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, animationSpeed: parseInt(e.target.value) }
                        })}
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Ambient Style Settings */}
                {(config.pomodoroStyle === 'ambient') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-slate-200"
                  >
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Ambient Style</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">
                        Glow Color
                      </label>
                      <div className="flex gap-2">
                        {['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B'].map((color) => (
                          <motion.button
                            key={color}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, glowColor: color }
                            })}
                            className="w-10 h-10 rounded-lg border-2 transition-all"
                            style={{
                              backgroundColor: color,
                              borderColor: config.pomodoroStyleSettings?.glowColor === color ? '#000' : 'transparent',
                              boxShadow: `0 0 ${config.pomodoroStyleSettings?.glowColor === color ? '20' : '10'}px ${color}80`
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Glow Intensity</span>
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.glowIntensity || 40}px</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={config.pomodoroStyleSettings?.glowIntensity || 40}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, glowIntensity: parseInt(e.target.value) }
                        })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <span className="text-sm text-slate-700">Show Glow Effect</span>
                      <input
                        type="checkbox"
                        checked={config.pomodoroStyleSettings?.showGlow !== false}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, showGlow: e.target.checked }
                        })}
                        className="w-4 h-4 accent-purple-600"
                      />
                    </label>
                  </motion.div>
                )}

                {/* Focus Style Settings */}
                {(config.pomodoroStyle === 'focus') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-slate-200"
                  >
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Focus Style</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">
                        Accent Color
                      </label>
                      <div className="flex gap-2">
                        {['#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#10B981'].map((color) => (
                          <motion.button
                            key={color}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setConfig({
                              ...config,
                              pomodoroStyleSettings: { ...config.pomodoroStyleSettings, accentColor: color }
                            })}
                            className="w-10 h-10 rounded-lg border-2 transition-all"
                            style={{
                              backgroundColor: color,
                              borderColor: config.pomodoroStyleSettings?.accentColor === color ? '#000' : 'transparent',
                              boxShadow: config.pomodoroStyleSettings?.accentColor === color ? `0 0 0 2px ${color}40` : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Stroke Width</span>
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.strokeWidth || 2}px</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        value={config.pomodoroStyleSettings?.strokeWidth || 2}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, strokeWidth: parseInt(e.target.value) }
                        })}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <span className="text-sm text-slate-700">Show Drop Shadow</span>
                      <input
                        type="checkbox"
                        checked={config.pomodoroStyleSettings?.showShadow !== false}
                        onChange={(e) => setConfig({
                          ...config,
                          pomodoroStyleSettings: { ...config.pomodoroStyleSettings, showShadow: e.target.checked }
                        })}
                        className="w-4 h-4 accent-purple-600"
                      />
                    </label>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Spotify Style Settings */}
            {widget.type === 'spotify' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Style Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-600">
                    Visual Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'glassmorphism', label: 'Glassmorphism', icon: '✨', desc: 'Modern glass effect' },
                      { value: 'vinyl', label: 'Vinyl', icon: '💿', desc: 'Classic record' },
                      { value: 'default', label: 'Minimal', icon: '🎵', desc: 'Clean & simple' },
                    ].map((styleOption) => (
                      <motion.button
                        key={styleOption.value}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setConfig({ ...config, spotifyStyle: styleOption.value })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          (config.spotifyStyle || 'default') === styleOption.value
                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{styleOption.icon}</span>
                          <span className="text-sm font-semibold">{styleOption.label}</span>
                        </div>
                        <p className={`text-xs ${
                          (config.spotifyStyle || 'default') === styleOption.value
                            ? 'text-white/70'
                            : 'text-slate-500'
                        }`}>
                          {styleOption.desc}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Glassmorphism Settings */}
                {(config.spotifyStyle === 'glassmorphism') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-slate-200"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">
                        Accent Color
                      </label>
                      <div className="flex gap-2">
                        {['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B'].map((color) => (
                          <motion.button
                            key={color}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setConfig({
                              ...config,
                              styleSettings: { ...config.styleSettings, accentColor: color }
                            })}
                            className="w-10 h-10 rounded-lg border-2 transition-all"
                            style={{
                              backgroundColor: color,
                              borderColor: config.styleSettings?.accentColor === color ? '#000' : 'transparent',
                              boxShadow: config.styleSettings?.accentColor === color ? `0 0 0 2px ${color}40` : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Glass Blur</span>
                        <span className="text-slate-400">{config.styleSettings?.glassBlur || 20}px</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={config.styleSettings?.glassBlur || 20}
                        onChange={(e) => setConfig({
                          ...config,
                          styleSettings: { ...config.styleSettings, glassBlur: parseInt(e.target.value) }
                        })}
                        className="w-full accent-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Glass Opacity</span>
                        <span className="text-slate-400">{((config.styleSettings?.glassOpacity || 0.15) * 100).toFixed(0)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.05"
                        value={config.styleSettings?.glassOpacity || 0.15}
                        onChange={(e) => setConfig({
                          ...config,
                          styleSettings: { ...config.styleSettings, glassOpacity: parseFloat(e.target.value) }
                        })}
                        className="w-full accent-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Compact Mode</label>
                        <p className="text-xs text-slate-500 mt-0.5">Smaller, space-saving layout</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.styleSettings?.compact || false}
                          onChange={(e) => setConfig({
                            ...config,
                            styleSettings: { ...config.styleSettings, compact: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-900/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                      </label>
                    </div>
                  </motion.div>
                )}

                {/* Vinyl Settings */}
                {(config.spotifyStyle === 'vinyl') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-slate-200"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">
                        Text Position
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'bottom', label: 'Bottom', icon: '⬇️' },
                          { value: 'right', label: 'Right', icon: '➡️' },
                          { value: 'left', label: 'Left', icon: '⬅️' },
                        ].map((pos) => (
                          <motion.button
                            key={pos.value}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfig({
                              ...config,
                              styleSettings: { ...config.styleSettings, textPosition: pos.value }
                            })}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              (config.styleSettings?.textPosition || 'bottom') === pos.value
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="text-lg mb-1">{pos.icon}</div>
                            <div className="text-xs font-medium">{pos.label}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 flex justify-between">
                        <span>Vinyl Size</span>
                        <span className="text-slate-400">{config.styleSettings?.vinylSize || 200}px</span>
                      </label>
                      <input
                        type="range"
                        min="150"
                        max="350"
                        step="25"
                        value={config.styleSettings?.vinylSize || 200}
                        onChange={(e) => setConfig({
                          ...config,
                          styleSettings: { ...config.styleSettings, vinylSize: parseInt(e.target.value) }
                        })}
                        className="w-full accent-slate-900"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Compact</span>
                        <span>Large</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">
                        Label Color
                      </label>
                      <div className="flex gap-2">
                        {['#DC2626', '#9333EA', '#2563EB', '#059669', '#D97706'].map((color) => (
                          <motion.button
                            key={color}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setConfig({
                              ...config,
                              styleSettings: { ...config.styleSettings, labelColor: color }
                            })}
                            className="w-10 h-10 rounded-full border-2 transition-all"
                            style={{
                              backgroundColor: color,
                              borderColor: (config.styleSettings?.labelColor || '#DC2626') === color ? '#000' : 'transparent',
                              boxShadow: (config.styleSettings?.labelColor || '#DC2626') === color ? `0 0 0 2px ${color}40` : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Local Time Settings */}
            {widget.type === 'local' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Font Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Font</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Inter',
                      'Poppins',
                      'Space Grotesk',
                      'Outfit',
                      'Roboto',
                      'Montserrat',
                      'Playfair Display',
                      'Raleway',
                    ].map((fontOption) => (
                      <motion.button
                        key={fontOption}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setConfig({ ...config, font: fontOption })}
                        className={`p-2 rounded-lg border-2 text-center transition-all ${
                          (config.font || 'Inter') === fontOption
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        style={{ fontFamily: fontOption }}
                      >
                        <div className="text-sm font-semibold">{fontOption}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Time Format Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Time Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: '24h-short', label: '24h + Day', example: '14:30 Mon' },
                      { value: '12h-short', label: '12h + Day', example: '2:30 PM Mon' },
                      { value: '24h-seconds', label: '24h + Seconds', example: '14:30:45 Mon' },
                      { value: '12h-seconds', label: '12h + Seconds', example: '2:30:45 PM Mon' },
                      { value: 'time-only-24h', label: 'Time Only (24h)', example: '14:30' },
                      { value: 'time-only-12h', label: 'Time Only (12h)', example: '2:30 PM' },
                      { value: 'time-date-24h', label: 'Time + Date (24h)', example: '14:30 • Jan 15' },
                      { value: 'time-date-12h', label: 'Time + Date (12h)', example: '2:30 PM • Jan 15' },
                      { value: 'full-24h', label: 'Full (24h)', example: 'Monday, January 15, 2025 • 14:30' },
                      { value: 'full-12h', label: 'Full (12h)', example: 'Monday, January 15, 2025 • 2:30 PM' },
                    ].map((fmt) => (
                      <motion.button
                        key={fmt.value}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setConfig({ ...config, format: fmt.value })}
                        className={`p-2 rounded-lg border-2 text-left transition-all ${
                          (config.format || '24h-short') === fmt.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{fmt.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{fmt.example}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Timezone Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Timezone</label>
                  <select
                    value={config.timezone || 'local'}
                    onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                    className="w-full p-3 rounded-lg border-2 border-slate-200 text-sm focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="local">🌍 Local Time (Your timezone)</option>
                    <optgroup label="🌎 Americas">
                      <option value="America/New_York">New York (EST/EDT)</option>
                      <option value="America/Chicago">Chicago (CST/CDT)</option>
                      <option value="America/Denver">Denver (MST/MDT)</option>
                      <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                      <option value="America/Phoenix">Phoenix (MST)</option>
                      <option value="America/Anchorage">Anchorage (AKST/AKDT)</option>
                      <option value="Pacific/Honolulu">Honolulu (HST)</option>
                      <option value="America/Toronto">Toronto</option>
                      <option value="America/Vancouver">Vancouver</option>
                      <option value="America/Mexico_City">Mexico City</option>
                      <option value="America/Sao_Paulo">São Paulo</option>
                      <option value="America/Buenos_Aires">Buenos Aires</option>
                      <option value="America/Santiago">Santiago</option>
                      <option value="America/Lima">Lima</option>
                      <option value="America/Bogota">Bogotá</option>
                    </optgroup>
                    <optgroup label="🌍 Europe">
                      <option value="Europe/London">London (GMT/BST)</option>
                      <option value="Europe/Paris">Paris (CET/CEST)</option>
                      <option value="Europe/Berlin">Berlin (CET/CEST)</option>
                      <option value="Europe/Rome">Rome (CET/CEST)</option>
                      <option value="Europe/Madrid">Madrid (CET/CEST)</option>
                      <option value="Europe/Amsterdam">Amsterdam (CET/CEST)</option>
                      <option value="Europe/Brussels">Brussels (CET/CEST)</option>
                      <option value="Europe/Vienna">Vienna (CET/CEST)</option>
                      <option value="Europe/Stockholm">Stockholm (CET/CEST)</option>
                      <option value="Europe/Oslo">Oslo (CET/CEST)</option>
                      <option value="Europe/Copenhagen">Copenhagen (CET/CEST)</option>
                      <option value="Europe/Helsinki">Helsinki (EET/EEST)</option>
                      <option value="Europe/Athens">Athens (EET/EEST)</option>
                      <option value="Europe/Istanbul">Istanbul (TRT)</option>
                      <option value="Europe/Moscow">Moscow (MSK)</option>
                      <option value="Europe/Warsaw">Warsaw (CET/CEST)</option>
                      <option value="Europe/Prague">Prague (CET/CEST)</option>
                      <option value="Europe/Budapest">Budapest (CET/CEST)</option>
                      <option value="Europe/Zurich">Zurich (CET/CEST)</option>
                      <option value="Europe/Dublin">Dublin (GMT/IST)</option>
                      <option value="Europe/Lisbon">Lisbon (WET/WEST)</option>
                    </optgroup>
                    <optgroup label="🌏 Asia & Pacific">
                      <option value="Asia/Dubai">Dubai (GST)</option>
                      <option value="Asia/Karachi">Karachi (PKT)</option>
                      <option value="Asia/Kolkata">Mumbai/Delhi (IST)</option>
                      <option value="Asia/Dhaka">Dhaka (BST)</option>
                      <option value="Asia/Bangkok">Bangkok (ICT)</option>
                      <option value="Asia/Singapore">Singapore (SGT)</option>
                      <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                      <option value="Asia/Shanghai">Shanghai (CST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Asia/Seoul">Seoul (KST)</option>
                      <option value="Asia/Taipei">Taipei (CST)</option>
                      <option value="Asia/Manila">Manila (PHT)</option>
                      <option value="Asia/Jakarta">Jakarta (WIB)</option>
                      <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
                      <option value="Australia/Melbourne">Melbourne (AEDT/AEST)</option>
                      <option value="Australia/Brisbane">Brisbane (AEST)</option>
                      <option value="Australia/Perth">Perth (AWST)</option>
                      <option value="Pacific/Auckland">Auckland (NZDT/NZST)</option>
                      <option value="Pacific/Fiji">Fiji (FJT)</option>
                    </optgroup>
                    <optgroup label="🌍 Africa & Middle East">
                      <option value="Africa/Cairo">Cairo (EET)</option>
                      <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                      <option value="Africa/Lagos">Lagos (WAT)</option>
                      <option value="Africa/Nairobi">Nairobi (EAT)</option>
                      <option value="Asia/Jerusalem">Jerusalem (IST)</option>
                      <option value="Asia/Riyadh">Riyadh (AST)</option>
                    </optgroup>
                    <optgroup label="🕐 UTC Offsets">
                      <option value="UTC+0">UTC+0</option>
                      <option value="UTC+1">UTC+1</option>
                      <option value="UTC+2">UTC+2</option>
                      <option value="UTC+3">UTC+3</option>
                      <option value="UTC+4">UTC+4</option>
                      <option value="UTC+5">UTC+5</option>
                      <option value="UTC+5.5">UTC+5:30 (India)</option>
                      <option value="UTC+6">UTC+6</option>
                      <option value="UTC+7">UTC+7</option>
                      <option value="UTC+8">UTC+8</option>
                      <option value="UTC+9">UTC+9</option>
                      <option value="UTC+9.5">UTC+9:30 (Adelaide)</option>
                      <option value="UTC+10">UTC+10</option>
                      <option value="UTC+11">UTC+11</option>
                      <option value="UTC+12">UTC+12</option>
                      <option value="UTC-1">UTC-1</option>
                      <option value="UTC-2">UTC-2</option>
                      <option value="UTC-3">UTC-3</option>
                      <option value="UTC-4">UTC-4</option>
                      <option value="UTC-5">UTC-5</option>
                      <option value="UTC-6">UTC-6</option>
                      <option value="UTC-7">UTC-7</option>
                      <option value="UTC-8">UTC-8</option>
                      <option value="UTC-9">UTC-9</option>
                      <option value="UTC-10">UTC-10</option>
                      <option value="UTC-11">UTC-11</option>
                    </optgroup>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Quote Widget Settings */}
            {widget.type === 'quote' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Quote Style</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'minimal', label: 'Minimal', desc: 'Clean & simple' },
                      { value: 'serif', label: 'Serif', desc: 'Classic elegance' },
                      { value: 'modern', label: 'Modern', desc: 'Bold & contemporary' },
                    ].map((styleOption) => (
                      <motion.button
                        key={styleOption.value}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setConfig({ ...config, quoteStyle: styleOption.value })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          (config.quoteStyle || 'minimal') === styleOption.value
                            ? 'border-amber-600 bg-amber-600 text-white shadow-lg'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-semibold">{styleOption.label}</div>
                        <div className={`text-xs mt-0.5 ${
                          (config.quoteStyle || 'minimal') === styleOption.value ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {styleOption.desc}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Appearance</h3>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Quote Text Size</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="24"
                        max="72"
                        value={config.quoteStyleSettings?.fontSize || 48}
                        onChange={(e) => setConfig({
                          ...config,
                          quoteStyleSettings: { ...config.quoteStyleSettings, fontSize: Number(e.target.value) }
                        })}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono text-slate-600 w-12 text-right">
                        {config.quoteStyleSettings?.fontSize || 48}px
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Author Text Size</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="14"
                        max="36"
                        value={config.quoteStyleSettings?.authorSize || 24}
                        onChange={(e) => setConfig({
                          ...config,
                          quoteStyleSettings: { ...config.quoteStyleSettings, authorSize: Number(e.target.value) }
                        })}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono text-slate-600 w-12 text-right">
                        {config.quoteStyleSettings?.authorSize || 24}px
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Max Width</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="400"
                        max="1200"
                        step="50"
                        value={config.quoteStyleSettings?.maxWidth || 800}
                        onChange={(e) => setConfig({
                          ...config,
                          quoteStyleSettings: { ...config.quoteStyleSettings, maxWidth: Number(e.target.value) }
                        })}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono text-slate-600 w-12 text-right">
                        {config.quoteStyleSettings?.maxWidth || 800}px
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Text Alignment</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => setConfig({
                            ...config,
                            quoteStyleSettings: { ...config.quoteStyleSettings, alignment: align }
                          })}
                          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                            (config.quoteStyleSettings?.alignment || 'center') === align
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {align.charAt(0).toUpperCase() + align.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Show Quotation Marks</label>
                      <p className="text-xs text-slate-500 mt-0.5">Display "" around the quote</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        quoteStyleSettings: {
                          ...config.quoteStyleSettings,
                          showQuotes: config.quoteStyleSettings?.showQuotes === false ? true : false
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.quoteStyleSettings?.showQuotes !== false ? 'bg-amber-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.quoteStyleSettings?.showQuotes !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TODO Widget Settings - FULL FEATURED */}
            {widget.type === 'todo' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Todo Lists Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Todo Lists</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newListId = `list-${Date.now()}`;
                        const newLists = [
                          ...(config.todoLists || []),
                          {
                            id: newListId,
                            name: 'New List',
                            color: '#8B5CF6',
                            todos: []
                          }
                        ];
                        setConfig({
                          ...config,
                          todoLists: newLists,
                          activeListId: newListId
                        });
                      }}
                      className="px-3 py-1.5 bg-pink-600 text-white text-xs font-medium rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      + Add List
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(config.todoLists || []).map((list: any, listIndex: number) => (
                      <div
                        key={list.id}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          config.activeListId === list.id
                            ? 'border-pink-600 bg-pink-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={list.name}
                            onChange={(e) => {
                              const newLists = [...config.todoLists];
                              newLists[listIndex].name = e.target.value;
                              setConfig({ ...config, todoLists: newLists });
                            }}
                            className="flex-1 px-2 py-1 text-sm font-medium bg-transparent border-none focus:outline-none"
                            placeholder="List name"
                          />
                          <input
                            type="color"
                            value={list.color}
                            onChange={(e) => {
                              const newLists = [...config.todoLists];
                              newLists[listIndex].color = e.target.value;
                              setConfig({ ...config, todoLists: newLists });
                            }}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          {config.todoLists.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newLists = config.todoLists.filter((_: any, i: number) => i !== listIndex);
                                setConfig({
                                  ...config,
                                  todoLists: newLists,
                                  activeListId: config.activeListId === list.id ? newLists[0]?.id : config.activeListId
                                });
                              }}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfig({ ...config, activeListId: list.id })}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              config.activeListId === list.id
                                ? 'bg-pink-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {config.activeListId === list.id ? 'Active' : 'Select'}
                          </button>
                        </div>

                        {/* Todo Items Management */}
                        <div className="space-y-2 mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-600 font-medium">
                              Tasks ({list.todos.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newLists = [...config.todoLists];
                                newLists[listIndex].todos.push({
                                  id: `todo-${Date.now()}`,
                                  text: 'New task',
                                  completed: false,
                                  priority: null,
                                  dueDate: null,
                                  createdAt: new Date().toISOString(),
                                  completedAt: null
                                });
                                setConfig({ ...config, todoLists: newLists });
                              }}
                              className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                            >
                              + Add Task
                            </button>
                          </div>

                          {list.todos.map((todo: any, todoIndex: number) => (
                            <div
                              key={todo.id}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={todo.completed}
                                  onChange={(e) => {
                                    const newLists = [...config.todoLists];
                                    newLists[listIndex].todos[todoIndex].completed = e.target.checked;
                                    newLists[listIndex].todos[todoIndex].completedAt = e.target.checked
                                      ? new Date().toISOString()
                                      : null;
                                    setConfig({ ...config, todoLists: newLists });
                                  }}
                                  className="mt-1 w-4 h-4 rounded border-slate-300"
                                />
                                <input
                                  type="text"
                                  value={todo.text}
                                  onChange={(e) => {
                                    const newLists = [...config.todoLists];
                                    newLists[listIndex].todos[todoIndex].text = e.target.value;
                                    setConfig({ ...config, todoLists: newLists });
                                  }}
                                  className="flex-1 px-2 py-1 text-xs bg-white rounded border border-slate-200 focus:border-pink-600 focus:outline-none"
                                  placeholder="Task description"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newLists = [...config.todoLists];
                                    newLists[listIndex].todos = newLists[listIndex].todos.filter(
                                      (_: any, i: number) => i !== todoIndex
                                    );
                                    setConfig({ ...config, todoLists: newLists });
                                  }}
                                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                                >
                                  ×
                                </button>
                              </div>

                              {/* Priority and Due Date */}
                              <div className="flex items-center gap-2 pl-6">
                                <select
                                  value={todo.priority || ''}
                                  onChange={(e) => {
                                    const newLists = [...config.todoLists];
                                    newLists[listIndex].todos[todoIndex].priority = e.target.value || null;
                                    setConfig({ ...config, todoLists: newLists });
                                  }}
                                  className="text-xs px-2 py-1 rounded border border-slate-200 bg-white focus:border-pink-600 focus:outline-none"
                                >
                                  <option value="">No priority</option>
                                  <option value="high">High</option>
                                  <option value="medium">Medium</option>
                                  <option value="low">Low</option>
                                </select>

                                <input
                                  type="date"
                                  value={todo.dueDate || ''}
                                  onChange={(e) => {
                                    const newLists = [...config.todoLists];
                                    newLists[listIndex].todos[todoIndex].dueDate = e.target.value || null;
                                    setConfig({ ...config, todoLists: newLists });
                                  }}
                                  className="text-xs px-2 py-1 rounded border border-slate-200 bg-white focus:border-pink-600 focus:outline-none"
                                />

                                {todo.dueDate && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newLists = [...config.todoLists];
                                      newLists[listIndex].todos[todoIndex].dueDate = null;
                                      setConfig({ ...config, todoLists: newLists });
                                    }}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {list.todos.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-4">
                              No tasks yet. Click "+ Add Task" to create one.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Style */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Visual Style</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'minimal', label: 'Minimal', desc: 'Clean & simple' },
                      { value: 'modern', label: 'Modern', desc: 'Bold & vibrant' },
                      { value: 'compact', label: 'Compact', desc: 'Space-efficient' },
                    ].map((styleOption) => (
                      <motion.button
                        key={styleOption.value}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setConfig({ ...config, todoStyle: styleOption.value })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          (config.todoStyle || 'minimal') === styleOption.value
                            ? 'border-pink-600 bg-pink-600 text-white shadow-lg'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-semibold">{styleOption.label}</div>
                        <div className={`text-xs mt-0.5 ${
                          (config.todoStyle || 'minimal') === styleOption.value ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {styleOption.desc}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Appearance Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">Appearance</h3>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Title Size</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="20"
                        max="48"
                        value={config.todoStyleSettings?.titleSize || 32}
                        onChange={(e) => setConfig({
                          ...config,
                          todoStyleSettings: { ...config.todoStyleSettings, titleSize: Number(e.target.value) }
                        })}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono text-slate-600 w-12 text-right">
                        {config.todoStyleSettings?.titleSize || 32}px
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Task Text Size</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="14"
                        max="32"
                        value={config.todoStyleSettings?.fontSize || 20}
                        onChange={(e) => setConfig({
                          ...config,
                          todoStyleSettings: { ...config.todoStyleSettings, fontSize: Number(e.target.value) }
                        })}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono text-slate-600 w-12 text-right">
                        {config.todoStyleSettings?.fontSize || 20}px
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Max Width</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="400"
                        max="1000"
                        step="50"
                        value={config.todoStyleSettings?.maxWidth || 600}
                        onChange={(e) => setConfig({
                          ...config,
                          todoStyleSettings: { ...config.todoStyleSettings, maxWidth: Number(e.target.value) }
                        })}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono text-slate-600 w-12 text-right">
                        {config.todoStyleSettings?.maxWidth || 600}px
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Show Priority Tags</label>
                      <p className="text-xs text-slate-500 mt-0.5">Display priority badges</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        todoStyleSettings: {
                          ...config.todoStyleSettings,
                          showPriority: config.todoStyleSettings?.showPriority === false ? true : false
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.todoStyleSettings?.showPriority !== false ? 'bg-pink-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.todoStyleSettings?.showPriority !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Show Due Dates</label>
                      <p className="text-xs text-slate-500 mt-0.5">Display due date labels</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        todoStyleSettings: {
                          ...config.todoStyleSettings,
                          showDueDate: config.todoStyleSettings?.showDueDate === false ? true : false
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.todoStyleSettings?.showDueDate !== false ? 'bg-pink-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.todoStyleSettings?.showDueDate !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Background Customization */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Background Customization</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Customize task item backgrounds</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({
                        ...config,
                        todoStyleSettings: {
                          ...config.todoStyleSettings,
                          enableBackgroundCustomization: !config.todoStyleSettings?.enableBackgroundCustomization
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.todoStyleSettings?.enableBackgroundCustomization ? 'bg-pink-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.todoStyleSettings?.enableBackgroundCustomization ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {config.todoStyleSettings?.enableBackgroundCustomization && (
                    <>
                      {/* Background Color & Opacity */}
                      <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Background Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.todoStyleSettings?.backgroundColor || '#000000'}
                        onChange={(e) => setConfig({
                          ...config,
                          todoStyleSettings: { ...config.todoStyleSettings, backgroundColor: e.target.value }
                        })}
                        className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">Opacity</span>
                          <span className="text-slate-400">{Math.round((config.todoStyleSettings?.backgroundOpacity ?? 0.05) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={config.todoStyleSettings?.backgroundOpacity ?? 0.05}
                          onChange={(e) => setConfig({
                            ...config,
                            todoStyleSettings: { ...config.todoStyleSettings, backgroundOpacity: Number(e.target.value) }
                          })}
                          className="w-full accent-pink-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Border Customization */}
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Border</label>

                    {/* Border Color & Opacity */}
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.todoStyleSettings?.borderColor || '#FFFFFF'}
                        onChange={(e) => setConfig({
                          ...config,
                          todoStyleSettings: { ...config.todoStyleSettings, borderColor: e.target.value }
                        })}
                        className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">Border Opacity</span>
                          <span className="text-slate-400">{Math.round((config.todoStyleSettings?.borderOpacity ?? 0.1) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={config.todoStyleSettings?.borderOpacity ?? 0.1}
                          onChange={(e) => setConfig({
                            ...config,
                            todoStyleSettings: { ...config.todoStyleSettings, borderOpacity: Number(e.target.value) }
                          })}
                          className="w-full accent-pink-600"
                        />
                      </div>
                    </div>

                    {/* Border Width */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 min-w-[80px]">Width</span>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        value={config.todoStyleSettings?.borderWidth ?? 1}
                        onChange={(e) => setConfig({
                          ...config,
                          todoStyleSettings: { ...config.todoStyleSettings, borderWidth: Number(e.target.value) }
                        })}
                        className="flex-1 accent-pink-600"
                      />
                      <span className="text-xs font-mono text-slate-600 w-12 text-right">
                        {config.todoStyleSettings?.borderWidth ?? 1}px
                      </span>
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Border Radius (Rounding)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={config.todoStyleSettings?.borderRadius ?? 12}
                        onChange={(e) => setConfig({
                          ...config,
                          todoStyleSettings: { ...config.todoStyleSettings, borderRadius: Number(e.target.value) }
                        })}
                        className="flex-1 accent-pink-600"
                      />
                      <span className="text-xs font-mono text-slate-600 w-12 text-right">
                        {config.todoStyleSettings?.borderRadius ?? 12}px
                      </span>
                    </div>
                  </div>

                  {/* Padding */}
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600">Padding (Inner Spacing)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={config.todoStyleSettings?.padding ?? 16}
                        onChange={(e) => setConfig({
                          ...config,
                          todoStyleSettings: { ...config.todoStyleSettings, padding: Number(e.target.value) }
                        })}
                        className="flex-1 accent-pink-600"
                      />
                      <span className="text-xs font-mono text-slate-600 w-12 text-right">
                        {config.todoStyleSettings?.padding ?? 16}px
                      </span>
                    </div>
                  </div>

                  {/* Shadow */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-600">Shadow</label>
                      <button
                        type="button"
                        onClick={() => setConfig({
                          ...config,
                          todoStyleSettings: {
                            ...config.todoStyleSettings,
                            enableShadow: !config.todoStyleSettings?.enableShadow
                          }
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.todoStyleSettings?.enableShadow ? 'bg-pink-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.todoStyleSettings?.enableShadow ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {config.todoStyleSettings?.enableShadow && (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 min-w-[80px]">Blur</span>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={config.todoStyleSettings?.shadowBlur ?? 20}
                            onChange={(e) => setConfig({
                              ...config,
                              todoStyleSettings: { ...config.todoStyleSettings, shadowBlur: Number(e.target.value) }
                            })}
                            className="flex-1 accent-pink-600"
                          />
                          <span className="text-xs font-mono text-slate-600 w-12 text-right">
                            {config.todoStyleSettings?.shadowBlur ?? 20}px
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={config.todoStyleSettings?.shadowColor || '#000000'}
                            onChange={(e) => setConfig({
                              ...config,
                              todoStyleSettings: { ...config.todoStyleSettings, shadowColor: e.target.value }
                            })}
                            className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600">Shadow Opacity</span>
                              <span className="text-slate-400">{Math.round((config.todoStyleSettings?.shadowOpacity ?? 0.3) * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={config.todoStyleSettings?.shadowOpacity ?? 0.3}
                              onChange={(e) => setConfig({
                                ...config,
                                todoStyleSettings: { ...config.todoStyleSettings, shadowOpacity: Number(e.target.value) }
                              })}
                              className="w-full accent-pink-600"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Backdrop Blur */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-medium text-slate-600">Backdrop Blur</label>
                        <p className="text-xs text-slate-500 mt-0.5">Glass effect behind items</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig({
                          ...config,
                          todoStyleSettings: {
                            ...config.todoStyleSettings,
                            enableBackdropBlur: !config.todoStyleSettings?.enableBackdropBlur
                          }
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.todoStyleSettings?.enableBackdropBlur ? 'bg-pink-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.todoStyleSettings?.enableBackdropBlur ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {config.todoStyleSettings?.enableBackdropBlur && (
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="24"
                          value={config.todoStyleSettings?.backdropBlur ?? 8}
                          onChange={(e) => setConfig({
                            ...config,
                            todoStyleSettings: { ...config.todoStyleSettings, backdropBlur: Number(e.target.value) }
                          })}
                          className="flex-1 accent-pink-600"
                        />
                        <span className="text-xs font-mono text-slate-600 w-12 text-right">
                          {config.todoStyleSettings?.backdropBlur ?? 8}px
                        </span>
                      </div>
                    )}
                  </div>
                    </>
                  )}
                </div>

                {/* Bulk Actions */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const activeList = config.todoLists?.find((l: any) => l.id === config.activeListId);
                        if (!activeList) return;
                        const newLists = config.todoLists.map((list: any) =>
                          list.id === config.activeListId
                            ? { ...list, todos: list.todos.map((t: any) => ({ ...t, completed: false, completedAt: null })) }
                            : list
                        );
                        setConfig({ ...config, todoLists: newLists });
                      }}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Uncheck All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const activeList = config.todoLists?.find((l: any) => l.id === config.activeListId);
                        if (!activeList) return;
                        const newLists = config.todoLists.map((list: any) =>
                          list.id === config.activeListId
                            ? { ...list, todos: list.todos.filter((t: any) => !t.completed) }
                            : list
                        );
                        setConfig({ ...config, todoLists: newLists });
                      }}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-red-600"
                    >
                      Clear Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const activeList = config.todoLists?.find((l: any) => l.id === config.activeListId);
                        if (!activeList) return;
                        const newLists = config.todoLists.map((list: any) =>
                          list.id === config.activeListId
                            ? { ...list, todos: [] }
                            : list
                        );
                        setConfig({ ...config, todoLists: newLists });
                      }}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-red-600"
                    >
                      Clear All Tasks
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Study Room Widget Settings */}
            {widget.type === 'study-room' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Room Info */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">👥</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-emerald-900 mb-1">Room Information</h3>
                      <p className="text-sm text-emerald-800">
                        Share this invite code with friends to study together!
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <div className="text-xs text-slate-600 mb-1">Invite Code</div>
                    <div className="font-mono font-bold text-lg text-emerald-600">
                      {config.inviteCode || 'STUDY-XXXX'}
                    </div>
                  </div>
                </div>

                {/* Visual Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Appearance</h3>

                  {/* Style */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">Layout Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['compact', 'spacious'].map((styleOption) => (
                        <button
                          key={styleOption}
                          type="button"
                          onClick={() => setConfig({ ...config, style: styleOption })}
                          className={`px-4 py-3 rounded-lg text-sm transition-all ${
                            config.style === styleOption
                              ? 'bg-emerald-600 text-white font-medium'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {styleOption.charAt(0).toUpperCase() + styleOption.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">Background</label>
                      <input
                        type="color"
                        value={config.backgroundColor || '#1a1a1a'}
                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                        className="w-full h-10 rounded-lg cursor-pointer border border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600">Text Color</label>
                      <input
                        type="color"
                        value={config.textColor || '#ffffff'}
                        onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                        className="w-full h-10 rounded-lg cursor-pointer border border-slate-300"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-medium text-slate-600">Accent Color</label>
                      <input
                        type="color"
                        value={config.accentColor || '#10b981'}
                        onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                        className="w-full h-10 rounded-lg cursor-pointer border border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <div className="text-xs font-medium text-slate-700">Show Avatars</div>
                        <div className="text-xs text-slate-500">Display profile pictures</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, showAvatars: !config.showAvatars })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.showAvatars !== false ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.showAvatars !== false ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <div className="text-xs font-medium text-slate-700">Show Status</div>
                        <div className="text-xs text-slate-500">Display custom status messages</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, showStatus: !config.showStatus })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.showStatus !== false ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.showStatus !== false ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <h3 className="text-sm font-semibold mb-3">Quick Tips</h3>
            <ul className="space-y-2 text-xs">
              {widget.type === 'pomodoro' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Timer auto-switches between work and break</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Control from dashboard or overlay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Click the timer to pause/resume</span>
                  </li>
                </>
              )}
              {widget.type === 'spotify' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Updates in real-time as songs change</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Make sure Spotify is actively playing</span>
                  </li>
                </>
              )}
              {widget.type === 'local' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Shows your local timezone automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Clean minimal design for any stream</span>
                  </li>
                </>
              )}
              {widget.type === 'quote' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Quote changes automatically every day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>20 curated motivational study quotes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Try different styles for different vibes</span>
                  </li>
                </>
              )}
              {widget.type === 'todo' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Create multiple lists for different categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Use priorities to focus on what matters most</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Set due dates to stay on track with deadlines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Tasks auto-sort by completion, priority, then date</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Use Quick Actions to manage tasks in bulk</span>
                  </li>
                </>
              )}
              {widget.type === 'study-room' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Share your invite code to study together</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Active status shows who's currently in OBS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Status updates every 5 seconds automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>Customize colors to match your stream aesthetic</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto">
            <Link href="/" className="w-full">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                ← Back to Dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Right Panel - Live Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Preview Header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-6 z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">
                Live Preview
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white/60">
                  OBS View
                </span>
              </div>
            </div>
          </div>

          {/* Iframe Preview */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.iframe
                key={previewKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                src={widgetUrl}
                className="w-full h-full"
                style={{
                  border: 'none',
                  background: 'transparent',
                }}
              />
            </AnimatePresence>
          </div>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isPreviewLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex gap-2">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 rounded-full bg-white"
                    />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                      className="w-2 h-2 rounded-full bg-white"
                    />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-white"
                    />
                  </div>
                  <span className="text-xs font-medium text-white/80">Updating preview...</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decorative Elements */}
          <div className="absolute bottom-6 left-6 text-xs text-white/40">
            1920 × 1080
          </div>
          <div className="absolute bottom-6 right-6 text-xs text-white/40">
            {widget.type.charAt(0).toUpperCase() + widget.type.slice(1)} Widget
          </div>
        </motion.div>
      </div>

      {/* Help Modal */}
      <Sheet open={showHelpModal} onOpenChange={setShowHelpModal}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>How to Add to OBS</SheetTitle>
            <SheetDescription>
              Follow these steps to add your overlay to OBS Studio
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 px-6 space-y-6">
            {/* Step-by-step instructions */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-2">Add Browser Source in OBS</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    In OBS, go to the Sources panel (bottom left) and click the <span className="font-semibold">+</span> button
                  </p>
                  <p className="text-sm text-slate-600">
                    Select <span className="font-semibold">"Browser"</span> from the list
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-2">Configure the Browser Source</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Paste your overlay link into the <span className="font-semibold">URL</span> field
                  </p>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Width:</span>
                      <code className="font-mono font-semibold text-slate-900">1920px</code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Height:</span>
                      <code className="font-mono font-semibold text-slate-900">1080px</code>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    (For compact overlays, you can use 1000×200)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-2">Enable Auto-Refresh</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Scroll down and check the box for:
                  </p>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">
                      ✓ Refresh browser when scene becomes active
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    This ensures your overlay updates properly
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-2">Position Your Overlay</h3>
                  <p className="text-sm text-slate-600">
                    Click OK, then drag and resize the overlay in your OBS preview to position it where you want
                  </p>
                </div>
              </div>
            </div>

            {/* Still having issues */}
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
              <p className="font-semibold mb-2">Still having issues?</p>
              <p className="text-sm text-slate-200 mb-4">
                Check out our complete OBS setup guide with troubleshooting tips and FAQs
              </p>
              <Link
                href="/obs-help"
                onClick={() => setShowHelpModal(false)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Go to OBS Help Page
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Close button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowHelpModal(false)}
            >
              Got it, thanks!
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}