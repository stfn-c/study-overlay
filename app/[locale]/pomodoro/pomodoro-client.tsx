'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client';
import { widgetsService } from '@/lib/services/widgets';

interface PomodoroClientProps {
  workingTime: string;
  restTime: string;
  startTime: string;
  widgetId?: string;
  initialState?: any;
  pomodoroGoal?: string;
  style?: string;
  styleSettings?: any;
  enableSound?: boolean;
}

export default function PomodoroClient({ workingTime: initialWorkingTime, restTime: initialRestTime, widgetId, initialState, pomodoroGoal: initialPomodoroGoal, style: initialStyle = 'minimal', styleSettings: initialStyleSettings = {}, enableSound: initialEnableSound = false }: PomodoroClientProps) {
  const [workingTime, setWorkingTime] = useState(initialWorkingTime);
  const [restTime, setRestTime] = useState(initialRestTime);
  const [pomodoroGoal, setPomodoroGoal] = useState(initialPomodoroGoal);
  const [style, setStyle] = useState(initialStyle);
  const [styleSettings, setStyleSettings] = useState(initialStyleSettings);
  const [enableSound, setEnableSound] = useState(initialEnableSound);

  const workTime = Number(workingTime) * 60 * 1000;
  const breakTime = Number(restTime) * 60 * 1000;
  const goal = pomodoroGoal ? Number(pomodoroGoal) : null;

  const [state, setState] = useState({
    isWorking: initialState?.isWorking ?? true,
    isPaused: initialState?.isPaused ?? false,
    lastActionTime: initialState?.lastActionTime ?? Date.now(),
    lastActionTimeLeft: initialState?.lastActionTimeLeft ?? workTime,
    pomodorosCompleted: initialState?.pomodorosCompleted ?? 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showPromo, setShowPromo] = useState(false);
  const [nextPromoTime, setNextPromoTime] = useState<number | null>(null);

  const supabase = createClient();

  // Schedule promotional message - randomly within each hour
  useEffect(() => {
    const scheduleNextPromo = () => {
      // Random time between 0-3600 seconds (1 hour)
      const randomOffset = Math.floor(Math.random() * 3600 * 1000);
      const nextTime = Date.now() + randomOffset;
      setNextPromoTime(nextTime);
    };

    // Schedule first promo on mount
    if (nextPromoTime === null) {
      scheduleNextPromo();
    }

    // Check if it's time to show promo
    const checkPromo = setInterval(() => {
      if (nextPromoTime && Date.now() >= nextPromoTime && !showPromo && !showCelebration) {
        setShowPromo(true);
        // Hide after 20 seconds
        setTimeout(() => {
          setShowPromo(false);
          // Schedule next promo for the next hour
          scheduleNextPromo();
        }, 20000);
      }
    }, 1000);

    return () => clearInterval(checkPromo);
  }, [nextPromoTime, showPromo, showCelebration]);

  // Play ding sound
  const playDing = useCallback(() => {
    if (!enableSound) return;

    // Create a simple pleasant ding sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant bell-like tone
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, [enableSound]);

  const updateWidgetState = useCallback(async (state: any) => {
    if (!widgetId) return;
    try {
      await widgetsService.updateWidgetState(widgetId, state);
    } catch (error) {
      console.error('Failed to update widget state:', error);
    }
  }, [widgetId]);

  const calculateTimeLeft = useCallback(() => {
    if (state.isPaused) {
      return state.lastActionTimeLeft;
    }
    const elapsed = currentTime - state.lastActionTime;
    const timeLeft = Math.max(0, state.lastActionTimeLeft - elapsed);
    return timeLeft;
  }, [state, currentTime]);

  useEffect(() => {
    if (!widgetId) {
      setIsLoading(false);
      return;
    }

    const fetchWidgetState = async () => {
      try {
        const { data, error } = await supabase
          .from('widgets')
          .select('state, config')
          .eq('id', widgetId)
          .single();

        if (error) throw error;

        // Update config values
        if (data?.config) {
          setWorkingTime(data.config.workingTime || '25');
          setRestTime(data.config.restTime || '5');
          setPomodoroGoal(data.config.pomodoroGoal);
          setStyle(data.config.pomodoroStyle || 'minimal');
          setStyleSettings(data.config.pomodoroStyleSettings || {});
          setEnableSound(data.config.enableSound || false);
        }

        // Update state
        if (data?.state) {
          setState({
            isWorking: data.state.isWorking ?? true,
            isPaused: data.state.isPaused ?? false,
            lastActionTime: data.state.lastActionTime ?? Date.now(),
            lastActionTimeLeft: data.state.lastActionTimeLeft ?? (data.state.isWorking ? workTime : breakTime),
            pomodorosCompleted: data.state.pomodorosCompleted ?? 0,
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch widget data:', error);
        setIsLoading(false);
      }
    };

    fetchWidgetState();
    const interval = setInterval(fetchWidgetState, 5000);
    return () => clearInterval(interval);
  }, [widgetId, supabase, workTime, breakTime]);

  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle timer transitions when time runs out
  useEffect(() => {
    if (state.isPaused || isLoading) return;

    const timeLeft = calculateTimeLeft();

    if (timeLeft === 0) {
      const nextIsWorking = !state.isWorking;
      const nextTimeLeft = nextIsWorking ? workTime : breakTime;
      const newPomodorosCompleted = state.isWorking ? state.pomodorosCompleted + 1 : state.pomodorosCompleted;

      const newState = {
        isWorking: nextIsWorking,
        isPaused: false,
        lastActionTime: Date.now(),
        lastActionTimeLeft: nextTimeLeft,
        pomodorosCompleted: newPomodorosCompleted,
      };

      setState(newState);

      // Play ding sound on transition
      playDing();

      if (goal && newPomodorosCompleted >= goal && newPomodorosCompleted > state.pomodorosCompleted) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }

      updateWidgetState(newState);
    }
  }, [state, isLoading, calculateTimeLeft, workTime, breakTime, goal, updateWidgetState, playDing]);

  // Check for missed transitions on load (when widget was closed)
  useEffect(() => {
    if (isLoading || state.isPaused) return;

    const checkMissedTransitions = () => {
      const elapsed = Date.now() - state.lastActionTime;
      const timeLeft = Math.max(0, state.lastActionTimeLeft - elapsed);

      // If the timer has run out while the page was closed, auto-transition
      if (timeLeft === 0 && state.lastActionTimeLeft > 0) {
        let currentIsWorking = state.isWorking;
        let currentTime = state.lastActionTime;
        let currentTimeLeft = state.lastActionTimeLeft;
        let pomodorosCompleted = state.pomodorosCompleted;

        // Calculate how many transitions we need to make
        let totalElapsed = elapsed;
        while (totalElapsed >= currentTimeLeft) {
          totalElapsed -= currentTimeLeft;

          // Complete current phase
          if (currentIsWorking) {
            pomodorosCompleted++;
          }

          // Switch to next phase
          currentIsWorking = !currentIsWorking;
          currentTimeLeft = currentIsWorking ? workTime : breakTime;
        }

        // Set up the final state
        const now = Date.now();
        const finalTimeLeft = currentTimeLeft - totalElapsed;

        const newState = {
          isWorking: currentIsWorking,
          isPaused: false,
          lastActionTime: now,
          lastActionTimeLeft: finalTimeLeft,
          pomodorosCompleted,
        };

        setState(newState);
        updateWidgetState(newState);

        if (goal && pomodorosCompleted >= goal && pomodorosCompleted > state.pomodorosCompleted) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 5000);
        }
      }
    };

    checkMissedTransitions();
  }, [isLoading, state.isPaused, state.isWorking, state.lastActionTime, state.lastActionTimeLeft, state.pomodorosCompleted, workTime, breakTime, goal, updateWidgetState]);

  const timeLeft = calculateTimeLeft();
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const progress = state.isWorking
    ? ((workTime - timeLeft) / workTime) * 100
    : ((breakTime - timeLeft) / breakTime) * 100;

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
        <div className="text-center px-8">
          <div className="text-6xl font-bold text-white mb-2">--:--</div>
          <div className="text-2xl text-white/90 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  const timerSize = styleSettings.timerSize || 120;
  const showProgress = styleSettings.showProgress !== false;
  const showStatus = styleSettings.showStatus !== false;
  const showCounter = styleSettings.showCounter !== false;
  const boldTimer = styleSettings.boldTimer !== false;
  const renderBackground = styleSettings.renderBackground === true;
  const backgroundColor = styleSettings.backgroundColor || '#000000';
  const paddingX = styleSettings.paddingX || 32;
  const paddingY = styleSettings.paddingY || 24;
  const borderRadius = styleSettings.borderRadius || 16;
  const positionY = styleSettings.positionY || 50;
  const statusBarSize = styleSettings.statusBarSize || 48;
  const counterSize = styleSettings.counterSize || 32;
  const layoutDirection = styleSettings.layoutDirection || 'vertical';
  const progressBarWidth = styleSettings.progressBarWidth || 300;
  const progressBarHeight = styleSettings.progressBarHeight || 24;
  const timeFormat = styleSettings.timeFormat || 'colon';

  // Color settings
  const timerColor = styleSettings.timerColor || '#FFFFFF';
  const statusColor = styleSettings.statusColor || '#FFFFFF';
  const counterColor = styleSettings.counterColor || '#FFFFFF';
  const progressActiveColor = styleSettings.progressActiveColor;
  const progressPassiveColor = styleSettings.progressPassiveColor;

  // Format time based on selected format
  const formatTime = (mins: number, secs: number) => {
    const totalSeconds = mins * 60 + secs;
    switch (timeFormat) {
      case 'seconds':
        return `${totalSeconds}s`;
      case 'units':
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      case 'colon':
      default:
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const formattedTime = formatTime(minutes, seconds);

  // MINIMAL - Clean, simple with Google Fonts
  if (style === 'minimal') {
    const font = styleSettings.font || 'Inter';
    const subFont = styleSettings.subFont || font;
    const accentColor = styleSettings.accentColor || '#10B981';
    const progressActive = progressActiveColor || accentColor;
    const progressPassive = progressPassiveColor || '#FFFFFF';

    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=${subFont.replace(' ', '+')}:wght@400;600;700&display=swap');
        `}</style>
        <div
          className="w-full h-screen flex justify-center relative"
          style={{
            backgroundColor: 'transparent',
            fontFamily: `'${font}', sans-serif`,
            padding: '4rem',
            alignItems: positionY < 33 ? 'flex-start' : positionY > 66 ? 'flex-end' : 'center'
          }}
        >
          {showPromo && (
            <div className="absolute inset-0 flex items-center justify-center z-50 animate-in fade-in duration-500">
              <div className="text-center px-8 py-12 rounded-3xl" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                <div className="text-4xl font-bold mb-4" style={{ color: accentColor }}>Want to do this yourself?</div>
                <div className="text-6xl font-bold text-white mb-4">ss-overlay.com</div>
                <div className="text-3xl text-white/80">100% Free</div>
              </div>
            </div>
          )}
          {showCelebration && (
            <div className="absolute inset-0 flex items-center justify-center z-50 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="text-8xl mb-4 animate-bounce">🎉</div>
                <div className="text-5xl font-bold mb-2" style={{ color: timerColor }}>Goal Reached!</div>
                <div className="text-3xl opacity-90" style={{ color: timerColor }}>{state.pomodorosCompleted} / {goal}</div>
              </div>
            </div>
          )}
          <div
            className={layoutDirection === 'horizontal' ? 'flex items-center gap-6' : 'text-center space-y-4'}
            style={{
              ...(renderBackground ? {
                backgroundColor,
                paddingLeft: `${paddingX}px`,
                paddingRight: `${paddingX}px`,
                paddingTop: `${paddingY}px`,
                paddingBottom: `${paddingY}px`,
                borderRadius: `${borderRadius}px`,
              } : {}),
              opacity: showPromo ? 0 : 1,
              transition: 'opacity 0.5s ease'
            }}
          >
            <div
              className="tracking-tight"
              style={{
                fontSize: `${timerSize * 0.8}px`,
                color: timerColor,
                letterSpacing: '-0.02em',
                fontWeight: boldTimer ? 'bold' : 'normal',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {formattedTime}
            </div>
            {layoutDirection === 'horizontal' && (showStatus || showCounter || showProgress) && (
              <div className="flex flex-col gap-2 items-start">
                {showStatus && (
                  <div
                    className="font-semibold flex items-center gap-2 whitespace-nowrap"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      color: statusColor,
                      opacity: 0.9,
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: state.isPaused ? '#F59E0B' : accentColor,
                        animation: state.isPaused ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}
                    />
                    {state.isPaused ? 'Paused' : state.isWorking ? 'Focus Time' : 'Break'}
                  </div>
                )}
                {showCounter && (state.pomodorosCompleted > 0 || goal) && (
                  <div
                    className="font-medium whitespace-nowrap"
                    style={{
                      fontSize: `${counterSize}px`,
                      color: counterColor,
                      opacity: 0.7,
                      fontFamily: `'${subFont}', sans-serif`,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {goal ? `${state.pomodorosCompleted} / ${goal} completed` : `${state.pomodorosCompleted} completed`}
                  </div>
                )}
                {showProgress && (
                  <div
                    className="rounded-full overflow-hidden"
                    style={{
                      width: `${progressBarWidth}px`,
                      height: `${progressBarHeight}px`,
                      backgroundColor: progressPassive
                    }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: progressActive
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {layoutDirection === 'vertical' && (
              <>
                {showStatus && (
                  <div
                    className="font-semibold flex items-center justify-center gap-2"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      color: statusColor,
                      
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: state.isPaused ? '#F59E0B' : accentColor,
                        animation: state.isPaused ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}
                    />
                    {state.isPaused ? 'Paused' : state.isWorking ? 'Focus Time' : 'Break'}
                  </div>
                )}
                {showCounter && (state.pomodorosCompleted > 0 || goal) && (
                  <div
                    className="font-medium"
                    style={{
                      fontSize: `${counterSize}px`,
                      color: counterColor,
                      
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    {goal ? `${state.pomodorosCompleted} / ${goal} completed` : `${state.pomodorosCompleted} completed`}
                  </div>
                )}
                {showProgress && (
                  <div
                    className="rounded-full overflow-hidden"
                    style={{
                      width: `${progressBarWidth}px`,
                      height: `${progressBarHeight}px`,
                      backgroundColor: progressPassive
                    }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: accentColor
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // GRADIENT - Bold, colorful, modern
  if (style === 'gradient') {
    const font = styleSettings.font || 'Poppins';
    const subFont = styleSettings.subFont || font;
    const scheme = styleSettings.gradientScheme || 'purple-pink';
    const schemes = {
      'purple-pink': ['#8B5CF6', '#EC4899'],
      'blue-cyan': ['#3B82F6', '#06B6D4'],
      'orange-red': ['#F59E0B', '#EF4444'],
      'green-teal': ['#10B981', '#14B8A6'],
    };
    const [color1, color2] = schemes[scheme as keyof typeof schemes];
    const animationSpeed = styleSettings.animationSpeed || 8;
    const progressActive = progressActiveColor || color1;
    const progressPassive = progressPassiveColor || "#FFFFFF";

    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@700;900&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=${subFont.replace(' ', '+')}:wght@400;600;700&display=swap');
        `}</style>
        <style jsx>{`
          @keyframes gradient-shift {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(3deg); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
        <div
          className="w-full h-screen flex justify-center relative overflow-hidden"
          style={{
            backgroundColor: 'transparent',
            fontFamily: `'${font}', sans-serif`,
            padding: '4rem',
            alignItems: positionY < 33 ? 'flex-start' : positionY > 66 ? 'flex-end' : 'center'
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${color1}, ${color2})`,
              opacity: 0.25,
              animation: `gradient-shift ${animationSpeed}s ease infinite`,
            }}
          />

          {showPromo && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="text-center px-12 py-16 rounded-3xl" style={{ background: `linear-gradient(135deg, ${color1}, ${color2})`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div className="text-5xl font-black text-white mb-6 uppercase tracking-wider">Want to do this yourself?</div>
                <div className="text-8xl font-black text-white mb-6">ss-overlay.com</div>
                <div className="text-4xl font-bold text-white/90">100% Free</div>
              </div>
            </div>
          )}

          {showCelebration && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="text-center" style={{ animation: 'float 3s ease-in-out infinite' }}>
                <div className="text-9xl mb-4">🎉</div>
                <div className="text-6xl font-black text-white mb-2">GOAL!</div>
                <div className="text-4xl font-bold text-white/90">{state.pomodorosCompleted}/{goal}</div>
              </div>
            </div>
          )}

          <div
            className={layoutDirection === 'horizontal' ? 'relative z-10 flex items-center gap-6' : 'relative z-10 text-center space-y-6'}
            style={{
              ...(renderBackground ? {
                backgroundColor,
                paddingLeft: `${paddingX}px`,
                paddingRight: `${paddingX}px`,
                paddingTop: `${paddingY}px`,
                paddingBottom: `${paddingY}px`,
                borderRadius: `${borderRadius}px`,
              } : {}),
              opacity: showPromo ? 0 : 1,
              transition: 'opacity 0.5s ease'
            }}
          >
            <div
              className="tracking-tighter"
              style={{
                fontSize: `${timerSize}px`,
                background: `linear-gradient(135deg, ${color1}, ${color2})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 0 80px ${color1}40`,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                fontWeight: boldTimer ? '900' : 'normal',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {formattedTime}
            </div>
            {layoutDirection === 'horizontal' && (showStatus || showCounter || showProgress) && (
              <div className="flex flex-col gap-3 items-start">
                {showStatus && (
                  <div
                    className="font-black uppercase tracking-widest inline-block px-6 py-3 rounded-xl text-white whitespace-nowrap"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      background: `linear-gradient(135deg, ${color1}, ${color2})`,
                      boxShadow: `0 10px 30px ${color1}40`,
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    {state.isPaused ? '⏸ PAUSED' : state.isWorking ? '🔥 FOCUS' : '☕ BREAK'}
                  </div>
                )}
                {showCounter && (state.pomodorosCompleted > 0 || goal) && (
                  <div
                    className="font-bold text-white whitespace-nowrap"
                    style={{
                      fontSize: `${counterSize}px`,
                      fontFamily: `'${subFont}', sans-serif`,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {goal ? `${state.pomodorosCompleted} / ${goal} DONE` : `${state.pomodorosCompleted} DONE`}
                  </div>
                )}
                {showProgress && (
                  <div
                    className="rounded-full overflow-hidden backdrop-blur-sm"
                    style={{
                      width: `${progressBarWidth}px`,
                      height: `${progressBarHeight}px`,
                      backgroundColor: progressPassive
                    }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        background: `linear-gradient(90deg, ${color1}, ${color2})`,
                        boxShadow: `0 0 20px ${color1}80`
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {layoutDirection === 'vertical' && (
              <>
                {showStatus && (
                  <div
                    className="font-black uppercase tracking-widest inline-block px-6 py-3 rounded-xl text-white"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      background: `linear-gradient(135deg, ${color1}, ${color2})`,
                      boxShadow: `0 10px 30px ${color1}40`,
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    {state.isPaused ? '⏸ PAUSED' : state.isWorking ? '🔥 FOCUS' : '☕ BREAK'}
                  </div>
                )}
                {showCounter && (state.pomodorosCompleted > 0 || goal) && (
                  <div
                    className="font-bold text-white"
                    style={{
                      fontSize: `${counterSize}px`,
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    {goal ? `${state.pomodorosCompleted} / ${goal} DONE` : `${state.pomodorosCompleted} DONE`}
                  </div>
                )}
                {showProgress && (
                  <div
                    className="rounded-full overflow-hidden backdrop-blur-sm"
                    style={{
                      width: `${progressBarWidth}px`,
                      height: `${progressBarHeight}px`,
                      backgroundColor: progressPassive
                    }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        background: `linear-gradient(90deg, ${color1}, ${color2})`,
                        boxShadow: `0 0 20px ${color1}80`
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // AMBIENT - Minimal, soft glow, elegant
  if (style === 'ambient') {
    const font = styleSettings.font || 'Space Grotesk';
    const subFont = styleSettings.subFont || font;
    const glowColor = styleSettings.glowColor || '#8B5CF6';
    const glowIntensity = styleSettings.glowIntensity || 40;
    const showGlow = styleSettings.showGlow !== false;
    const progressActive = progressActiveColor || glowColor;
    const progressPassive = progressPassiveColor || "#FFFFFF";

    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@300;400;500&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=${subFont.replace(' ', '+')}:wght@300;400;500&display=swap');
        `}</style>
        <div
          className="w-full h-screen flex justify-center relative"
          style={{
            backgroundColor: 'transparent',
            fontFamily: `'${font}', sans-serif`,
            padding: '4rem',
            alignItems: positionY < 33 ? 'flex-start' : positionY > 66 ? 'flex-end' : 'center'
          }}
        >
          {showGlow && (
            <div
              className="absolute inset-0 flex items-center justify-center blur-3xl"
              style={{
                background: `radial-gradient(circle at center, ${glowColor}60 0%, transparent 60%)`,
                opacity: 0.5,
              }}
            />
          )}

          {showPromo && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="text-center px-10 py-14 rounded-3xl" style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', border: `2px solid ${glowColor}`, boxShadow: `0 0 60px ${glowColor}80` }}>
                <div className="text-3xl font-light text-white/80 mb-6 tracking-widest uppercase">Want to do this yourself?</div>
                <div className="text-7xl font-light text-white mb-6" style={{ textShadow: showGlow ? `0 0 40px ${glowColor}` : 'none' }}>ss-overlay.com</div>
                <div className="text-3xl font-light text-white/70">100% Free</div>
              </div>
            </div>
          )}

          {showCelebration && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="text-8xl mb-4">✨</div>
                <div className="text-5xl font-light text-white mb-2">Complete</div>
                <div className="text-3xl text-white/80">{state.pomodorosCompleted}/{goal}</div>
              </div>
            </div>
          )}

          <div
            className={layoutDirection === 'horizontal' ? 'relative z-10 flex items-center gap-6' : 'relative z-10 text-center space-y-6'}
            style={{
              ...(renderBackground ? {
                backgroundColor,
                paddingLeft: `${paddingX}px`,
                paddingRight: `${paddingX}px`,
                paddingTop: `${paddingY}px`,
                paddingBottom: `${paddingY}px`,
                borderRadius: `${borderRadius}px`,
              } : {}),
              opacity: showPromo ? 0 : 1,
              transition: 'opacity 0.5s ease'
            }}
          >
            <div
              className="text-white tracking-wide"
              style={{
                fontSize: `${timerSize * 1.1}px`,
                textShadow: showGlow ? `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2}px ${glowColor}60` : 'none',
                letterSpacing: '0.05em',
                fontWeight: boldTimer ? 'bold' : '300',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {formattedTime}
            </div>
            {layoutDirection === 'horizontal' && (showStatus || showCounter || showProgress) && (
              <div className="flex flex-col gap-2 items-start">
                {showStatus && (
                  <div
                    className="font-light text-white/90 tracking-widest uppercase whitespace-nowrap"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    {state.isPaused ? 'Paused' : state.isWorking ? 'Focus' : 'Rest'}
                  </div>
                )}
                {showCounter && (state.pomodorosCompleted > 0 || goal) && (
                  <div
                    className="font-light text-white/70 whitespace-nowrap"
                    style={{
                      fontSize: `${counterSize}px`,
                      fontFamily: `'${subFont}', sans-serif`,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {goal ? `${state.pomodorosCompleted} of ${goal}` : `${state.pomodorosCompleted}`}
                  </div>
                )}
                {showProgress && (
                  <div
                    className="rounded-full overflow-hidden"
                    style={{
                      width: `${progressBarWidth}px`,
                      height: `${progressBarHeight}px`,
                      backgroundColor: progressPassive
                    }}
                  >
                    <div
                      className="h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: glowColor,
                        boxShadow: showGlow ? `0 0 ${glowIntensity * 0.7}px ${glowColor}` : 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {layoutDirection === 'vertical' && (
              <>
                {showStatus && (
                  <div
                    className="font-light text-white/90 tracking-widest uppercase"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    {state.isPaused ? 'Paused' : state.isWorking ? 'Focus' : 'Rest'}
                  </div>
                )}
                {showCounter && (state.pomodorosCompleted > 0 || goal) && (
                  <div
                    className="font-light text-white/70"
                    style={{
                      fontSize: `${counterSize}px`,
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    {goal ? `${state.pomodorosCompleted} of ${goal}` : `${state.pomodorosCompleted}`}
                  </div>
                )}
                {showProgress && (
                  <div
                    className="rounded-full overflow-hidden"
                    style={{
                      width: `${progressBarWidth}px`,
                      height: `${progressBarHeight}px`,
                      backgroundColor: progressPassive
                    }}
                  >
                    <div
                      className="h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: glowColor,
                        boxShadow: showGlow ? `0 0 ${glowIntensity * 0.7}px ${glowColor}` : 'none'
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // FOCUS - High contrast, bold, impactful
  if (style === 'focus') {
    const font = styleSettings.font || 'Outfit';
    const subFont = styleSettings.subFont || font;
    const accentColor = styleSettings.accentColor || '#F59E0B';
    const strokeWidth = styleSettings.strokeWidth || 2;
    const showShadow = styleSettings.showShadow !== false;
    const progressActive = progressActiveColor || accentColor;
    const progressPassive = progressPassiveColor || "#FFFFFF";

    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@800;900&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=${subFont.replace(' ', '+')}:wght@600;700;800&display=swap');
        `}</style>
        <div
          className="w-full h-screen flex justify-center relative"
          style={{
            backgroundColor: 'transparent',
            fontFamily: `'${font}', sans-serif`,
            padding: '4rem',
            alignItems: positionY < 33 ? 'flex-start' : positionY > 66 ? 'flex-end' : 'center'
          }}
        >
          {showPromo && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="text-center px-12 py-16 rounded-3xl" style={{ backgroundColor: 'rgba(0,0,0,0.95)', border: `4px solid ${accentColor}`, boxShadow: showShadow ? `8px 8px 0px rgba(0,0,0,0.3)` : 'none' }}>
                <div className="text-5xl font-black text-white mb-8 uppercase tracking-wider">Want to do this yourself?</div>
                <div className="text-8xl font-black mb-8 tracking-tighter" style={{ color: accentColor, WebkitTextStroke: `${strokeWidth}px white`, textShadow: showShadow ? '6px 6px 0px rgba(0,0,0,0.3)' : 'none' }}>ss-overlay.com</div>
                <div className="text-5xl font-black text-white uppercase">100% Free</div>
              </div>
            </div>
          )}

          {showCelebration && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="text-9xl mb-4">🎯</div>
                <div
                  className="text-7xl font-black uppercase tracking-tighter mb-3"
                  style={{
                    color: accentColor,
                    WebkitTextStroke: `${strokeWidth}px white`,
                    textShadow: showShadow ? '6px 6px 0px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  DONE!
                </div>
                <div className="text-5xl font-black" style={{ color: accentColor }}>
                  {state.pomodorosCompleted}/{goal}
                </div>
              </div>
            </div>
          )}

          <div
            className={layoutDirection === 'horizontal' ? 'relative z-10 flex items-center gap-8' : 'relative z-10 text-center space-y-8'}
            style={{
              ...(renderBackground ? {
                backgroundColor,
                paddingLeft: `${paddingX}px`,
                paddingRight: `${paddingX}px`,
                paddingTop: `${paddingY}px`,
                paddingBottom: `${paddingY}px`,
                borderRadius: `${borderRadius}px`,
              } : {}),
              opacity: showPromo ? 0 : 1,
              transition: 'opacity 0.5s ease'
            }}
          >
            <div
              className="tracking-tighter"
              style={{
                fontSize: `${timerSize * 1.2}px`,
                color: accentColor,
                WebkitTextStroke: `${strokeWidth}px white`,
                textShadow: showShadow ? '6px 6px 0px rgba(0,0,0,0.3)' : 'none',
                letterSpacing: '-0.05em',
                fontWeight: boldTimer ? '900' : 'normal',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {formattedTime}
            </div>
            {layoutDirection === 'horizontal' && (showStatus || showCounter || showProgress) && (
              <div className="flex flex-col gap-4 items-start">
                {showStatus && (
                  <div
                    className="inline-block px-8 py-4 font-black uppercase tracking-wider text-white rounded-2xl whitespace-nowrap"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      backgroundColor: accentColor,
                      boxShadow: showShadow ? `6px 6px 0px rgba(0,0,0,0.2)` : 'none',
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    {state.isPaused ? '⏸ PAUSE' : state.isWorking ? '⚡ GO' : '☕ REST'}
                  </div>
                )}
                {showCounter && (state.pomodorosCompleted > 0 || goal) && (
                  <div
                    className="font-black text-white"
                    style={{
                      fontSize: `${counterSize}px`,
                      fontFamily: `'${subFont}', sans-serif`,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {goal ? `${state.pomodorosCompleted}/${goal} DONE` : `${state.pomodorosCompleted} DONE`}
                  </div>
                )}
                {showProgress && (
                  <div
                    className="rounded-full overflow-hidden"
                    style={{
                      width: `${progressBarWidth}px`,
                      height: `${progressBarHeight}px`,
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      boxShadow: showShadow ? '4px 4px 0px rgba(0,0,0,0.2)' : 'none',
                      border: '3px solid white'
                    }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: accentColor
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            {layoutDirection === 'vertical' && (
              <>
                {showStatus && (
                  <div
                    className="inline-block px-8 py-4 font-black uppercase tracking-wider text-white rounded-2xl whitespace-nowrap"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      backgroundColor: accentColor,
                      boxShadow: showShadow ? `6px 6px 0px rgba(0,0,0,0.2)` : 'none',
                      fontFamily: `'${subFont}', sans-serif`
                    }}
                  >
                    {state.isPaused ? '⏸ PAUSE' : state.isWorking ? '⚡ GO' : '☕ REST'}
                  </div>
                )}
                {showCounter && (state.pomodorosCompleted > 0 || goal) && (
                  <div
                    className="font-black text-white"
                    style={{
                      fontSize: `${counterSize}px`,
                      fontFamily: `'${subFont}', sans-serif`,
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {goal ? `${state.pomodorosCompleted}/${goal} DONE` : `${state.pomodorosCompleted} DONE`}
                  </div>
                )}
                {showProgress && (
                  <div
                    className="rounded-full overflow-hidden mx-auto"
                    style={{
                      width: `${progressBarWidth}px`,
                      height: `${progressBarHeight}px`,
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      boxShadow: showShadow ? '4px 4px 0px rgba(0,0,0,0.2)' : 'none',
                      border: '3px solid white'
                    }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: accentColor
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return null;
}
