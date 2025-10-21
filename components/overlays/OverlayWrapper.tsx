'use client'

import React from 'react';
import { Theme } from '@/lib/types/overlay';
import { getThemeStyles } from '@/lib/themes/presets';

interface OverlayWrapperProps {
  theme: Theme;
  opacity?: number;
  className?: string;
  children: React.ReactNode;
}

export default function OverlayWrapper({
  theme,
  opacity = 1,
  className = '',
  children,
}: OverlayWrapperProps) {
  const styles = getThemeStyles(theme);

  return (
    <div
      className={`w-full h-screen flex items-center justify-center ${className}`}
      style={{
        ...styles,
        opacity,
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-family)',
      }}
    >
      {children}
    </div>
  );
}
