import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;

    // Fetch application with agent info
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        opportunity_id,
        agent_id,
        agents (
          id,
          agent_id,
          user_id,
          pipeline_status,
          pipeline_stage,
          scores,
          languages,
          skills,
          experience,
          equipment,
          availability,
          address,
          timezone,
          preferred_language,
          created_at,
          profiles (
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    // Fetch application answers
    const { data: answers, error: answersError } = await supabase
      .from('application_answers')
      .select('*')
      .eq('application_id', applicationId);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
    }

    // Fetch opportunity questions to match with answers
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('*, application_questions(*)')
      .eq('id', application.opportunity_id)
      .single();

    if (oppError) {
      console.error('Error fetching opportunity:', oppError);
    }

    // Match answers with questions
    const questionsWithAnswers = (opportunity?.application_questions || []).map((q: any) => {
      const answer = answers?.find((a: any) => a.question_id === q.id);
      return {
        id: q.id,
        question: q.question,
        type: q.type,
        required: q.required,
        options: q.options,
        answer: answer?.value || null,
      };
    });

    return NextResponse.json({
      application: {
        ...application,
        agent: application.agents,
        answers: questionsWithAnswers,
        opportunity: opportunity ? {
          id: opportunity.id,
          name: opportunity.name,
          client: opportunity.client,
        } : null,
      },
    });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
