import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { featureRequestsService } from '@/lib/services/feature-requests';
import { PostHog } from 'posthog-node';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const requests = await featureRequestsService.getAllFeatureRequests(user?.id);
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Failed to fetch feature requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature requests' },
      { status: 500 }
    );
  }
}

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

    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const newRequest = await featureRequestsService.createFeatureRequest(
      user.id,
      title,
      description
    );

    // Track feature request creation
    posthog.capture({
      distinctId: user.id,
      event: 'feature_request_created',
      properties: {
        feature_request_id: newRequest.id,
        title_length: title.length,
        description_length: description.length,
      }
    });

    await posthog.shutdown();
    return NextResponse.json(newRequest);
  } catch (error) {
    console.error('Failed to create feature request:', error);
    await posthog.shutdown();
    return NextResponse.json(
      { error: 'Failed to create feature request' },
      { status: 500 }
    );
  }
}
