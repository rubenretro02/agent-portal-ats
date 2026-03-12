import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch single opportunity with questions and stages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .select('*, application_questions(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching opportunity:', error);
      return NextResponse.json({ opportunity: null }, { status: 404 });
    }

    return NextResponse.json({ opportunity: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update opportunity (including stages)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('[API] Updating opportunity:', id, body);

    // Build update object
    const updateData: Record<string, unknown> = {};

    // Handle application_stages
    if (body.applicationStages !== undefined) {
      updateData.application_stages = body.applicationStages;
    }

    // Handle other fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.client !== undefined) updateData.client = body.client;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.requirements !== undefined) updateData.requirements = body.requirements;
    if (body.compensation !== undefined) updateData.compensation = body.compensation;
    if (body.training !== undefined) updateData.training = body.training;
    if (body.schedule !== undefined) updateData.schedule = body.schedule;
    if (body.max_agents !== undefined) updateData.max_agents = body.max_agents;
    if (body.open_positions !== undefined) updateData.open_positions = body.open_positions;

    // Add updated_at
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating opportunity:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('[API] Opportunity updated:', data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete opportunity
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting opportunity:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
