import Image from 'next/image'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
const inter = Inter({ subsets: ['latin'] })
import SpotifyWebApi from 'spotify-web-api-js';
import { useRouter } from 'next/router';
import axios from 'axios';
// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
import { fetchSpotifyAccessToken, refreshToken } from '../utils/spotify';

// anonymous async func

export default function Home() {

  const [displayedTime, setDisplayedTime] = useState("");


  useEffect(() => {
    const interval = setInterval(() => {
      // set minutes and seconds
      const time = new Date();

      const hours = time.getHours();
      const minutes = time.getMinutes();
      const seconds = time.getSeconds();
      const DayShortened = time.toLocaleDateString('en-US', { weekday: 'short' });

      // template 12:32pm Fri
      const timeString = `${hours}:${minutes} ${DayShortened}`;
      setDisplayedTime(timeString);
    }, 1000)
    return () => clearInterval(interval)
  }, [])


  return (
    <div
      className={`w-full h-screen flex flex-grow bg-green-500 font-sans text-white`}
    >

      <div className='mr-[5rem] text-[3rem] font-extrabold flex flex-col'>
        {
          displayedTime
        }
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
        requestAnimationFrame: context.query.restTime,
        startTime: context.query.startTime
      },
    };
  }

  return {
    props: {

    }
  }
}
