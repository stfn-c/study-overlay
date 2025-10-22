import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PomodoroClient from '../[locale]/pomodoro/pomodoro-client';
import SpotifyClient from '../[locale]/spotify/spotify-client';
import LocalTimeClient from '../[locale]/localTime/local-time-client';
import QuoteClient from '../[locale]/quote/quote-client';
import TodoClient from '../[locale]/todo/todo-client';
import StudyRoomClient from '../[locale]/study-room/study-room-client';
import GoalsClient from '../[locale]/goals/goals-client';

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const widgetId = typeof params.widgetId === 'string' ? params.widgetId : undefined;
  const isPreview = params.preview === 'true';
  const previewStyle = typeof params.style === 'string' ? params.style : undefined;
  const previewSettings = typeof params.settings === 'string' ? JSON.parse(params.settings) : undefined;

  if (!widgetId) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white p-8" style={{ backgroundColor: 'transparent' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Missing Widget ID</h1>
          <p>Please provide a widgetId parameter.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: widget } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', widgetId)
    .single();

  if (!widget) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white p-8" style={{ backgroundColor: 'transparent' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Widget Not Found</h1>
          <p>The widget you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Use preview params if in preview mode, otherwise use saved config
  const spotifyStyle = isPreview && previewStyle ? previewStyle : (widget.config.spotifyStyle || 'default');
  const styleSettings = isPreview && previewSettings ? previewSettings : (widget.config.styleSettings || {});

  // Render the appropriate widget based on type
  switch (widget.type) {
    case 'pomodoro':
      return (
        <PomodoroClient
          widgetId={widgetId}
          workingTime={widget.config.workingTime || '25'}
          restTime={widget.config.restTime || '5'}
          pomodoroGoal={widget.config.pomodoroGoal}
          style={widget.config.pomodoroStyle || 'minimal'}
          styleSettings={widget.config.pomodoroStyleSettings || {}}
          enableSound={widget.config.enableSound || false}
          startTime=""
          initialState={widget.state}
        />
      );

    case 'spotify':
      return (
        <SpotifyClient
          widgetId={widgetId}
          token={widget.config.token}
          refreshToken={widget.config.refreshToken}
          host={process.env.HOST || 'http://localhost:3000'}
          style={spotifyStyle as any}
          styleSettings={styleSettings}
        />
      );

    case 'local':
      return <LocalTimeClient widgetId={widgetId} />;

    case 'quote':
      return (
        <QuoteClient
          widgetId={widgetId}
          style={widget.config.quoteStyle || 'minimal'}
          styleSettings={widget.config.quoteStyleSettings || {}}
        />
      );

    case 'todo':
      return (
        <TodoClient
          widgetId={widgetId}
          style={widget.config.todoStyle || 'minimal'}
          styleSettings={widget.config.todoStyleSettings || {}}
        />
      );

    case 'study-room':
      const { data: { user } } = await supabase.auth.getUser();
      return (
        <StudyRoomClient
          widget={widget}
          user={user}
        />
      );

    case 'goals':
      return (
        <GoalsClient
          widgetId={widgetId}
          styleSettings={widget.config.styleSettings || {}}
        />
      );

    default:
      return (
        <div className="w-full h-screen flex items-center justify-center text-white p-8" style={{ backgroundColor: 'transparent' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Unknown Widget Type</h1>
            <p>Widget type "{widget.type}" is not supported.</p>
          </div>
        </div>
      );
  }
}
