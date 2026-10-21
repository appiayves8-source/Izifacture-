import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    // Query profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_subscribed, subscription_ends_at, invoices_count')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('[api/subscription/check] Profile query error:', profileError);
    }

    const now = new Date();
    const endsAt = profile?.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
    const isActive = Boolean(profile?.is_subscribed && endsAt && endsAt.getTime() > now.getTime());

    return NextResponse.json({
      isActive,
      endsAt: endsAt ? endsAt.toISOString() : null,
      plan: 'pro_5000',
      invoicesCount: profile?.invoices_count || 0,
    });
  } catch (err: unknown) {
    console.error('[api/subscription/check] Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
