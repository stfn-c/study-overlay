import { Theme } from '../types/overlay';

export const defaultTheme: Theme = {
  id: 'default',
  name: 'Default Dark',
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#0f172a',
    text: '#f1f5f9',
    accent: '#10b981',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      sm: '0.875rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '3rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
  },
  spacing: {
    padding: '1rem',
    margin: '0.5rem',
    gap: '0.75rem',
  },
  borderRadius: '0.75rem',
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
};

export const darkTheme: Theme = {
  ...defaultTheme,
  id: 'dark',
  name: 'Pure Dark',
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    background: '#000000',
    text: '#ffffff',
    accent: '#22c55e',
  },
};

export const neonTheme: Theme = {
  ...defaultTheme,
  id: 'neon',
  name: 'Neon',
  colors: {
    primary: '#ff00ff',
    secondary: '#00ffff',
    background: '#0a0a0a',
    text: '#ffffff',
    accent: '#ffff00',
  },
};

export const presetThemes: Theme[] = [defaultTheme, darkTheme, neonTheme];

export const getThemeById = (id: string): Theme | undefined => {
  return presetThemes.find((theme) => theme.id === id);
};

export const getThemeStyles = (theme: Theme) => {
  return {
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-background': theme.colors.background,
    '--color-text': theme.colors.text,
    '--color-accent': theme.colors.accent,
    '--font-family': theme.typography.fontFamily,
    '--font-size-sm': theme.typography.fontSize.sm,
    '--font-size-md': theme.typography.fontSize.md,
    '--font-size-lg': theme.typography.fontSize.lg,
    '--font-size-xl': theme.typography.fontSize.xl,
  } as React.CSSProperties;
};
