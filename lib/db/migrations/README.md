# Database Setup Instructions

## Running the Users Table Migration

Follow these steps to set up the users table in your Supabase database:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `001_create_users_table.sql`
5. Click **Run** or press `Ctrl/Cmd + Enter`

### Option 2: Via Command Line

```bash
# Make sure you have the Supabase CLI installed
# Then run:
supabase db push
```

## What This Migration Does

1. **Creates `users` table** with:
   - Links to Google Auth via `auth.users(id)`
   - Stores user profile (email, name, avatar)
   - Stores Spotify OAuth credentials (access token, refresh token, expiry)

2. **Sets up Row Level Security (RLS)**
   - Users can only view and update their own profile

3. **Creates automatic trigger**
   - Automatically creates a user profile when someone signs up via Google Auth
   - Pulls email, name, and avatar from Google OAuth

4. **Auto-updates timestamps**
   - `updated_at` field updates automatically on any change

## After Running Migration

The users table will work automatically:

- ✅ **Sign up**: User profile created automatically
- ✅ **Spotify auth**: Tokens saved to database
- ✅ **Token refresh**: Happens automatically when expired
- ✅ **Persistent auth**: Spotify works forever (tokens refresh automatically)

## Testing

1. Sign in with Google
2. Connect Spotify
3. Check the `users` table in Supabase - you should see your Spotify tokens stored
4. Wait for token to expire (or set a short expiry) - it will auto-refresh
