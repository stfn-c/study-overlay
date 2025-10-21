import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { featureRequestsService } from '@/lib/services/feature-requests';

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

    return NextResponse.json(newRequest);
  } catch (error) {
    console.error('Failed to create feature request:', error);
    return NextResponse.json(
      { error: 'Failed to create feature request' },
      { status: 500 }
    );
  }
}
