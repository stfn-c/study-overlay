import { createClient } from '@/lib/supabase/server';
import QuoteClient from './quote-client';

export default async function QuotePage({
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
        <QuoteClient
          widgetId={widgetId}
          style={widget.config.quoteStyle || 'minimal'}
          styleSettings={widget.config.quoteStyleSettings || {}}
        />
      );
    }
  }

  return <QuoteClient />;
}
