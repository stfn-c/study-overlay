-- Fix RLS policies for widgets table
-- Run this with: psql <your-connection-string> -f migrations/001_fix_rls_policies.sql

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "authenticated users can view own widgets" ON widgets;
DROP POLICY IF EXISTS "authenticated users can insert own widgets" ON widgets;
DROP POLICY IF EXISTS "authenticated users can update own widgets" ON widgets;
DROP POLICY IF EXISTS "authenticated users can delete own widgets" ON widgets;
DROP POLICY IF EXISTS "anyone can view widgets for display" ON widgets;

-- Recreate policies with correct syntax
CREATE POLICY "authenticated users can view own widgets"
ON widgets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated users can insert own widgets"
ON widgets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated users can update own widgets"
ON widgets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated users can delete own widgets"
ON widgets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow widgets to be viewed publicly (for the /widget route in OBS)
CREATE POLICY "anyone can view widgets for display"
ON widgets FOR SELECT
TO anon, authenticated
USING (true);

-- Create feature requests tables
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_request_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_request_id, user_id)
);

CREATE TABLE IF NOT EXISTS feature_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on feature request tables
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view feature requests" ON feature_requests;
DROP POLICY IF EXISTS "Authenticated users can insert" ON feature_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON feature_requests;
DROP POLICY IF EXISTS "Users can delete own requests" ON feature_requests;

DROP POLICY IF EXISTS "Anyone can view upvotes" ON feature_request_upvotes;
DROP POLICY IF EXISTS "Authenticated users can upvote" ON feature_request_upvotes;
DROP POLICY IF EXISTS "Users can remove own upvotes" ON feature_request_upvotes;

DROP POLICY IF EXISTS "Anyone can view comments" ON feature_request_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON feature_request_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON feature_request_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON feature_request_comments;

-- RLS Policies for feature_requests
CREATE POLICY "Anyone can view feature requests"
ON feature_requests FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can insert"
ON feature_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
ON feature_requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests"
ON feature_requests FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for upvotes
CREATE POLICY "Anyone can view upvotes"
ON feature_request_upvotes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can upvote"
ON feature_request_upvotes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own upvotes"
ON feature_request_upvotes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments"
ON feature_request_comments FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can comment"
ON feature_request_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON feature_request_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON feature_request_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_requests_upvotes ON feature_requests(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_request_upvotes_user ON feature_request_upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_upvotes_request ON feature_request_upvotes(feature_request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_request ON feature_request_comments(feature_request_id);
