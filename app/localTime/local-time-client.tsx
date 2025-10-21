'use client'

import { useEffect, useState } from 'react'

interface LocalTimeClientProps {
  widgetId: string;
}

export default function LocalTimeClient({ widgetId }: LocalTimeClientProps) {
  const [displayedTime, setDisplayedTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const time = new Date();
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const day = time.toLocaleDateString('en-US', { weekday: 'short' });
      const timeString = `${hours}:${minutes.toString().padStart(2, '0')} ${day}`;
      setDisplayedTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [])

  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
      <div className="text-8xl font-bold text-white">
        {displayedTime || 'Loading...'}
      </div>
    </div>
  )
}
