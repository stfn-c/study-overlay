'use client'

import Image from 'next/image';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import 'react-notifications/lib/notifications.css';

const inter = Inter({ subsets: ['latin'] });

interface HomeProps {
  host?: string | null;
  token?: string | null;
  refreshTokenA?: string | null;
}

interface FormData extends FieldValues {
  type: 'pomodoro' | 'spotify' | 'local' | null;
  workingTime?: string;
  restTime?: string;
}

export default function HomePage({ host, token, refreshTokenA }: HomeProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      type: token ? 'spotify' : null,
      workingTime: '',
      restTime: '',
    },
  });

  const type = watch('type');
  const [link, setLink] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (token && host) {
      // Generate and display link for Spotify overlay
      const url = `${host}spotify?token=${token}&refreshToken=${refreshTokenA}`;
      setLink(url);
    }
  }, [host, refreshTokenA, token]);

  // Copy the generated link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(link);
    NotificationManager.success('Link has been copied. You can now paste it in OBS!', 'Success! Woo!');
  };

  const onSubmit = (data: FormData) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NotificationContainer />
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-20">
        <header className="grid flex-1 gap-12 py-24 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
              Study Overlay
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Clean overlays that keep your study stream focused.
            </h1>
            <p className="max-w-xl text-lg text-slate-200">
              Generate a Pomodoro timer, highlight your current Spotify track, or simply show the time – all with links
              that drop straight into OBS.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Ready in under a minute
              </span>
              <span>Optimised for transparent browser sources</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-lg shadow-slate-900/40">
            <h2 className="text-base font-semibold text-white">Built by Stefan Ciutina</h2>
            <p className="mt-4 text-sm leading-6 text-slate-200">
              Study Overlay is run as a one-person project. If it makes your stream smoother, feel free to show some love
              on Instagram.
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-200 transition hover:text-indigo-100"
              href="https://instagram.com/stfn.c"
            >
              Follow @stfn.c
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </Link>
          </div>
        </header>

        <section className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Overlay presets</h2>
              <p className="mt-2 text-sm text-slate-200">Pick what you need – you can tweak everything in the generator below.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="space-y-3 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-900/40">
              <h3 className="text-lg font-semibold text-white">Pomodoro Timer</h3>
              <p className="text-sm text-slate-200">
                Keep your audience synced with your focus and break cycles.
              </p>
            </article>
            <article className="space-y-3 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-900/40">
              <h3 className="text-lg font-semibold text-white">Spotify Tracker</h3>
              <p className="text-sm text-slate-200">Share what you are vibing to in real time with Premium accounts.</p>
            </article>
            <article className="space-y-3 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-900/40">
              <h3 className="text-lg font-semibold text-white">Local Time</h3>
              <p className="text-sm text-slate-200">Display your current timezone without clutter.</p>
            </article>
          </div>
        </section>

        <section className="mt-20 space-y-6">
          <h2 className="text-2xl font-semibold text-white">Add it to OBS</h2>
          <ol className="grid gap-4 text-sm text-slate-200 md:grid-cols-2">
            <li className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-900/40">
              <span className="font-medium text-white">1. Set up your scene</span>
              <p className="mt-2 leading-6">Install OBS, add your camera, and arrange your layout.</p>
            </li>
            <li className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-900/40">
              <span className="font-medium text-white">2. Generate your overlay link</span>
              <p className="mt-2 leading-6">Choose the overlay below and copy the generated URL.</p>
            </li>
            <li className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-900/40">
              <span className="font-medium text-white">3. Add a browser source</span>
              <p className="mt-2 leading-6">Paste the link into a 1000×200 browser source and apply a chroma key filter.</p>
            </li>
            <li className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-900/40">
              <span className="font-medium text-white">4. Stream and enjoy</span>
              <p className="mt-2 leading-6">Focus on studying – the overlay keeps your viewers in the loop.</p>
            </li>
          </ol>
        </section>

        <section className="mt-20 rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-900/40">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Link generator</h2>
              <p className="mt-2 text-sm text-slate-200">Select an overlay, add details if needed, then copy the link for OBS.</p>
            </div>
            {type === 'spotify' && (
              <span className="rounded-full border border-emerald-400/60 bg-emerald-500/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-100">
                Spotify login required
              </span>
            )}
          </div>

          <form className="mt-10 space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-3 md:grid-cols-3">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  type === 'pomodoro'
                    ? 'border-indigo-300 bg-indigo-400/15'
                    : 'border-slate-700 bg-transparent hover:border-slate-500'
                }`}
              >
                <input
                  {...register('type', { required: 'Please choose a site type' })}
                  type="radio"
                  value="pomodoro"
                  className="mt-1 h-4 w-4 border-slate-600 bg-transparent text-indigo-400 focus:ring-indigo-400"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Pomodoro Timer</span>
                  <span className="mt-1 block text-xs text-slate-200">Work and break intervals with a clean progress bar.</span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  type === 'spotify'
                    ? 'border-indigo-300 bg-indigo-400/15'
                    : 'border-slate-700 bg-transparent hover:border-slate-500'
                }`}
              >
                <input
                  {...register('type')}
                  type="radio"
                  value="spotify"
                  className="mt-1 h-4 w-4 border-slate-600 bg-transparent text-indigo-400 focus:ring-indigo-400"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Spotify Tracker</span>
                  <span className="mt-1 block text-xs text-slate-200">Live track info for Spotify Premium listeners.</span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  type === 'local'
                    ? 'border-indigo-300 bg-indigo-400/15'
                    : 'border-slate-700 bg-transparent hover:border-slate-500'
                }`}
              >
                <input
                  {...register('type')}
                  type="radio"
                  value="local"
                  className="mt-1 h-4 w-4 border-slate-600 bg-transparent text-indigo-400 focus:ring-indigo-400"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Local Time</span>
                  <span className="mt-1 block text-xs text-slate-200">Minimal clock synced to your timezone.</span>
                </span>
              </label>
            </div>

            {type === 'pomodoro' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-white">Work time (minutes)</span>
                  <input
                    {...register('workingTime', { required: 'Choose a working time for your pomodoro timer.' })}
                    type="text"
                    placeholder="e.g. 25"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-white">Rest time (minutes)</span>
                  <input
                    {...register('restTime', { required: 'Choose a resting time for your pomodoro timer.' })}
                    type="text"
                    placeholder="e.g. 5"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
                  />
                </label>
              </div>
            )}

            {!type && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 text-sm text-slate-200">
                Choose an overlay above to see the options.
              </div>
            )}

            {link && (
              <div className="rounded-2xl border border-indigo-400/50 bg-indigo-500/10 p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/20"
                  >
                    Copy link
                  </button>
                  <Link className="flex-1 break-all text-sm text-indigo-50" href={link}>
                    {link}
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-1 text-sm font-semibold text-rose-400">
              {errors.workingTime && <span>Please add a working time</span>}
              {errors.restTime && <span>Please add a rest time</span>}
            </div>

            {type !== 'spotify' && (
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-indigo-500/40"
                disabled={!type}
              >
                {type ? 'Generate link' : 'Choose an overlay above'}
              </button>
            )}

            {type === 'spotify' && (
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 focus:ring-offset-2 focus:ring-offset-slate-950"
                onClick={() => {
                  if (typeof host !== 'string') {
                    console.error('Host is not configured, cannot initiate Spotify login.');
                    NotificationManager.error('Configuration error: Cannot connect to Spotify.', 'Error');
                    return;
                  }
                  const params = new URLSearchParams({
                    response_type: 'code',
                    client_id: 'fb31251099ec4a96a54f36d223ceb448',
                    scope: 'user-read-currently-playing',
                    redirect_uri: host,
                  });

                  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
                  router.push(url);
                }}
              >
                Connect Spotify Premium account
              </button>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
