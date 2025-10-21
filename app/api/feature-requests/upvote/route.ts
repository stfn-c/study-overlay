import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { featureRequestsService } from '@/lib/services/feature-requests';

export async function POST(request: Request) {
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
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to toggle upvote:', error);
    return NextResponse.json(
      { error: 'Failed to toggle upvote' },
      { status: 500 }
    );
  }
}
