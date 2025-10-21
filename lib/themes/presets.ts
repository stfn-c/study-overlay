import { Theme } from '../types/overlay';

export const defaultTheme: Theme = {
  id: 'default',
  name: 'Default',
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
  id: 'dark',
  name: 'Dark Mode',
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    background: '#000000',
    text: '#ffffff',
    accent: '#22c55e',
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
  borderRadius: '0.5rem',
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4)',
  },
};

export const lightTheme: Theme = {
  id: 'light',
  name: 'Light Mode',
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#ffffff',
    text: '#0f172a',
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

export const neonTheme: Theme = {
  id: 'neon',
  name: 'Neon',
  colors: {
    primary: '#ff00ff',
    secondary: '#00ffff',
    background: '#0a0a0a',
    text: '#ffffff',
    accent: '#ffff00',
  },
  typography: {
    fontFamily: '"Orbitron", monospace',
    fontSize: {
      sm: '0.875rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '3rem',
    },
    fontWeight: {
      normal: 400,
      medium: 600,
      bold: 800,
    },
  },
  spacing: {
    padding: '1.25rem',
    margin: '0.75rem',
    gap: '1rem',
  },
  borderRadius: '0',
  shadows: {
    sm: '0 0 10px rgba(255, 0, 255, 0.5)',
    md: '0 0 20px rgba(255, 0, 255, 0.7)',
    lg: '0 0 30px rgba(255, 0, 255, 0.9)',
  },
};

export const pastelTheme: Theme = {
  id: 'pastel',
  name: 'Pastel',
  colors: {
    primary: '#ff9ecd',
    secondary: '#a8d5e2',
    background: '#fef9ef',
    text: '#5a5a5a',
    accent: '#ffd89b',
  },
  typography: {
    fontFamily: '"Quicksand", sans-serif',
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
    padding: '1.5rem',
    margin: '1rem',
    gap: '1rem',
  },
  borderRadius: '2rem',
  shadows: {
    sm: '0 2px 4px rgba(255, 158, 205, 0.1)',
    md: '0 4px 8px rgba(255, 158, 205, 0.2)',
    lg: '0 8px 16px rgba(255, 158, 205, 0.3)',
  },
};

export const minimalTheme: Theme = {
  id: 'minimal',
  name: 'Minimal',
  colors: {
    primary: '#000000',
    secondary: '#666666',
    background: '#ffffff',
    text: '#000000',
    accent: '#000000',
  },
  typography: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontSize: {
      sm: '0.75rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '2.5rem',
    },
    fontWeight: {
      normal: 300,
      medium: 400,
      bold: 600,
    },
  },
  spacing: {
    padding: '0.75rem',
    margin: '0.5rem',
    gap: '0.5rem',
  },
  borderRadius: '0',
  shadows: {
    sm: 'none',
    md: 'none',
    lg: 'none',
  },
};

export const retroTheme: Theme = {
  id: 'retro',
  name: 'Retro',
  colors: {
    primary: '#ff6b35',
    secondary: '#f7931e',
    background: '#004e89',
    text: '#ffffff',
    accent: '#00d9ff',
  },
  typography: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 400,
      bold: 400,
    },
  },
  spacing: {
    padding: '1rem',
    margin: '0.5rem',
    gap: '0.5rem',
  },
  borderRadius: '0',
  shadows: {
    sm: '2px 2px 0 rgba(0, 0, 0, 0.5)',
    md: '4px 4px 0 rgba(0, 0, 0, 0.5)',
    lg: '6px 6px 0 rgba(0, 0, 0, 0.5)',
  },
};

export const presetThemes: Theme[] = [
  defaultTheme,
  darkTheme,
  lightTheme,
  neonTheme,
  pastelTheme,
  minimalTheme,
  retroTheme,
];

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
    '--font-weight-normal': theme.typography.fontWeight.normal,
    '--font-weight-medium': theme.typography.fontWeight.medium,
    '--font-weight-bold': theme.typography.fontWeight.bold,
    '--spacing-padding': theme.spacing.padding,
    '--spacing-margin': theme.spacing.margin,
    '--spacing-gap': theme.spacing.gap,
    '--border-radius': theme.borderRadius,
    '--shadow-sm': theme.shadows.sm,
    '--shadow-md': theme.shadows.md,
    '--shadow-lg': theme.shadows.lg,
  } as React.CSSProperties;
};
