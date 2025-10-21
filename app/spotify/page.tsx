import SpotifyClient from './spotify-client';

export default async function SpotifyPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const host = process.env.HOST;
  const access_token = typeof searchParams.token === 'string' ? searchParams.token : undefined;
  const refreshTokenString = typeof searchParams.refreshToken === 'string' ? searchParams.refreshToken : undefined;
  const vinyl = searchParams.vinyl === 'true';

  if (!access_token || !refreshTokenString || !host) {
    return (
      <div>
        <h1>
          Missing required parameters. Please use the link generator on the home page.
        </h1>
      </div>
    );
  }

  return (
    <SpotifyClient
      token={access_token}
      refreshTokenString={refreshTokenString}
      host={host}
      vinyl={vinyl}
    />
  );
}
