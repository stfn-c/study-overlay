import { createClient } from '@/lib/supabase/client';
import { StudyGoal, NewStudyGoal } from '@/lib/db/schema';

export const goalsService = {
  async getGoals(widgetId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('study_goals')
      .select('*')
      .eq('widget_id', widgetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch goals:', error);
      throw error;
    }

    return data || [];
  },

  async createGoal(goal: Omit<NewStudyGoal, 'id' | 'createdAt' | 'updatedAt'>) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('study_goals')
      .insert({
        widget_id: goal.widgetId,
        user_id: goal.userId,
        title: goal.title,
        description: goal.description,
        target_value: goal.targetValue,
        current_value: goal.currentValue || 0,
        unit: goal.unit,
        goal_type: goal.goalType,
        start_date: goal.startDate,
        end_date: goal.endDate,
        is_completed: goal.isCompleted || 0,
        completed_at: goal.completedAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create goal:', error);
      throw error;
    }

    return data;
  },

  async updateGoal(goalId: string, updates: Partial<StudyGoal>) {
    const supabase = createClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.targetValue !== undefined) updateData.target_value = updates.targetValue;
    if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.goalType !== undefined) updateData.goal_type = updates.goalType;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
    if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;

    const { error } = await supabase
      .from('study_goals')
      .update(updateData)
      .eq('id', goalId);

    if (error) {
      console.error('Failed to update goal:', error);
      throw error;
    }
  },

  async updateGoalProgress(goalId: string, currentValue: number) {
    const supabase = createClient();

    // Fetch the goal to check if it should be completed
    const { data: goal, error: fetchError } = await supabase
      .from('study_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch goal:', fetchError);
      throw fetchError;
    }

    const isCompleted = currentValue >= goal.target_value ? 1 : 0;
    const completedAt = isCompleted ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('study_goals')
      .update({
        current_value: currentValue,
        is_completed: isCompleted,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId);

    if (error) {
      console.error('Failed to update goal progress:', error);
      throw error;
    }

    return { isCompleted: isCompleted === 1, completedAt };
  },

  async deleteGoal(goalId: string) {
    const supabase = createClient();

    const { error } = await supabase
      .from('study_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error('Failed to delete goal:', error);
      throw error;
    }
  },

  async getCompletionStats(widgetId: string, timeframe: 'today' | 'week' | 'month' | 'all' = 'all') {
    const supabase = createClient();

    let query = supabase
      .from('study_goals')
      .select('*')
      .eq('widget_id', widgetId);

    // Filter by timeframe
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch completion stats:', error);
      throw error;
    }

    const total = data?.length || 0;
    const completed = data?.filter(g => g.is_completed === 1).length || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress: total - completed,
      completionRate,
    };
  },
};
