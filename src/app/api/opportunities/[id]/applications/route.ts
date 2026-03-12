import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        agent_id,
        agents (
          id,
          agent_id,
          profiles (
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('opportunity_id', id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match our interface
    const transformedApplications = applications.map((app: any) => ({
      id: app.id,
      agent_id: app.agent_id,
      status: app.status,
      submitted_at: app.submitted_at,
      agent: app.agents ? {
        id: app.agents.id,
        agent_id: app.agents.agent_id,
        profiles: app.agents.profiles
      } : null
    }));

    return NextResponse.json({ applications: transformedApplications });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
