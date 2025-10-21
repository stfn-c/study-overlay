import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usersService } from '@/lib/services/users';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { obsInstalled, sceneReady } = body;

    await usersService.saveOnboardingProgress(user.id, {
      obsInstalled,
      sceneReady,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save onboarding progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
