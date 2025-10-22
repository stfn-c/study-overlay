'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyGoal } from '@/lib/db/schema';
import { goalsService } from '@/lib/services/goals';
import { createClient } from '@/lib/supabase/client';

interface GoalsClientProps {
  widgetId: string;
  initialGoals?: StudyGoal[];
  styleSettings?: {
    displayStyle?: 'minimal' | 'modern' | 'cards';
    fontFamily?: string;
    fontSize?: number;
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    showStats?: boolean;
    showDescription?: boolean;
    showDeadline?: boolean;
    animateProgress?: boolean;
  };
}

export default function GoalsClient({ widgetId, initialGoals = [], styleSettings = {} }: GoalsClientProps) {
  const [goals, setGoals] = useState<StudyGoal[]>(initialGoals);
  const [celebratingGoalId, setCelebratingGoalId] = useState<string | null>(null);
  const supabase = createClient();

  const {
    displayStyle = 'modern',
    fontFamily = 'Inter',
    fontSize = 16,
    primaryColor = '#8B5CF6',
    secondaryColor = '#10b981',
    backgroundColor = '#ffffff',
    showStats = true,
    showDescription = true,
    showDeadline = true,
    animateProgress = true,
  } = styleSettings;

  // Fetch goals on mount
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await goalsService.getGoals(widgetId);
        setGoals(data);
      } catch (error) {
        console.error('Failed to load goals:', error);
      }
    };

    fetchGoals();
  }, [widgetId]);

  // Real-time updates via Supabase
  useEffect(() => {
    const mapGoal = (rawGoal: any): StudyGoal => ({
      id: rawGoal.id,
      widgetId: rawGoal.widget_id,
      userId: rawGoal.user_id,
      title: rawGoal.title,
      description: rawGoal.description,
      targetValue: rawGoal.target_value,
      currentValue: rawGoal.current_value,
      unit: rawGoal.unit,
      goalType: rawGoal.goal_type,
      startDate: rawGoal.start_date,
      endDate: rawGoal.end_date,
      isCompleted: rawGoal.is_completed,
      completedAt: rawGoal.completed_at,
      createdAt: rawGoal.created_at,
      updatedAt: rawGoal.updated_at,
    });

    const channel = supabase
      .channel(`goals-${widgetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_goals',
          filter: `widget_id=eq.${widgetId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setGoals((prev) => [mapGoal(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const mappedGoal = mapGoal(payload.new);
            setGoals((prev) =>
              prev.map((goal) =>
                goal.id === mappedGoal.id ? mappedGoal : goal
              )
            );

            // Trigger celebration if goal just completed
            if (mappedGoal.isCompleted === 1) {
              setCelebratingGoalId(mappedGoal.id);
              setTimeout(() => setCelebratingGoalId(null), 3000);
            }
          } else if (payload.eventType === 'DELETE') {
            setGoals((prev) => prev.filter((goal) => goal.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [widgetId, supabase]);

  const getProgressPercentage = (goal: StudyGoal) => {
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  };

  const getTimeRemaining = (goal: StudyGoal) => {
    if (!goal.endDate) return null;

    const now = new Date();
    const end = new Date(goal.endDate);
    const diff = end.getTime() - now.getTime();

    if (diff < 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return 'Due soon';
  };

  const activeGoals = goals.filter(g => g.isCompleted === 0);
  const completedGoals = goals.filter(g => g.isCompleted === 1);
  const completionRate = goals.length > 0
    ? Math.round((completedGoals.length / goals.length) * 100)
    : 0;

  if (activeGoals.length === 0 && completedGoals.length === 0) {
    return (
      <div
        style={{
          fontFamily,
          backgroundColor,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: fontSize + 4, fontWeight: 600, marginBottom: '0.5rem' }}>
            No goals yet
          </p>
          <p style={{ fontSize: fontSize - 2 }}>
            Create your first study goal to get started
          </p>
        </div>
      </div>
    );
  }

  // Minimal Style
  if (displayStyle === 'minimal') {
    return (
      <div
        style={{
          fontFamily,
          backgroundColor,
          minHeight: '100vh',
          padding: '2rem',
        }}
      >
        {showStats && goals.length > 0 && (
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: fontSize + 8, fontWeight: 700, color: primaryColor }}>
              {completionRate}%
            </div>
            <div style={{ fontSize: fontSize - 2, color: '#64748b', marginTop: '0.25rem' }}>
              {completedGoals.length} of {goals.length} goals completed
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {activeGoals.map((goal) => {
              const progress = getProgressPercentage(goal);
              const isCelebrating = celebratingGoalId === goal.id;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isCelebrating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 100%)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '0.25rem'
                    }}>
                      <h3 style={{
                        fontSize: fontSize + 2,
                        fontWeight: 600,
                        color: '#1e293b',
                        margin: 0
                      }}>
                        {goal.title}
                      </h3>
                      <span style={{
                        fontSize: fontSize - 2,
                        fontWeight: 500,
                        color: primaryColor
                      }}>
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                    </div>

                    {showDescription && goal.description && (
                      <p style={{
                        fontSize: fontSize - 2,
                        color: '#64748b',
                        margin: '0.25rem 0 0 0'
                      }}>
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <div style={{
                    height: '8px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: animateProgress ? 0.5 : 0, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        backgroundColor: primaryColor,
                        borderRadius: '999px',
                      }}
                    />
                  </div>

                  {showDeadline && goal.endDate && (
                    <div style={{
                      fontSize: fontSize - 3,
                      color: '#64748b',
                      marginTop: '0.25rem'
                    }}>
                      {getTimeRemaining(goal)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Modern Style
  if (displayStyle === 'modern') {
    return (
      <div
        style={{
          fontFamily,
          backgroundColor,
          minHeight: '100vh',
          padding: '2.5rem',
        }}
      >
        {showStats && goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '2.5rem',
              padding: '1.5rem',
              background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}15 100%)`,
              borderRadius: '16px',
              border: `2px solid ${primaryColor}30`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: fontSize + 10, fontWeight: 700, color: primaryColor }}>
                  {completionRate}%
                </div>
                <div style={{ fontSize: fontSize - 1, color: '#64748b', marginTop: '0.25rem' }}>
                  Completion Rate
                </div>
              </div>
              <div>
                <div style={{ fontSize: fontSize + 10, fontWeight: 700, color: secondaryColor }}>
                  {completedGoals.length}
                </div>
                <div style={{ fontSize: fontSize - 1, color: '#64748b', marginTop: '0.25rem' }}>
                  Completed
                </div>
              </div>
              <div>
                <div style={{ fontSize: fontSize + 10, fontWeight: 700, color: '#f59e0b' }}>
                  {activeGoals.length}
                </div>
                <div style={{ fontSize: fontSize - 1, color: '#64748b', marginTop: '0.25rem' }}>
                  In Progress
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AnimatePresence>
            {activeGoals.map((goal) => {
              const progress = getProgressPercentage(goal);
              const isCelebrating = celebratingGoalId === goal.id;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    scale: isCelebrating ? 1.02 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    padding: '1.5rem',
                    background: isCelebrating
                      ? `linear-gradient(135deg, ${secondaryColor}20 0%, ${secondaryColor}10 100%)`
                      : '#ffffff',
                    borderRadius: '16px',
                    border: isCelebrating
                      ? `2px solid ${secondaryColor}`
                      : '2px solid #e2e8f0',
                    boxShadow: isCelebrating
                      ? '0 10px 30px rgba(16, 185, 129, 0.2)'
                      : '0 4px 6px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isCelebrating && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 1 }}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '4rem',
                      }}
                    >
                      🎉
                    </motion.div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                      gap: '1rem',
                    }}>
                      <h3 style={{
                        fontSize: fontSize + 4,
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: 0,
                        flex: 1,
                      }}>
                        {goal.title}
                      </h3>
                      <div style={{
                        fontSize: fontSize,
                        fontWeight: 700,
                        color: primaryColor,
                        background: `${primaryColor}15`,
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                      }}>
                        {goal.currentValue} / {goal.targetValue}
                      </div>
                    </div>

                    {showDescription && goal.description && (
                      <p style={{
                        fontSize: fontSize - 1,
                        color: '#64748b',
                        margin: 0,
                        lineHeight: 1.5,
                      }}>
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                      fontSize: fontSize - 2,
                    }}>
                      <span style={{ color: '#64748b' }}>{goal.unit}</span>
                      <span style={{ fontWeight: 600, color: primaryColor }}>
                        {progress}%
                      </span>
                    </div>
                    <div style={{
                      height: '12px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: animateProgress ? 0.6 : 0, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>

                  {showDeadline && goal.endDate && (
                    <div style={{
                      fontSize: fontSize - 2,
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <span>⏰</span>
                      <span>{getTimeRemaining(goal)}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Cards Style
  if (displayStyle === 'cards') {
    return (
      <div
        style={{
          fontFamily,
          backgroundColor,
          minHeight: '100vh',
          padding: '2rem',
        }}
      >
        {showStats && goals.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            <div style={{
              padding: '1.25rem',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
              borderRadius: '12px',
              color: '#ffffff',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: fontSize + 12, fontWeight: 800 }}>
                {completionRate}%
              </div>
              <div style={{ fontSize: fontSize - 2, opacity: 0.9, marginTop: '0.25rem' }}>
                Success Rate
              </div>
            </div>
            <div style={{
              padding: '1.25rem',
              background: `linear-gradient(135deg, ${secondaryColor} 0%, ${secondaryColor}dd 100%)`,
              borderRadius: '12px',
              color: '#ffffff',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: fontSize + 12, fontWeight: 800 }}>
                {completedGoals.length}
              </div>
              <div style={{ fontSize: fontSize - 2, opacity: 0.9, marginTop: '0.25rem' }}>
                Completed
              </div>
            </div>
            <div style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #f59e0bdd 100%)',
              borderRadius: '12px',
              color: '#ffffff',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: fontSize + 12, fontWeight: 800 }}>
                {activeGoals.length}
              </div>
              <div style={{ fontSize: fontSize - 2, opacity: 0.9, marginTop: '0.25rem' }}>
                Active
              </div>
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          <AnimatePresence>
            {activeGoals.map((goal) => {
              const progress = getProgressPercentage(goal);
              const isCelebrating = celebratingGoalId === goal.id;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: isCelebrating ? 1.05 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    padding: '1.5rem',
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: isCelebrating ? `3px solid ${secondaryColor}` : '2px solid #e2e8f0',
                    boxShadow: isCelebrating
                      ? `0 20px 40px ${secondaryColor}40`
                      : '0 4px 12px rgba(0, 0, 0, 0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    }}
                  />

                  <h3 style={{
                    fontSize: fontSize + 2,
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 0.5rem 0',
                  }}>
                    {goal.title}
                  </h3>

                  {showDescription && goal.description && (
                    <p style={{
                      fontSize: fontSize - 2,
                      color: '#64748b',
                      margin: '0 0 1rem 0',
                      lineHeight: 1.4,
                    }}>
                      {goal.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}>
                    <span style={{ fontSize: fontSize - 1, color: '#64748b' }}>
                      Progress
                    </span>
                    <span style={{ fontSize: fontSize + 2, fontWeight: 700, color: primaryColor }}>
                      {progress}%
                    </span>
                  </div>

                  <div style={{
                    height: '10px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginBottom: '0.75rem',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: animateProgress ? 0.5 : 0, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                        borderRadius: '999px',
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: fontSize - 2,
                    color: '#64748b',
                  }}>
                    <span>
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                    {showDeadline && goal.endDate && (
                      <span>⏰ {getTimeRemaining(goal)}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return null;
}
