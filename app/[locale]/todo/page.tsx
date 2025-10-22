import { createClient } from '@/lib/supabase/server';
import TodoClient from './todo-client';

export default async function TodoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const widgetId = typeof params.widgetId === 'string' ? params.widgetId : undefined;

  if (widgetId) {
    const supabase = await createClient();
    const { data: widget } = await supabase
      .from('widgets')
      .select('*')
      .eq('id', widgetId)
      .single();

    if (widget) {
      return (
        <TodoClient
          widgetId={widgetId}
          style={widget.config.todoStyle || 'minimal'}
          styleSettings={widget.config.todoStyleSettings || {}}
        />
      );
    }
  }

  return <TodoClient />;
}
