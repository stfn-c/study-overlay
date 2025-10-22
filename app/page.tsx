import { redirect } from 'next/navigation';
import HomePage from './home-page';
import { fetchSpotifyAccessToken } from '@/lib/utils/spotify';
import { createClient } from '@/lib/supabase/server';
import { usersService } from '@/lib/services/users';
import { featureRequestsService } from '@/lib/services/feature-requests';

// Disable caching for this page to ensure fresh widget data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const host = process.env.HOST || 'http://localhost:3000';

  const code = typeof params.code === 'string' ? params.code : undefined;
  const access_token = typeof params.access_token === 'string' ? params.access_token : undefined;
  const refresh_token = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;

  // Get current user from Supabase
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Handle Spotify OAuth callback
  if (code && user) {
    try {
      // Spotify redirect URI must match exactly what's configured in the app
      const redirectUri = host; // This should be http://localhost:3000 or your production URL
      const data = await fetchSpotifyAccessToken(code, redirectUri);

      // Save Spotify credentials to users table
      await usersService.saveSpotifyCredentials(user.id, {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600,
      });

      redirect('/?spotify_connected=true');
    } catch (error) {
      console.error('Failed to save Spotify credentials:', error);
      redirect('/?spotify_error=true');
    }
  }

  // Fetch user's widgets if logged in
  let initialWidgets = [];
  let spotifyToken = null;
  let spotifyRefreshToken = null;
  let onboardingProgress = { obsInstalled: null as 'yes' | 'no' | null, sceneReady: null as 'yes' | 'no' | null };

  if (user) {
    // Parallelize independent database queries for faster loading
    const [
      { data: widgets },
      spotifyData,
      onboarding
    ] = await Promise.all([
      supabase
        .from('widgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      // Get Spotify credentials from database
      (async () => {
        try {
          const validToken = await usersService.getValidSpotifyToken(user.id);
          const credentials = await usersService.getSpotifyCredentials(user.id);
          return { validToken, refreshToken: credentials.spotify_refresh_token };
        } catch (error) {
          console.log('No Spotify credentials found for user');
          return null;
        }
      })(),
      // Get onboarding progress
      usersService.getOnboardingProgress(user.id).catch(() => {
        console.log('No onboarding progress found for user');
        return { obsInstalled: null as 'yes' | 'no' | null, sceneReady: null as 'yes' | 'no' | null };
      })
    ]);

    initialWidgets = widgets || [];
    spotifyToken = spotifyData?.validToken || null;
    spotifyRefreshToken = spotifyData?.refreshToken || null;
    onboardingProgress = onboarding;
  }

  // Fetch feature requests for everyone
  const featureRequests = await featureRequestsService.getAllFeatureRequests(user?.id);

  return (
    <HomePage
      host={host}
      token={spotifyToken || access_token}
      refreshToken={spotifyRefreshToken || refresh_token}
      user={user}
      initialWidgets={initialWidgets}
      featureRequests={featureRequests}
      initialOnboardingProgress={onboardingProgress}
    />
  );
}
