'use client'

import { useEffect, useState } from 'react'

export default function FlipClient() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-full bg-black font-sans text-white transition-all duration-500">
      <div className="flex flex-grow gap-6 my-auto m-[5rem]">
        <div className='bg-zinc-900  flex-1 rounded-[2rem] aspect-square flex flex-col'>
          <h1 className='auto-resize-text m-auto font-bold'>05</h1>
        </div>
        <div className='bg-zinc-900 flex flex-1 rounded-[2rem] aspect-square'>
          <h1 className='auto-resize-text m-auto font-bold'>05</h1>
        </div>
      </div>
    </div>
  )
}
