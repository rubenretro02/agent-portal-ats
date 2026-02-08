import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/opportunities/[id] - Get a single opportunity with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        application_questions (*)
      `)
      .eq('id', id)
      .single();

    if (error || !opportunity) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 });
    }

    // Format the response
    const formatted = {
      id: opportunity.id,
      name: opportunity.name,
      description: opportunity.description,
      client: opportunity.client,
      status: opportunity.status,
      category: opportunity.category,
      tags: opportunity.tags || [],
      compensation: opportunity.compensation || {},
      training: opportunity.training || {},
      requirements: opportunity.requirements || {},
      schedule: opportunity.schedule || {},
      capacity: {
        maxAgents: opportunity.max_agents,
        currentAgents: opportunity.current_agents,
        openPositions: opportunity.open_positions,
      },
      applicationQuestions: (opportunity.application_questions || [])
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
        .map((q: Record<string, unknown>) => ({
          id: q.id,
          question: q.question,
          questionEs: q.question_es,
          type: q.type,
          required: q.required,
          order: q.order,
          options: q.options,
          placeholder: q.placeholder,
          placeholderEs: q.placeholder_es,
          validation: q.validation,
        })),
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch opportunity' }, { status: 500 });
  }
}

// PUT /api/opportunities/[id] - Update an opportunity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name;
    if (body.description) updateData.description = body.description;
    if (body.client) updateData.client = body.client;
    if (body.status) updateData.status = body.status;
    if (body.category) updateData.category = body.category;
    if (body.tags) updateData.tags = body.tags;
    if (body.compensation) updateData.compensation = body.compensation;
    if (body.training) updateData.training = body.training;
    if (body.requirements) updateData.requirements = body.requirements;
    if (body.schedule) updateData.schedule = body.schedule;
    if (body.max_agents) updateData.max_agents = body.max_agents;

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: opportunity });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json({ success: false, error: 'Failed to update opportunity' }, { status: 500 });
  }
}

// DELETE /api/opportunities/[id] - Delete an opportunity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - set status to 'closed'
    const { error } = await supabase
      .from('opportunities')
      .update({ status: 'closed' })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete opportunity' }, { status: 500 });
  }
}
