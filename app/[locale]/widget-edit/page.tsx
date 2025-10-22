import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WidgetEditClient from './widget-edit-client';
import { getLocale } from '@/lib/i18n/get-locale';

export default async function WidgetEditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const widgetId = typeof params.widgetId === 'string' ? params.widgetId : undefined;

  if (!widgetId) {
    redirect('/');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: widget } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', widgetId)
    .eq('user_id', user.id)
    .single();

  if (!widget) {
    redirect('/');
  }

  const host = process.env.HOST || 'http://localhost:3000';
  const locale = await getLocale();

  return <WidgetEditClient widget={widget} user={user} host={host} locale={locale} />;
}
