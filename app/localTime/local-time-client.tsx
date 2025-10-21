'use client'

import { useEffect, useState } from 'react'

export default function LocalTimeClient() {
  const [displayedTime, setDisplayedTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date();

      const hours = time.getHours();
      const minutes = time.getMinutes();
      const seconds = time.getSeconds();
      const DayShortened = time.toLocaleDateString('en-US', { weekday: 'short' });

      const timeString = `${hours}:${minutes} ${DayShortened}`;
      setDisplayedTime(timeString);
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-screen flex flex-grow bg-green-500 font-sans text-white">
      <div className='mr-[5rem] text-[3rem] font-extrabold flex flex-col'>
        {displayedTime}
      </div>
    </div>
  )
}
