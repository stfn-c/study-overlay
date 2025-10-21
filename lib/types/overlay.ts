// Core Overlay Types

export type OverlayType =
  | 'pomodoro'
  | 'spotify'
  | 'clock'
  | 'flip-clock'
  | 'study-goals'
  | 'task-list'
  | 'quote'
  | 'stats'
  | 'calendar'
  | 'weather'
  | 'github'
  | 'custom';

export type OverlayVersion = 'v1' | 'v2';

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

export interface OverlayPosition {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'middle' | 'bottom';
  offsetX?: number;
  offsetY?: number;
}

export interface OverlayDimensions {
  width: number | 'auto';
  height: number | 'auto';
  scale?: number;
}

export interface OverlayAnimation {
  entrance?: 'fade' | 'slide' | 'scale' | 'none';
  exit?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number; // in milliseconds
}

// Base Overlay Configuration
export interface BaseOverlayConfig {
  id: string;
  name: string;
  type: OverlayType;
  version: OverlayVersion;
  themeId?: string;
  customTheme?: Partial<Theme>;
  position?: OverlayPosition;
  dimensions?: OverlayDimensions;
  animation?: OverlayAnimation;
  opacity?: number; // 0-1
  isPublic?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Specific Overlay Configurations
export interface PomodoroConfig extends BaseOverlayConfig {
  type: 'pomodoro';
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration?: number;
  sessionsBeforeLongBreak?: number;
  showProgressBar?: boolean;
  playSound?: boolean;
  autoStart?: boolean;
}

export interface SpotifyConfig extends BaseOverlayConfig {
  type: 'spotify';
  token: string;
  refreshToken: string;
  albumArtStyle?: 'square' | 'circle' | 'vinyl';
  showProgressBar?: boolean;
  showArtist?: boolean;
  showAlbumArt?: boolean;
}

export interface ClockConfig extends BaseOverlayConfig {
  type: 'clock';
  format?: '12h' | '24h';
  showSeconds?: boolean;
  showDate?: boolean;
  showDay?: boolean;
  timezone?: string;
}

export interface FlipClockConfig extends BaseOverlayConfig {
  type: 'flip-clock';
  format?: '12h' | '24h';
  showSeconds?: boolean;
}

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

export interface QuoteConfig extends BaseOverlayConfig {
  type: 'quote';
  quotes?: string[];
  source?: 'custom' | 'api';
  apiEndpoint?: string;
  rotationInterval?: number; // in seconds
  showAuthor?: boolean;
}

export interface StatsConfig extends BaseOverlayConfig {
  type: 'stats';
  stats: {
    showTotalTime?: boolean;
    showStreak?: boolean;
    showSessions?: boolean;
    showGoalProgress?: boolean;
  };
}

export interface CalendarConfig extends BaseOverlayConfig {
  type: 'calendar';
  events: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    color?: string;
  }>;
  maxVisible?: number;
}

export interface WeatherConfig extends BaseOverlayConfig {
  type: 'weather';
  location?: string;
  showIcon?: boolean;
  showTemperature?: boolean;
  showCondition?: boolean;
  unit?: 'celsius' | 'fahrenheit';
}

export interface GitHubConfig extends BaseOverlayConfig {
  type: 'github';
  username: string;
  showContributions?: boolean;
  showStreak?: boolean;
  showCurrentRepo?: boolean;
}

export interface CustomConfig extends BaseOverlayConfig {
  type: 'custom';
  components: Array<{
    id: string;
    type: 'text' | 'image' | 'progress' | 'timer';
    props: Record<string, any>;
    position: {
      x: number;
      y: number;
    };
  }>;
}

// Union type for all overlay configurations
export type OverlayConfig =
  | PomodoroConfig
  | SpotifyConfig
  | ClockConfig
  | FlipClockConfig
  | StudyGoalsConfig
  | TaskListConfig
  | QuoteConfig
  | StatsConfig
  | CalendarConfig
  | WeatherConfig
  | GitHubConfig
  | CustomConfig;

// Database model
export interface OverlayModel {
  id: string;
  userId?: string;
  name: string;
  type: OverlayType;
  version: OverlayVersion;
  config: OverlayConfig;
  themeId?: string;
  isPublic: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics event
export interface AnalyticsEvent {
  id: string;
  overlayId: string;
  eventType: 'view' | 'copy' | 'share' | 'edit' | 'delete';
  metadata?: Record<string, any>;
  createdAt: Date;
}
