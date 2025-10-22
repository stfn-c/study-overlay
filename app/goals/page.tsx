import { createClient } from '@/lib/supabase/server';
import { goalsService } from '@/lib/services/goals';
import GoalsClient from './goals-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface GoalsPageProps {
  searchParams: {
    widgetId?: string;
  };
}

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const { widgetId } = searchParams;

  if (!widgetId) {
    return notFound();
  }

  const supabase = createClient();

  // Fetch widget configuration
  const { data: widget, error: widgetError } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', widgetId)
    .single();

  if (widgetError || !widget) {
    return notFound();
  }

  // Fetch initial goals
  const { data: goals } = await supabase
    .from('study_goals')
    .select('*')
    .eq('widget_id', widgetId)
    .order('created_at', { ascending: false });

  return (
    <GoalsClient
      widgetId={widgetId}
      initialGoals={goals || []}
      styleSettings={widget.config?.styleSettings}
    />
  );
}
