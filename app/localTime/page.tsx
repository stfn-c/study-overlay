import { createClient } from '@/lib/supabase/server';
import LocalTimeClient from './local-time-client';

export default async function LocalTimePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const widgetId = typeof params.widgetId === 'string' ? params.widgetId : undefined;

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
        <LocalTimeClient
          widgetId={widgetId}
          font={widget.config?.font || 'Inter'}
          timezone={widget.config?.timezone || 'local'}
          format={widget.config?.format || '24h-short'}
        />
      );
    }
  }

  // Legacy support or defaults
  const font = typeof params.font === 'string' ? params.font : 'Inter';
  const timezone = typeof params.timezone === 'string' ? params.timezone : 'local';
  const format = typeof params.format === 'string' ? params.format : '24h-short';

  return <LocalTimeClient font={font} timezone={timezone} format={format} />;
}
