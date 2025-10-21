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
}

export default function PomodoroClient({ workingTime: initialWorkingTime, restTime: initialRestTime, widgetId, initialState, pomodoroGoal: initialPomodoroGoal, style: initialStyle = 'minimal', styleSettings: initialStyleSettings = {} }: PomodoroClientProps) {
  const [workingTime, setWorkingTime] = useState(initialWorkingTime);
  const [restTime, setRestTime] = useState(initialRestTime);
  const [pomodoroGoal, setPomodoroGoal] = useState(initialPomodoroGoal);
  const [style, setStyle] = useState(initialStyle);
  const [styleSettings, setStyleSettings] = useState(initialStyleSettings);

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

  const supabase = createClient();

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

      if (goal && newPomodorosCompleted >= goal && newPomodorosCompleted > state.pomodorosCompleted) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }

      updateWidgetState(newState);
    }
  }, [state, isLoading, calculateTimeLeft, workTime, breakTime, goal, updateWidgetState]);

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
  const statusBarSize = styleSettings.statusBarSize || 24;
  const counterSize = styleSettings.counterSize || 16;
  const layoutDirection = styleSettings.layoutDirection || 'vertical';
  const progressBarWidth = styleSettings.progressBarWidth || 300;

  // MINIMAL - Clean, simple with Google Fonts
  if (style === 'minimal') {
    const font = styleSettings.font || 'Inter';
    const subFont = styleSettings.subFont || font;
    const textColor = styleSettings.textColor || '#FFFFFF';
    const accentColor = styleSettings.accentColor || '#10B981';

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
          {showCelebration && (
            <div className="absolute inset-0 flex items-center justify-center z-50 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="text-8xl mb-4 animate-bounce">🎉</div>
                <div className="text-5xl font-bold mb-2" style={{ color: textColor }}>Goal Reached!</div>
                <div className="text-3xl opacity-90" style={{ color: textColor }}>{state.pomodorosCompleted} / {goal}</div>
              </div>
            </div>
          )}
          <div
            className={layoutDirection === 'horizontal' ? 'flex items-center gap-6' : 'text-center space-y-4'}
            style={renderBackground ? {
              backgroundColor,
              paddingLeft: `${paddingX}px`,
              paddingRight: `${paddingX}px`,
              paddingTop: `${paddingY}px`,
              paddingBottom: `${paddingY}px`,
              borderRadius: `${borderRadius}px`,
            } : {}}
          >
            <div
              className="tracking-tight"
              style={{
                fontSize: `${timerSize * 0.8}px`,
                color: textColor,
                letterSpacing: '-0.02em',
                fontWeight: boldTimer ? 'bold' : 'normal'
              }}
            >
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            {layoutDirection === 'horizontal' && (showStatus || showCounter || showProgress) && (
              <div className="flex flex-col gap-2">
                {showStatus && (
                  <div
                    className="font-semibold flex items-center gap-2"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      color: textColor,
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
                    className="font-medium"
                    style={{
                      fontSize: `${counterSize}px`,
                      color: textColor,
                      opacity: 0.7,
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
                      height: `${timerSize * 0.04}px`,
                      backgroundColor: 'rgba(255,255,255,0.2)'
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
                    className="font-semibold flex items-center justify-center gap-2"
                    style={{
                      fontSize: `${statusBarSize}px`,
                      color: textColor,
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
                    className="font-medium"
                    style={{
                      fontSize: `${counterSize}px`,
                      color: textColor,
                      opacity: 0.7,
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
                      height: `${timerSize * 0.04}px`,
                      backgroundColor: 'rgba(255,255,255,0.2)'
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
            style={renderBackground ? {
              backgroundColor,
              paddingLeft: `${paddingX}px`,
              paddingRight: `${paddingX}px`,
              paddingTop: `${paddingY}px`,
              paddingBottom: `${paddingY}px`,
              borderRadius: `${borderRadius}px`,
            } : {}}
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
                fontWeight: boldTimer ? '900' : 'normal'
              }}
            >
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            {layoutDirection === 'horizontal' && (showStatus || showCounter || showProgress) && (
              <div className="flex flex-col gap-3">
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
                      height: `${timerSize * 0.06}px`,
                      backgroundColor: 'rgba(255,255,255,0.2)'
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
                      height: `${timerSize * 0.06}px`,
                      backgroundColor: 'rgba(255,255,255,0.2)'
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
            style={renderBackground ? {
              backgroundColor,
              paddingLeft: `${paddingX}px`,
              paddingRight: `${paddingX}px`,
              paddingTop: `${paddingY}px`,
              paddingBottom: `${paddingY}px`,
              borderRadius: `${borderRadius}px`,
            } : {}}
          >
            <div
              className="text-white tracking-wide"
              style={{
                fontSize: `${timerSize * 1.1}px`,
                textShadow: showGlow ? `0 0 ${glowIntensity}px ${glowColor}, 0 0 ${glowIntensity * 2}px ${glowColor}60` : 'none',
                letterSpacing: '0.05em',
                fontWeight: boldTimer ? 'bold' : '300'
              }}
            >
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            {layoutDirection === 'horizontal' && (showStatus || showCounter || showProgress) && (
              <div className="flex flex-col gap-2">
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
                      height: `${timerSize * 0.03}px`,
                      backgroundColor: 'rgba(255,255,255,0.1)'
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
                      height: `${timerSize * 0.03}px`,
                      backgroundColor: 'rgba(255,255,255,0.1)'
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
            style={renderBackground ? {
              backgroundColor,
              paddingLeft: `${paddingX}px`,
              paddingRight: `${paddingX}px`,
              paddingTop: `${paddingY}px`,
              paddingBottom: `${paddingY}px`,
              borderRadius: `${borderRadius}px`,
            } : {}}
          >
            <div
              className="tracking-tighter"
              style={{
                fontSize: `${timerSize * 1.2}px`,
                color: accentColor,
                WebkitTextStroke: `${strokeWidth}px white`,
                textShadow: showShadow ? '6px 6px 0px rgba(0,0,0,0.3)' : 'none',
                letterSpacing: '-0.05em',
                fontWeight: boldTimer ? '900' : 'normal'
              }}
            >
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            {layoutDirection === 'horizontal' && (showStatus || showCounter || showProgress) && (
              <div className="flex flex-col gap-4">
                {showStatus && (
                  <div
                    className="inline-block px-8 py-4 font-black uppercase tracking-wider text-white rounded-2xl"
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
                      fontFamily: `'${subFont}', sans-serif`
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
                      height: `${timerSize * 0.08}px`,
                      backgroundColor: 'rgba(255,255,255,0.3)',
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
                    className="inline-block px-8 py-4 font-black uppercase tracking-wider text-white rounded-2xl"
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
                      fontFamily: `'${subFont}', sans-serif`
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
                      height: `${timerSize * 0.08}px`,
                      backgroundColor: 'rgba(255,255,255,0.3)',
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
