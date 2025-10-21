'use client'

import Image from 'next/image'
import { useEffect, useState, useCallback } from 'react'
import { refreshToken } from '@/lib/utils/spotify';
import { widgetsService } from '@/lib/services/widgets';
import { GlassmorphismStyle } from './spotify-styles';

interface SpotifyClientProps {
  token?: string;
  refreshToken?: string;
  host?: string;
  vinyl?: boolean;
  widgetId?: string;
  style?: 'glassmorphism' | 'vinyl' | 'default';
  styleSettings?: {
    // Glassmorphism
    glassBlur?: number;
    glassOpacity?: number;
    accentColor?: string;
    compact?: boolean;
    // Vinyl
    textPosition?: string;
    vinylSize?: number;
    labelColor?: string;
  };
}

interface CurrentlyPlaying {
  item?: {
    name: string;
    artists: Array<{ name: string }>;
    album: {
      images: Array<{ url: string }>;
    };
    duration_ms: number;
  };
  progress_ms: number;
  error?: {
    status: number;
    message: string;
  };
}

export default function SpotifyClient({ token, refreshToken: refreshTokenString, host, vinyl, widgetId, style = 'default', styleSettings = {} }: SpotifyClientProps) {
  const [songName, setSongName] = useState('Waiting for music...')
  const [artistName, setArtistName] = useState('')
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [albumCover, setAlbumCover] = useState('')
  const [lastTrackId, setLastTrackId] = useState<string | null>(null)

  const updateWidgetState = useCallback(async (trackInfo: any) => {
    if (!widgetId) return;

    try {
      await widgetsService.updateWidgetState(widgetId, {
        currentTrack: trackInfo
      });
    } catch (error) {
      console.error('Failed to update Spotify widget state:', error);
    }
  }, [widgetId]);

  async function fetchWebApi(endpoint: string) {
    let usedToken = (localStorage.getItem('token') && localStorage.getItem('token') !== "undefined")
      ? localStorage.getItem('token')
      : token;

    if (!usedToken) return null;

    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${usedToken}`,
      },
    });
    return await res.json();
  }

  async function getTrackInfo() {
    const response: CurrentlyPlaying = await fetchWebApi('v1/me/player/currently-playing');

    if (response?.error?.status === 401) {
      const tokenData = await refreshToken({
        refresh_token: refreshTokenString || localStorage.getItem('refreshToken') || '',
        host: host || '',
      });

      if (!tokenData) {
        console.log('Could not refresh token');
        return;
      }

      localStorage.setItem('token', tokenData.access_token);
      localStorage.setItem('refreshToken', tokenData.refresh_token);
      return getTrackInfo();
    }

    if (response?.item) {
      const { name, artists, album, duration_ms } = response.item;
      const artistsArray = artists.map((artist) => artist.name);
      const newSongName = name;
      const newArtistName = artistsArray.join(', ');

      setSongName(newSongName);
      setArtistName(newArtistName);
      setProgress(response.progress_ms);
      setDuration(duration_ms);

      if (album.images.length > 0) {
        setAlbumCover(album.images[0].url);
      }

      // Update widget state if track changed
      const trackId = `${newSongName}-${newArtistName}`;
      if (trackId !== lastTrackId) {
        setLastTrackId(trackId);
        updateWidgetState({
          name: newSongName,
          artist: newArtistName,
          album: album.name,
          albumCover: album.images[0]?.url,
          progress: response.progress_ms,
          duration: duration_ms
        });
      }
    } else {
      setSongName('No track playing');
      setArtistName('');
      updateWidgetState(null);
    }
  }

  useEffect(() => {
    // Check if Spotify is connected
    if (!token && !localStorage.getItem('token')) {
      setSongName('Connect Spotify to see now playing');
      return;
    }

    getTrackInfo(); // Initial fetch

    const interval = setInterval(() => {
      getTrackInfo();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  // Render based on style
  if (style === 'glassmorphism') {
    return (
      <GlassmorphismStyle
        songName={songName}
        artistName={artistName}
        albumCover={albumCover}
        progress={progress}
        duration={duration}
        settings={styleSettings}
      />
    );
  }

  if (vinyl || style === 'vinyl') {
    const textPosition = styleSettings.textPosition || 'bottom';
    const vinylSize = styleSettings.vinylSize || 200;
    const labelColor = styleSettings.labelColor || '#DC2626';

    const isPlaying = songName !== 'No track playing' && songName !== 'Waiting for music...' && songName !== 'Connect Spotify to see now playing';

    return (
      <div className="w-full h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'transparent' }}>
        <div className={`flex gap-8 items-center ${textPosition === 'right' ? 'flex-row' : textPosition === 'left' ? 'flex-row-reverse' : 'flex-col'}`}>
          {/* Vinyl Record Container */}
          <div className="relative flex-shrink-0" style={{ width: vinylSize, height: vinylSize }}>
            {/* Vinyl Record */}
            <div
              className={`absolute inset-0 rounded-full bg-black shadow-2xl ${isPlaying ? 'animate-spin-slow' : ''}`}
              style={{ width: vinylSize, height: vinylSize }}
            >
              {/* Grooves */}
              <div className="absolute inset-[8%] rounded-full border border-gray-800/50"></div>
              <div className="absolute inset-[16%] rounded-full border border-gray-800/40"></div>
              <div className="absolute inset-[24%] rounded-full border border-gray-800/30"></div>
              <div className="absolute inset-[32%] rounded-full border border-gray-800/20"></div>

              {/* Center Label */}
              <div
                className="absolute inset-[35%] rounded-full shadow-inner flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${labelColor}, ${labelColor}dd)`
                }}
              >
                <div className="text-center text-white">
                  <div className="text-[8px] font-bold uppercase tracking-wider opacity-90">Now</div>
                  <div className="text-[6px] opacity-60">Playing</div>
                </div>
              </div>

              {/* Album Cover (centered - does NOT spin) */}
              {albumCover && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden shadow-xl"
                  style={{
                    width: vinylSize * 0.55,
                    height: vinylSize * 0.55,
                    animation: 'none'
                  }}
                >
                  <Image
                    src={albumCover}
                    alt="Album Cover"
                    width={Math.round(vinylSize * 0.55)}
                    height={Math.round(vinylSize * 0.55)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Song Info */}
          <div
            className={`text-white ${textPosition === 'bottom' ? 'text-center max-w-[400px]' : 'max-w-[300px]'}`}
          >
            <div className={`text-2xl font-bold mb-2 truncate ${textPosition !== 'bottom' && 'text-left'}`}>
              {songName}
            </div>
            <div className={`text-base opacity-70 truncate mb-4 ${textPosition !== 'bottom' && 'text-left'}`}>
              {artistName}
            </div>

            {/* Progress Bar */}
            {duration > 0 && (
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full bg-white/80 transition-all duration-1000 rounded-full shadow-lg"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/50">
                  <span>{Math.floor(progress / 60000)}:{String(Math.floor((progress % 60000) / 1000)).padStart(2, '0')}</span>
                  <span>{Math.floor(duration / 60000)}:{String(Math.floor((duration % 60000) / 1000)).padStart(2, '0')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
      <div className="flex items-center gap-6 bg-black/80 backdrop-blur-md rounded-2xl p-6 min-w-[400px]">
        {/* Album Cover */}
        {albumCover ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
            <Image src={albumCover} alt="Album Cover" width={96} height={96} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">🎵</span>
          </div>
        )}

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-lg font-semibold truncate">{songName}</div>
          <div className="text-gray-400 text-sm truncate">{artistName}</div>

          {/* Progress Bar */}
          {duration > 0 && (
            <div className="mt-3 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Spotify Logo */}
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}