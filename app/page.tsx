import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import HomePage from './home-page';
import { fetchSpotifyAccessToken } from '@/utils/spotify';

export const metadata = {
  title: 'Study Overlay',
  description: 'Clean overlays that keep your study stream focused.',
};

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const host = process.env.HOST;

  // Get search params
  const code = typeof searchParams.code === 'string' ? searchParams.code : undefined;
  const access_token = typeof searchParams.access_token === 'string' ? searchParams.access_token : undefined;
  const refresh_token_query = typeof searchParams.refresh_token === 'string' ? searchParams.refresh_token : undefined;

  // Handle Spotify OAuth callback
  if (code && host) {
    const data = await fetchSpotifyAccessToken(code, host);
    const accessToken = data.access_token;
    const refreshTokenVal = data.refresh_token;

    redirect(`/?access_token=${accessToken}&refresh_token=${refreshTokenVal}`);
  }

  // Pass tokens to client component
  if (access_token) {
    return (
      <HomePage
        token={access_token}
        refreshTokenA={refresh_token_query}
        host={host || null}
      />
    );
  }

  return <HomePage host={host || null} />;
}
