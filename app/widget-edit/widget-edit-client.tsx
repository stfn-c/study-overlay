'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { widgetsService } from '@/lib/services/widgets';
import { createClient } from '@/lib/supabase/client';

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
    setWidgetState(prev => ({
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
      setWidgetState(prev => ({ ...prev, isPaused: !newPausedState }));
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
    const workTime = (config.workingTime || 25) * 60 * 1000;
    const breakTime = (config.restTime || 5) * 60 * 1000;
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

  const autoSave = async () => {
    setSaveStatus('saving');
    try {
      await widgetsService.updateWidget(widget.id, {
        name,
        config,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
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
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Layout & Display</h3>

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
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.statusBarSize || 24}px</span>
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="120"
                        value={config.pomodoroStyleSettings?.statusBarSize || 24}
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
                        <span className="text-slate-400">{config.pomodoroStyleSettings?.counterSize || 16}px</span>
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="80"
                        value={config.pomodoroStyleSettings?.counterSize || 16}
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
          </div>

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