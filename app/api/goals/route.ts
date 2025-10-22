import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Fetch goals for a widget
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const widgetId = searchParams.get('widgetId');

  if (!widgetId) {
    return NextResponse.json({ error: 'Widget ID is required' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: goals, error } = await supabase
    .from('study_goals')
    .select('*')
    .eq('widget_id', widgetId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goals });
}

// POST: Create a new goal
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { widgetId, title, description, targetValue, unit, goalType, endDate } = body;

  if (!widgetId || !title || !targetValue || !unit || !goalType) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { data: goal, error } = await supabase
    .from('study_goals')
    .insert({
      widget_id: widgetId,
      user_id: user.id,
      title,
      description,
      target_value: targetValue,
      current_value: 0,
      unit,
      goal_type: goalType,
      end_date: endDate || null,
      is_completed: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goal }, { status: 201 });
}

// PUT: Update a goal (progress or details)
export async function PUT(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { goalId, updates } = body;

  if (!goalId || !updates) {
    return NextResponse.json({ error: 'Goal ID and updates are required' }, { status: 400 });
  }

  // Build the update object
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.targetValue !== undefined) updateData.target_value = updates.targetValue;
  if (updates.currentValue !== undefined) {
    updateData.current_value = updates.currentValue;

    // Check if goal should be marked as completed
    const { data: goal } = await supabase
      .from('study_goals')
      .select('target_value')
      .eq('id', goalId)
      .single();

    if (goal && updates.currentValue >= goal.target_value) {
      updateData.is_completed = 1;
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.is_completed = 0;
      updateData.completed_at = null;
    }
  }
  if (updates.unit !== undefined) updateData.unit = updates.unit;
  if (updates.goalType !== undefined) updateData.goal_type = updates.goalType;
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate;

  const { data: updatedGoal, error } = await supabase
    .from('study_goals')
    .update(updateData)
    .eq('id', goalId)
    .eq('user_id', user.id) // Ensure user owns the goal
    .select()
    .single();

  if (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goal: updatedGoal });
}

// DELETE: Delete a goal
export async function DELETE(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const goalId = searchParams.get('goalId');

  if (!goalId) {
    return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('study_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id); // Ensure user owns the goal

  if (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
