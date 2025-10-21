import { createClient } from '@/lib/supabase/server';

export interface FeatureRequestWithDetails {
  id: string;
  user_id: string;
  title: string;
  description: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
  user_email?: string;
  comment_count?: number;
  user_has_upvoted?: boolean;
  users?: { email: string };
}

export interface FeatureRequestComment {
  id: string;
  feature_request_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

export const featureRequestsService = {
  // Get all feature requests with upvote counts and user's vote status
  async getAllFeatureRequests(userId?: string): Promise<FeatureRequestWithDetails[]> {
    const supabase = await createClient();

    const { data: requests, error } = await supabase
      .from('feature_requests')
      .select('*')
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feature requests:', error);
      return [];
    }

    if (!requests) return [];

    // Get comment counts
    const { data: commentCounts } = await supabase
      .from('feature_request_comments')
      .select('feature_request_id');

    const commentCountMap = commentCounts?.reduce((acc, comment) => {
      acc[comment.feature_request_id] = (acc[comment.feature_request_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get user's upvotes if logged in
    let userUpvotes: Set<string> = new Set();
    if (userId) {
      const { data: upvotes } = await supabase
        .from('feature_request_upvotes')
        .select('feature_request_id')
        .eq('user_id', userId);

      userUpvotes = new Set(upvotes?.map(v => v.feature_request_id) || []);
    }

    // Get user emails separately
    const userIds = [...new Set(requests.map(r => r.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const userEmailMap = users?.reduce((acc, user) => {
      acc[user.id] = user.email;
      return acc;
    }, {} as Record<string, string>) || {};

    return requests.map(req => ({
      id: req.id,
      user_id: req.user_id,
      title: req.title,
      description: req.description,
      upvotes: req.upvotes,
      created_at: req.created_at,
      updated_at: req.updated_at,
      user_email: userEmailMap[req.user_id],
      comment_count: commentCountMap[req.id] || 0,
      user_has_upvoted: userUpvotes.has(req.id),
    }));
  },

  // Create a new feature request
  async createFeatureRequest(userId: string, title: string, description: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('feature_requests')
      .insert({
        user_id: userId,
        title,
        description,
        upvotes: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Toggle upvote
  async toggleUpvote(userId: string, featureRequestId: string) {
    const supabase = await createClient();

    // Check if user already upvoted
    const { data: existing } = await supabase
      .from('feature_request_upvotes')
      .select('id')
      .eq('user_id', userId)
      .eq('feature_request_id', featureRequestId)
      .single();

    if (existing) {
      // Remove upvote
      await supabase
        .from('feature_request_upvotes')
        .delete()
        .eq('id', existing.id);

      // Decrement count
      const { data: request } = await supabase
        .from('feature_requests')
        .select('upvotes')
        .eq('id', featureRequestId)
        .single();

      await supabase
        .from('feature_requests')
        .update({ upvotes: (request?.upvotes || 1) - 1 })
        .eq('id', featureRequestId);

      return { upvoted: false };
    } else {
      // Add upvote
      await supabase
        .from('feature_request_upvotes')
        .insert({
          user_id: userId,
          feature_request_id: featureRequestId,
        });

      // Increment count
      const { data: request } = await supabase
        .from('feature_requests')
        .select('upvotes')
        .eq('id', featureRequestId)
        .single();

      await supabase
        .from('feature_requests')
        .update({ upvotes: (request?.upvotes || 0) + 1 })
        .eq('id', featureRequestId);

      return { upvoted: true };
    }
  },

  // Get comments for a feature request
  async getComments(featureRequestId: string): Promise<FeatureRequestComment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('feature_request_comments')
      .select('*')
      .eq('feature_request_id', featureRequestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    if (!data) return [];

    // Get user emails separately
    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const userEmailMap = users?.reduce((acc, user) => {
      acc[user.id] = user.email;
      return acc;
    }, {} as Record<string, string>) || {};

    return data.map(comment => ({
      id: comment.id,
      feature_request_id: comment.feature_request_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user_email: userEmailMap[comment.user_id],
    }));
  },

  // Add a comment
  async addComment(userId: string, featureRequestId: string, content: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('feature_request_comments')
      .insert({
        user_id: userId,
        feature_request_id: featureRequestId,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a feature request (only by owner)
  async deleteFeatureRequest(userId: string, featureRequestId: string) {
    const supabase = await createClient();

    // Delete comments first
    await supabase
      .from('feature_request_comments')
      .delete()
      .eq('feature_request_id', featureRequestId);

    // Delete upvotes
    await supabase
      .from('feature_request_upvotes')
      .delete()
      .eq('feature_request_id', featureRequestId);

    // Delete request
    const { error } = await supabase
      .from('feature_requests')
      .delete()
      .eq('id', featureRequestId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
