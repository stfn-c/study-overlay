import { createClient } from '@/lib/supabase/server';
import StudyRoomClient from './study-room-client';
import { notFound } from 'next/navigation';

export default async function StudyRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const widgetId = typeof params.id === 'string' ? params.id : undefined;

  if (!widgetId) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: widget, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', widgetId)
    .single();

  if (error || !widget) {
    notFound();
  }

  return <StudyRoomClient widget={widget} user={user} />;
}
