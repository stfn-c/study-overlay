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

// Curated list of motivational study quotes
const QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Strive for progress, not perfection.", author: "Unknown" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { text: "Study while others are sleeping; work while others are loafing.", author: "William A. Ward" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "Learning is not attained by chance, it must be sought for with ardor and diligence.", author: "Abigail Adams" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
];

export default function QuoteClient({ widgetId, initialQuote, initialAuthor, style = 'minimal', styleSettings: initialStyleSettings = {} }: QuoteClientProps) {
  const [quote, setQuote] = useState(initialQuote || QUOTES[0].text);
  const [author, setAuthor] = useState(initialAuthor || QUOTES[0].author);
  const [styleConfig, setStyleConfig] = useState(style);
  const [styleSettings, setStyleSettings] = useState(initialStyleSettings);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Get quote for the day (deterministic based on date)
  const getQuoteOfTheDay = useCallback(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const quoteIndex = dayOfYear % QUOTES.length;
    return QUOTES[quoteIndex];
  }, []);

  useEffect(() => {
    if (!widgetId) {
      const dailyQuote = getQuoteOfTheDay();
      setQuote(dailyQuote.text);
      setAuthor(dailyQuote.author);
      setIsLoading(false);
      return;
    }

    const fetchWidgetConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('widgets')
          .select('config')
          .eq('id', widgetId)
          .single();

        if (error) throw error;

        if (data?.config) {
          setStyleConfig(data.config.quoteStyle || 'minimal');
          setStyleSettings(data.config.quoteStyleSettings || {});
        }

        const dailyQuote = getQuoteOfTheDay();
        setQuote(dailyQuote.text);
        setAuthor(dailyQuote.author);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch widget config:', error);
        setIsLoading(false);
      }
    };

    fetchWidgetConfig();
    const interval = setInterval(fetchWidgetConfig, 5000);
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
