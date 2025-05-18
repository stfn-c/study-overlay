import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
const inter = Inter({ subsets: ['latin'] })

export default function Home({ workingTime, restTime, startTime }) {
  useEffect(() => {
    const interval = setInterval(() => {
      // set minutes and seconds
      const newDate = new Date()

    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const workTime = workingTime * 60 * 1000;
  const breakTime = restTime * 60 * 1000;

  const [isWorking, setIsWorking] = useState(true);
  const [timeLeft, setTimeLeft] = useState(workTime);

  const startTimeInObj = new Date();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const elapsed = now - startTimeInObj;
      console.log("elapsed", elapsed)
      const remaining = isWorking ? workTime - elapsed : breakTime - elapsed;
      console.log("remaining", remaining)

      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsWorking(!isWorking);
        setTimeLeft(isWorking ? breakTime : workTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorking]);

  if(!workingTime || !restTime) {
    return (
      <div>
        <h1>Whoops, looks like there's some missing parameters! Go back to the main page to generate this link with proper parameters</h1>
      </div>
    )
  }

  return (
    <div
      className={`w-full h-screen flex flex-grow bg-green-500 font-sans text-white`}
    >

      <div className='mr-[5rem] text-[3rem] font-extrabold flex flex-col'>
        <h1>
          {isWorking ? '📚' : 'Break'} {Math.floor(timeLeft / 60000)}m {((timeLeft / 1000) % 60).toFixed(0)}s
        </h1>
        <h1 className='text-[1.9rem] mx-auto'>
          Pomodoro timer ({Math.floor(workingTime)}/{Math.floor(restTime)})
        </h1>
      </div>
    </div>
  )
}


// server side props
export async function getServerSideProps(context) {
  // get params

  const workingTime = context.query.workingTime

  if (workingTime) {
    return {
      props: {
        workingTime,
        restTime: context.query.restTime,
        startTime: context.query.startTime
      },
    };
  }

  return { props: { } }
}
