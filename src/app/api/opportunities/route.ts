import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .select('*, application_questions(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching opportunities:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Transform data to include applicationQuestions and applicationStages
    const opportunities = data?.map(opp => ({
      ...opp,
      applicationQuestions: opp.application_questions || [],
      applicationStages: opp.application_stages || [],
      capacity: {
        maxAgents: opp.max_agents || 0,
        currentAgents: opp.current_agents || 0,
        openPositions: opp.open_positions || 0,
      },
    })) || [];

    return NextResponse.json({ success: true, data: opportunities });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
