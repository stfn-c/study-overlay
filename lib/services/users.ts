import { createClient } from '@/lib/supabase/server';

export const usersService = {
  /**
   * Save Spotify credentials for a user
   */
  async saveSpotifyCredentials(userId: string, data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds
  }) {
    const supabase = await createClient();
    const expiresAt = new Date(Date.now() + data.expiresIn * 1000);

    const { error } = await supabase
      .from('users')
      .update({
        spotify_access_token: data.accessToken,
        spotify_refresh_token: data.refreshToken,
        spotify_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Get user's Spotify credentials
   */
  async getSpotifyCredentials(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Check if user's Spotify token is expired
   */
  async isSpotifyTokenExpired(userId: string): Promise<boolean> {
    const credentials = await this.getSpotifyCredentials(userId);

    if (!credentials.spotify_token_expires_at) return true;

    const expiresAt = new Date(credentials.spotify_token_expires_at);
    // Consider expired if within 5 minutes of expiry
    return expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
  },

  /**
   * Refresh Spotify token if needed and return valid credentials
   */
  async getValidSpotifyToken(userId: string): Promise<string | null> {
    const credentials = await this.getSpotifyCredentials(userId);

    if (!credentials.spotify_refresh_token) return null;

    const isExpired = await this.isSpotifyTokenExpired(userId);

    if (!isExpired && credentials.spotify_access_token) {
      return credentials.spotify_access_token;
    }

    // Token expired, refresh it
    const { refreshToken } = await import('@/lib/utils/spotify');
    const newTokens = await refreshToken({
      refresh_token: credentials.spotify_refresh_token
    });

    if (!newTokens) return null;

    // Save new tokens
    await this.saveSpotifyCredentials(userId, {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token || credentials.spotify_refresh_token,
      expiresIn: newTokens.expires_in || 3600,
    });

    return newTokens.access_token;
  },
};
