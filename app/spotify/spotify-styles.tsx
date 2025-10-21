'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface SpotifyStyleProps {
  songName: string;
  artistName: string;
  albumCover: string;
  progress: number;
  duration: number;
  style: 'glassmorphism' | 'vinyl';
  settings: {
    // Glassmorphism settings
    glassBlur?: number;
    glassOpacity?: number;
    accentColor?: string;
    compact?: boolean;
  };
}

export function GlassmorphismStyle({ songName, artistName, albumCover, progress, duration, settings }: Omit<SpotifyStyleProps, 'style'>) {
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  const blur = settings.glassBlur || 16;
  const opacity = settings.glassOpacity || 0.15;
  const accentColor = settings.accentColor || '#8B5CF6';
  const compact = settings.compact || false;

  return (
    <div className="w-full h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'transparent' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl shadow-2xl"
        style={{
          backdropFilter: `blur(${blur}px)`,
          background: `linear-gradient(135deg, rgba(255, 255, 255, ${opacity}), rgba(255, 255, 255, ${opacity * 0.6}))`,
          border: '1px solid rgba(255, 255, 255, 0.4)',
          maxWidth: compact ? '500px' : '600px',
          width: '100%',
        }}
      >
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              `radial-gradient(circle at 0% 0%, ${accentColor}40 0%, transparent 50%)`,
              `radial-gradient(circle at 100% 100%, ${accentColor}40 0%, transparent 50%)`,
              `radial-gradient(circle at 0% 100%, ${accentColor}40 0%, transparent 50%)`,
              `radial-gradient(circle at 100% 0%, ${accentColor}40 0%, transparent 50%)`,
              `radial-gradient(circle at 0% 0%, ${accentColor}40 0%, transparent 50%)`,
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative p-8 flex items-center gap-6">
          {/* Album Cover with hover effect */}
          {albumCover ? (
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-xl flex-shrink-0"
              style={{
                boxShadow: `0 20px 60px ${accentColor}40`,
              }}
            >
              <Image
                src={albumCover}
                alt="Album Cover"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
                animate={{
                  x: ['-100%', '200%'],
                  opacity: [0, 0.3, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              />
            </motion.div>
          ) : (
            <div className="w-32 h-32 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-5xl">🎵</span>
            </div>
          )}

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-white text-2xl font-bold truncate drop-shadow-lg">
                {songName}
              </div>
              <div className="text-white/80 text-lg truncate mt-1 drop-shadow-md">
                {artistName}
              </div>

              {/* Progress Bar */}
              {duration > 0 && (
                <div className="mt-6">
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}dd)`,
                        boxShadow: `0 0 20px ${accentColor}80`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-white/60">
                    <span>{Math.floor(progress / 60000)}:{String(Math.floor((progress % 60000) / 1000)).padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60000)}:{String(Math.floor((duration % 60000) / 1000)).padStart(2, '0')}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Spotify Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="flex-shrink-0"
          >
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill={accentColor}>
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

