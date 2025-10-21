// Core Overlay Types for Study Overlay System

export type OverlayType =
  | 'pomodoro'
  | 'spotify'
  | 'clock'
  | 'flip-clock'
  | 'study-goals'
  | 'task-list'
  | 'quote'
  | 'stats';

export type OverlayVersion = 'v1' | 'v2';

// Theme System
export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
  };
  spacing: {
    padding: string;
    margin: string;
    gap: string;
  };
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Base Overlay Configuration
export interface BaseOverlayConfig {
  id: string;
  name: string;
  type: OverlayType;
  version: OverlayVersion;
  themeId?: string;
  opacity?: number;
}

// Pomodoro Overlay
export interface PomodoroConfig extends BaseOverlayConfig {
  type: 'pomodoro';
  workDuration: number;
  breakDuration: number;
  showProgressBar?: boolean;
}

// Spotify Overlay
export interface SpotifyConfig extends BaseOverlayConfig {
  type: 'spotify';
  token: string;
  refreshToken: string;
  albumArtStyle?: 'square' | 'circle' | 'vinyl';
  showProgressBar?: boolean;
}

// Clock Overlay
export interface ClockConfig extends BaseOverlayConfig {
  type: 'clock';
  format?: '12h' | '24h';
  showDate?: boolean;
}

// Study Goals Overlay
export interface StudyGoalsConfig extends BaseOverlayConfig {
  type: 'study-goals';
  goals: Array<{
    id: string;
    title: string;
    target: number;
    current: number;
    unit: 'minutes' | 'hours' | 'sessions';
  }>;
  showProgress?: boolean;
}

// Task List Overlay
export interface TaskListConfig extends BaseOverlayConfig {
  type: 'task-list';
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high';
  }>;
  maxVisible?: number;
  showCompleted?: boolean;
}

// Quote Overlay
export interface QuoteConfig extends BaseOverlayConfig {
  type: 'quote';
  quotes?: string[];
  rotationInterval?: number;
  showAuthor?: boolean;
}

// Union type for all overlay configurations
export type OverlayConfig =
  | PomodoroConfig
  | SpotifyConfig
  | ClockConfig
  | StudyGoalsConfig
  | TaskListConfig
  | QuoteConfig;
