'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { StudyGoal } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/client';

interface GoalsManagerProps {
  widgetId: string;
  userId: string;
}

export default function GoalsManager({ widgetId, userId }: GoalsManagerProps) {
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetValue: 10,
    currentValue: 0,
    unit: 'chapters',
    goalType: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    endDate: '',
  });

  // Fetch goals
  useEffect(() => {
    fetchGoals();
  }, [widgetId]);

  const fetchGoals = async () => {
    try {
      const response = await fetch(`/api/goals?widgetId=${widgetId}`);
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`goals-manager-${widgetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_goals',
          filter: `widget_id=eq.${widgetId}`,
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [widgetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (editingGoalId) {
      // Update existing goal
      await handleUpdateGoal(editingGoalId, formData);
    } else {
      // Create new goal
      try {
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId,
            ...formData,
            endDate: formData.endDate || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create goal');
        }

        // Fetch goals immediately after creation
        await fetchGoals();
        resetForm();
        setShowAddForm(false);
      } catch (error: any) {
        console.error('Failed to create goal:', error);
        setError(error.message || 'Failed to create goal');
      }
    }
    setIsSubmitting(false);
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<typeof formData>) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          updates,
        }),
      });

      if (response.ok) {
        await fetchGoals();
        resetForm();
        setEditingGoalId(null);
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const handleUpdateProgress = async (goalId: string, newValue: number) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          updates: { currentValue: newValue },
        }),
      });

      if (response.ok) {
        await fetchGoals();
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Delete this goal?')) return;

    try {
      const response = await fetch(`/api/goals?goalId=${goalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchGoals();
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const startEditing = (goal: StudyGoal) => {
    setFormData({
      title: goal.title,
      description: goal.description || '',
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      goalType: goal.goalType as any,
      endDate: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
    });
    setEditingGoalId(goal.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetValue: 10,
      currentValue: 0,
      unit: 'chapters',
      goalType: 'daily',
      endDate: '',
    });
    setEditingGoalId(null);
  };

  const getProgressPercentage = (goal: StudyGoal) => {
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  };

  if (isLoading) {
    return <div className="p-4 text-center text-slate-600">Loading goals...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Manage Goals</h3>
        <Button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          size="sm"
        >
          {showAddForm ? 'Cancel' : '+ Add Goal'}
        </Button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Goal Title*
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Read 5 chapters"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details about this goal..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target*
                </label>
                <input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) =>
                    setFormData({ ...formData, targetValue: parseInt(e.target.value) })
                  }
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit*</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., chapters, problems"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Goal Type*
                </label>
                <select
                  value={formData.goalType}
                  onChange={(e) =>
                    setFormData({ ...formData, goalType: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deadline (optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {editingGoalId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Current Progress*
                </label>
                <input
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) =>
                    setFormData({ ...formData, currentValue: parseInt(e.target.value) })
                  }
                  min="0"
                  max={formData.targetValue}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingGoalId ? 'Update Goal' : 'Create Goal'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                  setEditingGoalId(null);
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No goals yet. Click "Add Goal" to create your first one!
          </div>
        )}

        <AnimatePresence>
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal);
            const isCompleted = goal.isCompleted === 1;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`p-4 rounded-lg border ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      {goal.title}
                      {isCompleted && <span className="text-green-600">✓</span>}
                    </h4>
                    {goal.description && (
                      <p className="text-sm text-slate-600 mt-1">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditing(goal)}
                      className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                    <span className="font-semibold text-purple-600">{progress}%</span>
                  </div>

                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {!isCompleted && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateProgress(goal.id, Math.max(0, goal.currentValue - 1))
                        }
                        className="h-7 text-xs"
                      >
                        -1
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdateProgress(
                            goal.id,
                            Math.min(goal.targetValue, goal.currentValue + 1)
                          )
                        }
                        className="flex-1 h-7 text-xs"
                      >
                        +1 {goal.unit}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateProgress(
                            goal.id,
                            Math.min(goal.targetValue, goal.currentValue + 5)
                          )
                        }
                        className="h-7 text-xs"
                      >
                        +5
                      </Button>
                    </div>
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
