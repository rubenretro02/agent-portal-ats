import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/questions/[id] - Get a single question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: question, error } = await supabase
      .from('application_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !question) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: question.id,
        question: question.question,
        questionEs: question.question_es,
        type: question.type,
        required: question.required,
        order: question.order,
        options: question.options,
        placeholder: question.placeholder,
        placeholderEs: question.placeholder_es,
        validation: question.validation,
      },
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch question' }, { status: 500 });
  }
}

// PUT /api/questions/[id] - Update a question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.question !== undefined) updateData.question = body.question;
    if (body.questionEs !== undefined) updateData.question_es = body.questionEs;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.required !== undefined) updateData.required = body.required;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.options !== undefined) updateData.options = body.options;
    if (body.placeholder !== undefined) updateData.placeholder = body.placeholder;
    if (body.placeholderEs !== undefined) updateData.placeholder_es = body.placeholderEs;
    if (body.validation !== undefined) updateData.validation = body.validation;

    const { data: question, error } = await supabase
      .from('application_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: question.id,
        question: question.question,
        questionEs: question.question_es,
        type: question.type,
        required: question.required,
        order: question.order,
        options: question.options,
        placeholder: question.placeholder,
        placeholderEs: question.placeholder_es,
        validation: question.validation,
      },
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ success: false, error: 'Failed to update question' }, { status: 500 });
  }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('application_questions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete question' }, { status: 500 });
  }
}
