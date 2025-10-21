'use client';

import { useEffect, useState } from 'react';

interface LocalTimeClientProps {
  widgetId?: string;
  font?: string;
  timezone?: string;
}

export default function LocalTimeClient({ widgetId, font = 'Inter', timezone = 'local' }: LocalTimeClientProps) {
  const [displayedTime, setDisplayedTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const time = new Date();

      // Convert to specified timezone
      let displayTime: Date;
      if (timezone === 'local') {
        displayTime = time;
      } else {
        // Convert timezone offset (e.g., "UTC+8" or "GMT-5")
        const match = timezone.match(/([+-])(\d+)/);
        if (match) {
          const sign = match[1];
          const offset = parseInt(match[2]);
          const utcTime = time.getTime() + (time.getTimezoneOffset() * 60000);
          const targetOffset = (sign === '+' ? offset : -offset) * 3600000;
          displayTime = new Date(utcTime + targetOffset);
        } else {
          displayTime = time;
        }
      }

      const hours = displayTime.getHours();
      const minutes = displayTime.getMinutes();
      const day = displayTime.toLocaleDateString('en-US', { weekday: 'short' });
      const timeString = `${hours}:${minutes.toString().padStart(2, '0')} ${day}`;
      setDisplayedTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;600;700&display=swap');
      `}</style>
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
        <div
          className="text-8xl font-bold text-white"
          style={{ fontFamily: `'${font}', sans-serif` }}
        >
          {displayedTime || 'Loading...'}
        </div>
      </div>
    </>
  );
}
