import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { featureRequestsService } from '@/lib/services/feature-requests';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await featureRequestsService.deleteFeatureRequest(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete feature request:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature request' },
      { status: 500 }
    );
  }
}
