'use client'

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface QuoteClientProps {
  widgetId?: string;
  initialQuote?: string;
  initialAuthor?: string;
  style?: string;
  styleSettings?: any;
}

interface Quote {
  id: string;
  text: string;
  author: string;
}

export default function QuoteClient({ widgetId, initialQuote, initialAuthor, style = 'minimal', styleSettings: initialStyleSettings = {} }: QuoteClientProps) {
  const [quote, setQuote] = useState(initialQuote || '');
  const [author, setAuthor] = useState(initialAuthor || '');
  const [styleConfig, setStyleConfig] = useState(style);
  const [styleSettings, setStyleSettings] = useState(initialStyleSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const supabase = createClient();

  // Get quote for the day (deterministic based on date)
  const getQuoteOfTheDay = useCallback((quotesArray: Quote[]) => {
    if (quotesArray.length === 0) return null;
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const quoteIndex = dayOfYear % quotesArray.length;
    return quotesArray[quoteIndex];
  }, []);

  useEffect(() => {
    const fetchQuotesAndConfig = async () => {
      try {
        let quoteSetId: string | null = null;

        // Fetch widget config if widgetId is provided
        if (widgetId) {
          const { data: widgetData, error: widgetError } = await supabase
            .from('widgets')
            .select('config')
            .eq('id', widgetId)
            .single();

          if (widgetError) throw widgetError;

          if (widgetData?.config) {
            setStyleConfig(widgetData.config.quoteStyle || 'minimal');
            setStyleSettings(widgetData.config.quoteStyleSettings || {});
            quoteSetId = widgetData.config.quoteSetId || null;
          }
        }

        // Fetch quotes from the selected set or default to first available set
        let quotesData: Quote[] = [];

        if (quoteSetId) {
          // Fetch quotes from specific set
          const { data, error } = await supabase
            .from('quotes')
            .select('id, text, author')
            .eq('quote_set_id', quoteSetId);

          if (error) throw error;
          quotesData = data || [];
        }

        // If no quotes found or no set selected, get the first default set
        if (quotesData.length === 0) {
          const { data: quoteSets, error: setsError } = await supabase
            .from('quote_sets')
            .select('id')
            .eq('is_default', 1)
            .limit(1)
            .single();

          if (setsError) throw setsError;

          if (quoteSets) {
            const { data: defaultQuotes, error: quotesError } = await supabase
              .from('quotes')
              .select('id, text, author')
              .eq('quote_set_id', quoteSets.id);

            if (quotesError) throw quotesError;
            quotesData = defaultQuotes || [];
          }
        }

        setQuotes(quotesData);

        // Set quote of the day
        const dailyQuote = getQuoteOfTheDay(quotesData);
        if (dailyQuote) {
          setQuote(dailyQuote.text);
          setAuthor(dailyQuote.author);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch quotes:', error);
        setIsLoading(false);
      }
    };

    fetchQuotesAndConfig();
    const interval = setInterval(fetchQuotesAndConfig, 5000);
    return () => clearInterval(interval);
  }, [widgetId, supabase, getQuoteOfTheDay]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
        <div className="text-center px-8">
          <div className="text-2xl text-white/90">Loading quote...</div>
        </div>
      </div>
    );
  }

  const fontSize = styleSettings.fontSize || 48;
  const authorSize = styleSettings.authorSize || 24;
  const textColor = styleSettings.textColor || '#FFFFFF';
  const authorColor = styleSettings.authorColor || '#FFFFFF';
  const showQuotes = styleSettings.showQuotes !== false;
  const alignment = styleSettings.alignment || 'center';
  const positionY = styleSettings.positionY || 50;
  const maxWidth = styleSettings.maxWidth || 800;
  const lineHeight = styleSettings.lineHeight || 1.5;
  const font = styleSettings.font || 'Inter';

  // MINIMAL - Clean and simple
  if (styleConfig === 'minimal') {
    const accentColor = styleSettings.accentColor || '#10B981';

    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;500;600;700&display=swap');
        `}</style>
        <div
          className="w-full h-screen flex justify-center px-8"
          style={{
            backgroundColor: 'transparent',
            fontFamily: `'${font}', sans-serif`,
            alignItems: positionY < 33 ? 'flex-start' : positionY > 66 ? 'flex-end' : 'center',
            paddingTop: positionY < 33 ? '4rem' : undefined,
            paddingBottom: positionY > 66 ? '4rem' : undefined,
          }}
        >
          <div style={{ maxWidth: `${maxWidth}px`, textAlign: alignment as any }}>
            <p
              className="mb-6"
              style={{
                fontSize: `${fontSize}px`,
                color: textColor,
                fontWeight: 500,
                lineHeight,
              }}
            >
              {showQuotes && '"'}{quote}{showQuotes && '"'}
            </p>
            <div className="flex items-center gap-3" style={{ justifyContent: alignment }}>
              <div style={{ width: '40px', height: '2px', backgroundColor: accentColor }} />
              <p
                style={{
                  fontSize: `${authorSize}px`,
                  color: authorColor,
                  opacity: 0.9,
                  fontWeight: 600,
                }}
              >
                {author}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // SERIF - Classic and elegant
  if (styleConfig === 'serif') {
    const serifFont = styleSettings.serifFont || 'Playfair Display';

    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=${serifFont.replace(' ', '+')}:wght@400;600;700;900&display=swap');
        `}</style>
        <div
          className="w-full h-screen flex justify-center px-8"
          style={{
            backgroundColor: 'transparent',
            fontFamily: `'${serifFont}', serif`,
            alignItems: positionY < 33 ? 'flex-start' : positionY > 66 ? 'flex-end' : 'center',
            paddingTop: positionY < 33 ? '4rem' : undefined,
            paddingBottom: positionY > 66 ? '4rem' : undefined,
          }}
        >
          <div style={{ maxWidth: `${maxWidth}px`, textAlign: alignment as any }}>
            <p
              className="mb-8"
              style={{
                fontSize: `${fontSize}px`,
                color: textColor,
                fontWeight: 600,
                lineHeight,
                fontStyle: 'italic',
              }}
            >
              {showQuotes && <span style={{ fontSize: `${fontSize * 1.5}px`, opacity: 0.3 }}>"</span>}
              {quote}
              {showQuotes && <span style={{ fontSize: `${fontSize * 1.5}px`, opacity: 0.3 }}>"</span>}
            </p>
            <p
              style={{
                fontSize: `${authorSize}px`,
                color: authorColor,
                opacity: 0.8,
                fontWeight: 400,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              — {author}
            </p>
          </div>
        </div>
      </>
    );
  }

  // MODERN - Bold and contemporary
  if (styleConfig === 'modern') {
    const accentColor = styleSettings.accentColor || '#8B5CF6';

    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800;900&display=swap');
        `}</style>
        <div
          className="w-full h-screen flex justify-center px-8"
          style={{
            backgroundColor: 'transparent',
            fontFamily: "'Poppins', sans-serif",
            alignItems: positionY < 33 ? 'flex-start' : positionY > 66 ? 'flex-end' : 'center',
            paddingTop: positionY < 33 ? '4rem' : undefined,
            paddingBottom: positionY > 66 ? '4rem' : undefined,
          }}
        >
          <div style={{ maxWidth: `${maxWidth}px`, textAlign: alignment as any }}>
            <div
              className="mb-6 inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: accentColor, color: '#FFFFFF' }}
            >
              Quote of the Day
            </div>
            <p
              className="mb-6"
              style={{
                fontSize: `${fontSize}px`,
                color: textColor,
                fontWeight: 700,
                lineHeight,
                letterSpacing: '-0.02em',
              }}
            >
              {quote}
            </p>
            <p
              className="font-bold"
              style={{
                fontSize: `${authorSize}px`,
                color: accentColor,
                letterSpacing: '0.05em',
              }}
            >
              {author}
            </p>
          </div>
        </div>
      </>
    );
  }

  return null;
}
