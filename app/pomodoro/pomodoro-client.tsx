'use client'

import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

interface PomodoroClientProps {
  workingTime: string;
  restTime: string;
  startTime: string;
}

export default function PomodoroClient({ workingTime, restTime, startTime }: PomodoroClientProps) {
  const workTime = Number(workingTime) * 60 * 1000;
  const breakTime = Number(restTime) * 60 * 1000;

  const [isWorking, setIsWorking] = useState(true);
  const [timeLeft, setTimeLeft] = useState(workTime);

  const startTimeInObj = new Date();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const elapsed = now.getTime() - startTimeInObj.getTime();
      const remaining = isWorking ? workTime - elapsed : breakTime - elapsed;

      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsWorking(!isWorking);
        setTimeLeft(isWorking ? breakTime : workTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorking, workTime, breakTime]);

  return (
    <div className="w-full h-screen flex flex-grow bg-green-500 font-sans text-white">
      <div className='mr-[5rem] text-[3rem] font-extrabold flex flex-col'>
        <h1>
          {isWorking ? '📚' : 'Break'} {Math.floor(timeLeft / 60000)}m {((timeLeft / 1000) % 60).toFixed(0)}s
        </h1>
        <h1 className='text-[1.9rem] mx-auto'>
          Pomodoro timer ({Math.floor(Number(workingTime))}/{Math.floor(Number(restTime))})
        </h1>
      </div>
    </div>
  );
}
