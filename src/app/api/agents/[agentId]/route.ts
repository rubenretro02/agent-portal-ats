import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // First fetch the agent
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError) {
      console.error('[API] Error fetching agent:', agentError);
      // If not found, return 404
      if (agentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      return NextResponse.json({ error: agentError.message }, { status: 500 });
    }

    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Then fetch the profile using the agent's user_id
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, address, date_of_birth')
      .eq('id', agentData.user_id)
      .single();

    // Combine agent and profile
    const agent = {
      ...agentData,
      profiles: profileData || null,
    };

    // Fetch documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('agent_id', agentId)
      .order('uploaded_at', { ascending: false });

    if (docsError) {
      console.error('[API] Error fetching documents:', docsError);
    }

    // Fetch applications with opportunities
    const { data: applications, error: appsError } = await supabase
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

    if (appsError) {
      console.error('[API] Error fetching applications:', appsError);
    }

    return NextResponse.json({
      agent,
      documents: documents || [],
      applications: applications || [],
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
