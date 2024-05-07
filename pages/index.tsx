import Image from 'next/image';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { fetchSpotifyAccessToken, refreshToken } from '../utils/spotify';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import 'react-notifications/lib/notifications.css';

const inter = Inter({ subsets: ['latin'] });

export default function Home({ host, token, refreshTokenA }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: token ? 'spotify' : null,
    },
  });

  const type = watch('type');
  const [link, setLink] = useState('');

  useEffect(() => {
    if (token) {
      // Generate and display link for Spotify overlay
      const url = `${host}spotify?token=${token}&refreshToken=${refreshTokenA}`;
      setLink(url);
    }
  }, []);

  // Copy the generated link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(link);
    NotificationManager.success('Link has been copied. You can now paste it in OBS!', 'Success! Woo!');
  };

  const onSubmit = (data) => {
    console.log(data);
    const { type, workingTime, restTime } = data;
    const timeNow = new Date().getTime();

    if (type === 'pomodoro') {
      // Generate link for Pomodoro overlay
      const url = `${host}pomodoro?workingTime=${workingTime}&restTime=${restTime}&startTime=${timeNow}`;
      setLink(url);
    } else if (type === 'local') {
      // Generate link for Local Time overlay
      const url = `${host}localTime`;
      setLink(url);
    }
  };

  const router = useRouter();

  return (
    <div className="bg-gray-900">
      <NotificationContainer />
      <Head>
        <title>Study Overlay</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col min-h-screen pb-10 overflow-y-auto min-w-screen">
        <div className="w-2/3 pt-20 mx-auto">
          <h1 className="text-3xl text-white">
            Welcome to the <span className="font-bold text-indigo-500">Study Overlay.</span>
          </h1>
          <h3 className="text-gray-400">
            An easy to use overlay that can be ported directly into OBS and other streaming software to add that special
            touch.
          </h3>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {/* Overlay options */}
            <div className="flex flex-col p-4 text-gray-500 bg-white rounded-xl">
              <h1 className="text-xl font-bold text-black">Pomodoro Timer</h1>
              <h6>Add a simple but cute pomodoro timer to let others keep track of their studying with you!</h6>
            </div>
            <div className="flex flex-col p-4 text-gray-500 bg-white rounded-xl">
              <h1 className="text-xl font-bold text-black">Spotify Tracker</h1>
              <h6>Let people see the songs you're listening to while studying.</h6>
            </div>
            <div className="flex flex-col p-4 text-gray-500 bg-white rounded-xl">
              <h1 className="text-xl font-bold text-black">Local Timer</h1>
              <h6>Have your local time displayed.</h6>
            </div>
          </div>
          <div>
            <h1 className="my-6 text-xl">
              This project is independently managed and hosted by Stefan Ciutina. To show support follow me{' '}
              <Link className="font-bold text-indigo-500" href="https://instagram.com/stfn.c">
                @stfn.c
              </Link>
              .
            </h1>
          </div>
          <div className="text-gray-500">
            <h1 className="mt-10 mb-1 text-3xl font-bold text-white">Steps</h1>
            <ul className="list-decimal">
              <h1>(If you have already setup OBS skip to step 3)</h1>
              <li>Download OBS and open it</li>
              <li>
                Click add source (bottom left-ish area) and choose the camera option. Then press new and select your
                camera. You should see it pop up on the main screen now
              </li>
              <li>Scroll down to link generator and select type of overlay</li>
              <li>Complete details (if you selected pomodoro timer, then add how many minutes of work and rest)</li>
              <li>Press generate link and copy the link</li>
              <li>Open OBS and click "Add Source" (the plus button in the sources tab)</li>
              <li>Select "Browser" -&gt; Create New -&gt; Ok</li>
              <li>Then add the copied URL and change width to 1000 pixels and height to 200 pixels</li>
              <li>Lastly, add the filter "Chroma Key" to the browser source (this will make the background transparent)</li>
              <li>Enjoy!!</li>
            </ul>
          </div>
          <div>
            <h1 className="mt-10 mb-1 text-3xl font-bold text-indigo-500">
              <span className="text-white">Link</span> Generator!
            </h1>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid w-full grid-cols-3 gap-3 pb-4">
                {/* Overlay type selection */}
                <div className="flex items-center flex-1 pl-4 border border-gray-200 rounded">
                  <input
                    value="pomodoro"
                    {...register('type', { required: 'Please choose a site type' })}
                    type="radio"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <label className="w-full py-4 ml-2 text-sm font-medium text-gray-400">
                    <span className="font-bold text-white">Pomodoro Timer</span> - cute little clock.
                  </label>
                </div>
                <div className="flex items-center flex-1 pl-4 border border-gray-200 rounded">
                  <input
                    value="spotify"
                    {...register('type')}
                    type="radio"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <label className="w-full py-4 ml-2 text-sm font-medium text-gray-400">
                    <span className="font-bold text-white">Spotify Tracker</span> - show your current songs.
                  </label>
                </div>
                <div className="flex items-center flex-1 pl-4 border border-gray-200 rounded">
                  <input
                    value="local"
                    {...register('type')}
                    type="radio"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <label className="w-full py-4 ml-2 text-sm font-medium text-gray-400">
                    <span className="font-bold text-white">Local time</span> - display local time.
                  </label>
                </div>
              </div>

              {/* Pomodoro timer inputs */}
              {type === 'pomodoro' && (
                <div className="flex flex-col gap-2">
                  <input
                    {...register('workingTime', { required: 'Choose a working time for your pomodoro timer.' })}
                    type="text"
                    className="rounded bg-gray-100 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-800 p-2.5 "
                    placeholder="Work Time (minutes)"
                  />
                  <input
                    {...register('restTime', { required: 'Choose a resting time for your pomodoro timer.' })}
                    type="text"
                    className="rounded bg-gray-100 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-800 p-2.5 "
                    placeholder="Rest Time (minutes)"
                  />
                </div>
              )}

              {/* Default message when no overlay type is selected */}
              {!type && (
                <div className="w-full h-full p-10 my-4 border-8 border-indigo-500 border-solid rounded-xl">
                  <h1>Choose one of the above options to see more details.</h1>
                </div>
              )}

              {/* Display generated link */}
              {link && (
                <div className="mt-4">
                  <h1 className="font-bold text-white">Your link has been generated! Copy it from below.</h1>
                  <div className="flex gap-4 p-4 text-white bg-indigo-500 rounded-xl">
                    <div className="min-w-[50px] p-1 flex flex-col">
                      <svg
                        onClick={copyLink}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="hover:cursor-pointer lucide lucide-copy"
                      >
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                      </svg>
                      <h1 className="mx-auto text-sm text-gray-200">(copy)</h1>
                    </div>
                    <div className="flex flex-1 break-all">
                      <Link className="my-auto" href={link}>
                        {link}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Display form errors */}
              <div className="flex flex-col py-4 font-bold text-red-500">
                {errors.workingTime && <span>Please add a working time</span>}
                {errors.restTime && <span>Please add a rest time</span>}
              </div>

              {/* Generate link button */}
              {type !== 'spotify' && (
                <button
                  type="submit"
                  className={`${
                    !type ? 'hover:cursor-not-allowed' : 'test'
                  } mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  Generate Link {!type && <span className="ml-2">(select an option first)</span>}
                </button>
              )}

              {/* Spotify login button */}
              {type === 'spotify' && (
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className={`${
                      !type ? 'hover:cursor-not-allowed' : 'test'
                    } mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    onClick={() => {
                      let params = new URLSearchParams({
                        response_type: 'code',
                        client_id: 'fb31251099ec4a96a54f36d223ceb448',
                        scope: 'user-read-currently-playing',
                        redirect_uri: host,
                      });

                      const url = `https://accounts.spotify.com/authorize?${params.toString()}`;

                      // Redirect to Spotify login
                      router.push(url);
                    }}
                  >
                    Click here to login to Spotify (only works for people with Spotify Premium for now)
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server-side props
export async function getServerSideProps(context) {
  const host = process.env.HOST;

  // Check if code param exists
  const code = context.query.code;
  const access_token = context.query.access_token;

  if (code) {
    const data = await fetchSpotifyAccessToken(code, host);

    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;

    // Redirect to /?access_token=accessToken&refresh_token=refreshToken
    context.res.writeHead(302, {
      Location: `/?access_token=${accessToken}&refresh_token=${refreshToken}`,
    });
    context.res.end();

    return {
      props: {},
    };
  }

  if (access_token) {
    return {
      props: {
        token: access_token,
        refreshTokenA: context.query.refresh_token,
        host,
      },
    };
  }

  return {
    props: {
      host: host || null,
    },
  };
}