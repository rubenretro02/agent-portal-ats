import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/opportunities/[id]/questions - Get all questions for an opportunity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: questions, error } = await supabase
      .from('application_questions')
      .select('*')
      .eq('opportunity_id', id)
      .order('order', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const parsed = (questions || []).map((q) => ({
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
    }));

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/questions - Create a new question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get the highest order number
    const { data: maxOrderData } = await supabase
      .from('application_questions')
      .select('order')
      .eq('opportunity_id', id)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderData?.order || 0) + 1;

    const { data: question, error } = await supabase
      .from('application_questions')
      .insert({
        opportunity_id: id,
        question: body.question,
        question_es: body.questionEs,
        type: body.type || 'text',
        required: body.required || false,
        order: body.order ?? nextOrder,
        options: body.options || null,
        placeholder: body.placeholder,
        placeholder_es: body.placeholderEs,
        validation: body.validation || null,
      })
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ success: false, error: 'Failed to create question' }, { status: 500 });
  }
}

// PUT /api/opportunities/[id]/questions - Bulk update questions (for reordering)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Body should be an array of questions with their new orders
    const questions = body.questions as Array<{ id: string; order: number }>;

    // Update all questions
    for (const q of questions) {
      await supabase
        .from('application_questions')
        .update({ order: q.order })
        .eq('id', q.id);
    }

    // Fetch updated questions
    const { data: updatedQuestions, error } = await supabase
      .from('application_questions')
      .select('*')
      .eq('opportunity_id', id)
      .order('order', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const parsed = (updatedQuestions || []).map((q) => ({
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
    }));

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error updating questions order:', error);
    return NextResponse.json({ success: false, error: 'Failed to update questions' }, { status: 500 });
  }
}
