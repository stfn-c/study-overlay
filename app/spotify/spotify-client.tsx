'use client'

import Image from 'next/image'
import { Inter } from 'next/font/google'
import { useEffect, useState } from 'react'
import { refreshToken } from '@/utils/spotify';

const inter = Inter({ subsets: ['latin'] })

interface SpotifyClientProps {
  token: string;
  refreshTokenString: string;
  host: string;
  vinyl: boolean;
}

export default function SpotifyClient({ token, refreshTokenString, host, vinyl }: SpotifyClientProps) {
  async function fetchWebApi(endpoint: string, method: string, body?: any) {
    let usedToken = (localStorage.getItem('token') && localStorage.getItem('token') != "undefined") ? localStorage.getItem('token') : token

    if (!usedToken) {
      return;
    }
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${usedToken}`,
      },
      method,
      body: JSON.stringify(body)
    });
    return await res.json();
  }

  async function getCurrentPlaying() {
    return (await fetchWebApi('v1/me/player/currently-playing', 'GET'));
  }

  const [songName, setSongName] = useState('')
  const [artistName, setArtistName] = useState('')
  const [progress, setProgress] = useState(0)
  const [actualProgress, setActualProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [albumCover, setAlbumCover] = useState('')

  useEffect(() => {
    if (!token) {
      return;
    }

    const intervalID = setInterval(() => {
      getCurrentPlaying().then(currentPlaying => {
        console.log(currentPlaying)
        if (currentPlaying.error && currentPlaying.error.status === 401) {
          console.log("-------------------")
          console.log(token)
          console.log(currentPlaying.error.message)
          refreshToken(refreshTokenString, host).then(data => {
            console.log("data", data)
            localStorage.setItem('token', data.access_token)
          });

          return;
        }

        if (!currentPlaying || !currentPlaying.item || !currentPlaying.item.name)
          return;

        setSongName(currentPlaying.item.name)
        setArtistName(currentPlaying.item.artists[0].name)
        setProgress(currentPlaying.progress_ms)
        setActualProgress(currentPlaying.progress_ms)
        setDuration(currentPlaying.item.duration_ms)
        setAlbumCover(currentPlaying.item.album.images[0].url)
      })
    }, 1000)

    return () => clearInterval(intervalID)
  }, [token, refreshTokenString, host])

  if (!token) {
    return (
      <div>
        <h1>
          token not found. you are not meant to access this link directly. use the link generator
        </h1>
      </div>)
  }

  return (
    <div className="w-full h-screen flex flex-grow bg-green-500 font-sans text-white">
      <div>
        <div className='flex p-2 '>
          {vinyl ? (
            <div className="relative h-[100px] w-[100px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-[20px] w-[20px] bg-green-500 rounded-full"></div>
              </div>
              <div className="relative flex items-center justify-center overflow-hidden bg-black rounded-full animate-spin-slow">
                <div className="absolute w-[38%] h-[38%] bg-green-500 rounded-full" />
                {albumCover && <Image src={albumCover} width={500} height={500} className="rounded-full" alt="Album Cover" />}
              </div>
            </div>
          ) : (
            <div className="h-[100px] w-[100px]">
              {albumCover && <Image src={albumCover} width={500} height={500} className="rounded-[1rem]" alt="Album Cover" />}
            </div>
          )}
          <div className='flex flex-col -mt-4'>
            <h1 className='text-[3rem] font-extrabold flex my-auto ml-4'>
              {songName} <span className='text-[1.5rem] my-auto mx-6'>by</span> {artistName}
            </h1>
            <div className='flex -my-1 -'>
              <div className='text-[1.5rem] my-auto mx-6'>
                {Math.floor(actualProgress / 60000)}:{((actualProgress / 1000) % 60).toFixed(0).toString().padStart(2, '0')}
              </div>

              <div className='h-3 w-[400px] bg-gray-300 rounded-lg overflow-none my-auto'>
                <div
                  style={{ width: `${progress / duration * 100}%` }}
                  className={`rounded-lg h-full bg-gray-700`}>
                </div>
              </div>
              <div className='text-[1.5rem] my-auto mx-6'>
                {Math.floor(duration / 60000)}:{((duration / 1000) % 60).toFixed(0).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
