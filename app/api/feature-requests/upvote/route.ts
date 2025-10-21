import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { featureRequestsService } from '@/lib/services/feature-requests';
import { PostHog } from 'posthog-node';

export async function POST(request: Request) {
  const posthog = new PostHog(
    process.env.NEXT_PUBLIC_POSTHOG_KEY!,
    { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
  );

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureRequestId } = await request.json();

    if (!featureRequestId) {
      return NextResponse.json(
        { error: 'Feature request ID is required' },
        { status: 400 }
      );
    }

    const result = await featureRequestsService.toggleUpvote(user.id, featureRequestId);

    // Track upvote action
    posthog.capture({
      distinctId: user.id,
      event: result.upvoted ? 'feature_request_upvoted' : 'feature_request_unupvoted',
      properties: {
        feature_request_id: featureRequestId,
      }
    });

    await posthog.shutdown();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to toggle upvote:', error);
    await posthog.shutdown();
    return NextResponse.json(
      { error: 'Failed to toggle upvote' },
      { status: 500 }
    );
  }
}
