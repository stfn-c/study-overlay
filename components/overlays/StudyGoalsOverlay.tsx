'use client'

import React from 'react';
import { StudyGoalsConfig } from '@/lib/types/overlay';
import OverlayWrapper from './OverlayWrapper';
import { defaultTheme, getThemeById } from '@/lib/themes/presets';

interface StudyGoalsOverlayProps {
  config: StudyGoalsConfig;
}

export default function StudyGoalsOverlay({ config }: StudyGoalsOverlayProps) {
  const theme = config.themeId ? getThemeById(config.themeId) || defaultTheme : defaultTheme;

  return (
    <OverlayWrapper theme={theme} opacity={config.opacity}>
      <div className="max-w-2xl w-full px-6">
        <h2
          className="text-3xl font-bold mb-6 text-center"
          style={{
            color: 'var(--color-primary)',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
          }}
        >
          Study Goals
        </h2>

        <div className="space-y-4">
          {config.goals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;

            return (
              <div
                key={goal.id}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--border-radius)',
                  padding: 'var(--spacing-padding)',
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3
                    className="font-semibold"
                    style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {goal.title}
                  </h3>
                  <span
                    className="text-sm"
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {goal.current} / {goal.target} {goal.unit}
                  </span>
                </div>

                {config.showProgress !== false && (
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: 'var(--color-accent)',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </OverlayWrapper>
  );
}
