import { createClient } from '@/lib/supabase/server';
import PomodoroClient from './pomodoro-client';

export default async function PomodoroPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const widgetId = typeof params.widgetId === 'string' ? params.widgetId : undefined;

  // Legacy URL support
  const workingTime = typeof params.workingTime === 'string' ? params.workingTime : undefined;
  const restTime = typeof params.restTime === 'string' ? params.restTime : undefined;
  const startTime = typeof params.startTime === 'string' ? params.startTime : undefined;

  // If widgetId provided, fetch from database
  if (widgetId) {
    const supabase = await createClient();
    const { data: widget } = await supabase
      .from('widgets')
      .select('*')
      .eq('id', widgetId)
      .single();

    if (widget) {
      return (
        <PomodoroClient
          widgetId={widgetId}
          workingTime={widget.config.workingTime || '25'}
          restTime={widget.config.restTime || '5'}
          pomodoroGoal={widget.config.pomodoroGoal}
          style={widget.config.pomodoroStyle || 'minimal'}
          styleSettings={widget.config.pomodoroStyleSettings || {}}
          startTime={startTime || ''}
          initialState={widget.state}
        />
      );
    }
  }

  // Legacy support
  if (!workingTime || !restTime) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white p-8" style={{ backgroundColor: 'transparent' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Missing Parameters</h1>
          <p>Please generate a proper link from the home page.</p>
        </div>
      </div>
    );
  }

  return <PomodoroClient workingTime={workingTime} restTime={restTime} startTime={startTime || ''} />;
}