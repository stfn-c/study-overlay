'use client'

import React, { useEffect, useState } from 'react';
import { QuoteConfig } from '@/lib/types/overlay';
import OverlayWrapper from './OverlayWrapper';
import { defaultTheme, getThemeById } from '@/lib/themes/presets';

interface QuoteOverlayProps {
  config: QuoteConfig;
}

const defaultQuotes = [
  "The expert in anything was once a beginner.",
  "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.",
  "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.",
  "Education is the most powerful weapon which you can use to change the world.",
  "The beautiful thing about learning is that nobody can take it away from you.",
];

export default function QuoteOverlay({ config }: QuoteOverlayProps) {
  const theme = config.themeId ? getThemeById(config.themeId) || defaultTheme : defaultTheme;
  const quotes = config.quotes && config.quotes.length > 0 ? config.quotes : defaultQuotes;
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!config.rotationInterval) return;

    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFade(true);
      }, 300);
    }, config.rotationInterval * 1000);

    return () => clearInterval(interval);
  }, [config.rotationInterval, quotes.length]);

  return (
    <OverlayWrapper theme={theme} opacity={config.opacity}>
      <div className="max-w-4xl w-full px-12 text-center">
        <div
          className="transition-opacity duration-300"
          style={{
            opacity: fade ? 1 : 0,
          }}
        >
          <svg
            className="w-12 h-12 mx-auto mb-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{
              color: 'var(--color-primary)',
            }}
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>

          <p
            className="text-2xl leading-relaxed mb-6"
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-normal)',
              lineHeight: '1.6',
            }}
          >
            {quotes[currentQuoteIndex]}
          </p>

          {config.showAuthor && (
            <p
              className="text-lg"
              style={{
                fontSize: 'var(--font-size-lg)',
                color: 'var(--color-secondary)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              — Unknown
            </p>
          )}
        </div>

        {quotes.length > 1 && config.rotationInterval && (
          <div
            className="flex gap-2 justify-center mt-8"
          >
            {quotes.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor:
                    index === currentQuoteIndex
                      ? 'var(--color-accent)'
                      : 'var(--color-secondary)',
                  opacity: index === currentQuoteIndex ? 1 : 0.4,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </OverlayWrapper>
  );
}
