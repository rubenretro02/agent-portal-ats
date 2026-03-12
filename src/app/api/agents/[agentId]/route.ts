import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    // Verify the user is authenticated
    const serverSupabase = await createServerSupabaseClient();
    if (!serverSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the agent
    const { data: agent, error: agentError } = await adminSupabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError) {
      console.error('Error fetching agent:', agentError);
      return NextResponse.json({ error: agentError.message }, { status: 500 });
    }

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Fetch the profile using user_id
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, address, date_of_birth')
      .eq('id', agent.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Continue without profile data
    }

    // Fetch documents
    const { data: documents } = await adminSupabase
      .from('documents')
      .select('*')
      .eq('agent_id', agentId)
      .order('uploaded_at', { ascending: false });

    // Fetch applications with opportunities
    const { data: applications } = await adminSupabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        opportunities (
          id,
          name,
          client
        )
      `)
      .eq('agent_id', agentId)
      .order('submitted_at', { ascending: false });

    return NextResponse.json({
      agent: {
        ...agent,
        profiles: profile || null,
      },
      documents: documents || [],
      applications: applications || [],
    });
  } catch (error) {
    console.error('Error in agent API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
