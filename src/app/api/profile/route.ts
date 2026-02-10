import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  try {
    // First, verify the user is authenticated using the regular server client
    const serverSupabase = await createServerClient();
    if (!serverSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the service role client to bypass RLS and avoid infinite recursion
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      // Fallback: try with the regular client anyway
      const { data: profile, error: profileError } = await serverSupabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return NextResponse.json({ error: profileError.message, code: profileError.code }, { status: 500 });
      }

      let agent = null;
      if (profile && profile.role === 'agent') {
        const { data: agentData } = await serverSupabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .single();
        agent = agentData;
      }

      return NextResponse.json({ profile, agent });
    }

    // Service role client bypasses ALL RLS policies
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message, code: profileError.code }, { status: 500 });
    }

    let agent = null;
    if (profile && profile.role === 'agent') {
      const { data: agentData } = await adminSupabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();
      agent = agentData;
    }

    return NextResponse.json({ profile, agent });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
