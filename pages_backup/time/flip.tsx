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

export default function Home({ host }: { host: string }) {

    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            // set minutes and seconds
            const time = new Date();

        }, 1000)
        return () => clearInterval(interval)
    }, [])


    return (
        <div
            className={`w-full h-full bg-black font-sans text-white transition-all duration-500`}
        >

            <div className={`flex flex-grow gap-6 my-auto m-[5rem]`}>
                <div className='bg-zinc-900  flex-1 rounded-[2rem] aspect-square flex flex-col ' >
                    <h1 className='auto-resize-text m-auto font-bold'>05</h1>
                </div>
                <div className='bg-zinc-900 flex flex-1 rounded-[2rem] aspect-square' >
                    <h1 className='auto-resize-text m-auto font-bold'>05</h1>

                </div>
            </div>
        </div>
    )
}


// server side props
export async function getServerSideProps(context) {
    // get params

    const workingTime = context.query.workingTime

    const host = process.env.HOST;

    if (workingTime) {
        return {
            props: {
                workingTime,
                requestAnimationFrame: context.query.restTime,
                startTime: context.query.startTime,
                host
            },
        };
    }

    return {
        props: {

        }
    }
}
