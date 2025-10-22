'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LocalTimeClientProps {
  widgetId?: string;
  font?: string;
  timezone?: string;
  format?: string;
}

export default function LocalTimeClient({
  widgetId,
  font: initialFont = 'Inter',
  timezone: initialTimezone = 'local',
  format: initialFormat = '24h-short'
}: LocalTimeClientProps) {
  const [displayedTime, setDisplayedTime] = useState("");
  const [fontLoaded, setFontLoaded] = useState(false);
  const [font, setFont] = useState(initialFont);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [format, setFormat] = useState(initialFormat);

  const supabase = createClient();

  // Fetch config from database and poll for updates
  useEffect(() => {
    if (!widgetId) return;

    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('widgets')
        .select('config')
        .eq('id', widgetId)
        .single();

      if (data?.config) {
        setFont(data.config.font || initialFont);
        setTimezone(data.config.timezone || initialTimezone);
        setFormat(data.config.format || initialFormat);
      }
    };

    // Fetch immediately
    fetchConfig();

    // Poll every 2 seconds for config updates
    const interval = setInterval(fetchConfig, 2000);

    return () => clearInterval(interval);
  }, [widgetId, supabase, initialFont, initialTimezone, initialFormat]);

  // Load Google Font dynamically
  useEffect(() => {
    const fontName = font.replace(' ', '+');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;600;700&display=swap`;
    link.rel = 'stylesheet';
    link.onload = () => setFontLoaded(true);
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [font]);

  useEffect(() => {
    const updateTime = () => {
      const time = new Date();

      // Convert to specified timezone
      let displayTime: Date;
      if (timezone === 'local') {
        displayTime = time;
      } else {
        try {
          // Use Intl API for proper timezone conversion
          displayTime = new Date(time.toLocaleString('en-US', { timeZone: timezone }));
        } catch {
          // Fallback to UTC offset parsing (e.g., "UTC+8", "UTC-5", "UTC+5.5")
          const match = timezone.match(/([+-])(\d+(?:\.\d+)?)/);
          if (match) {
            const sign = match[1];
            const offset = parseFloat(match[2]);
            const utcTime = time.getTime() + (time.getTimezoneOffset() * 60000);
            const targetOffset = (sign === '+' ? offset : -offset) * 3600000;
            displayTime = new Date(utcTime + targetOffset);
          } else {
            displayTime = time;
          }
        }
      }

      let timeString = '';
      const hours24 = displayTime.getHours();
      const hours12 = hours24 % 12 || 12;
      const minutes = displayTime.getMinutes();
      const seconds = displayTime.getSeconds();
      const ampm = hours24 >= 12 ? 'PM' : 'AM';
      const day = displayTime.toLocaleDateString('en-US', { weekday: 'short' });
      const dayLong = displayTime.toLocaleDateString('en-US', { weekday: 'long' });
      const date = displayTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dateLong = displayTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      // Format selection
      switch (format) {
        case '24h-short':
          timeString = `${hours24}:${minutes.toString().padStart(2, '0')} ${day}`;
          break;
        case '24h-seconds':
          timeString = `${hours24}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${day}`;
          break;
        case '12h-short':
          timeString = `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm} ${day}`;
          break;
        case '12h-seconds':
          timeString = `${hours12}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm} ${day}`;
          break;
        case 'time-only-24h':
          timeString = `${hours24}:${minutes.toString().padStart(2, '0')}`;
          break;
        case 'time-only-12h':
          timeString = `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          break;
        case 'time-date-24h':
          timeString = `${hours24}:${minutes.toString().padStart(2, '0')} • ${date}`;
          break;
        case 'time-date-12h':
          timeString = `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm} • ${date}`;
          break;
        case 'full-24h':
          timeString = `${dayLong}, ${dateLong} • ${hours24}:${minutes.toString().padStart(2, '0')}`;
          break;
        case 'full-12h':
          timeString = `${dayLong}, ${dateLong} • ${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          break;
        default:
          timeString = `${hours24}:${minutes.toString().padStart(2, '0')} ${day}`;
      }

      setDisplayedTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone, format]);

  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
      <div
        className="text-8xl font-bold text-white"
        style={{
          fontFamily: `'${font}', sans-serif`,
          opacity: fontLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        {displayedTime || 'Loading...'}
      </div>
    </div>
  );
}
