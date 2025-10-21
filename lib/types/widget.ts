export type OverlayType = 'pomodoro' | 'spotify' | 'local' | 'quote';

export interface FormData {
  type: OverlayType | null;
  workingTime?: string;
  restTime?: string;
  enableSound?: boolean;
}

export interface OverlayItem {
  id: string;
  name: string;
  type: OverlayType;
  link: string;
  createdAt: number;
  state?: {
    isPaused?: boolean;
    currentTime?: number;
    isWorking?: boolean;
    lastActionTime?: number;
    lastActionTimeLeft?: number;
    pomodorosCompleted?: number;
    currentTrack?: any;
  };
  config?: any;
}

export const overlayCopy: Record<OverlayType, string> = {
  pomodoro: 'Pomodoro timer',
  spotify: 'Spotify tracker',
  local: 'Local time',
  quote: 'Daily quote',
};

export const overlayTag = (overlayType: OverlayType) => {
  switch (overlayType) {
    case 'pomodoro':
      return 'Timer';
    case 'spotify':
      return 'Music';
    case 'local':
      return 'Clock';
    case 'quote':
      return 'Inspiration';
    default:
      return 'Overlay';
  }
};