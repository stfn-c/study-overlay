import SpotifyClient from './spotify-client';

export default async function SpotifyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  const refreshToken = typeof params.refreshToken === 'string' ? params.refreshToken : undefined;
  const vinyl = params.vinyl === 'true';
  const style = (typeof params.style === 'string' ? params.style : 'default') as 'glassmorphism' | 'vinyl' | 'default';

  if (!token || !refreshToken) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-white p-8" style={{ backgroundColor: 'transparent' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Missing Token</h1>
          <p>Please connect your Spotify account from the home page.</p>
        </div>
      </div>
    );
  }

  const host = process.env.HOST || 'http://localhost:3000';

  return (
    <SpotifyClient
      token={token}
      refreshToken={refreshToken}
      host={host}
      vinyl={vinyl}
      style={vinyl ? 'vinyl' : style}
    />
  );
}
